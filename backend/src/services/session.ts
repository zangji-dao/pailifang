import { createHash, randomBytes } from 'node:crypto';
import {
  and,
  authSessions,
  db,
  eq,
  gt,
  isNull,
  memberRoles,
  organizationMembers,
  organizations,
  permissions,
  rolePermissions,
  roles,
  users,
} from '../database/client';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AccessRole {
  id: string;
  code: string;
  name: string;
}

export interface AccessMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  organizationType: string;
  isOwner: boolean;
  roles: AccessRole[];
  permissions: string[];
}

export interface AccessUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  avatar: string | null;
  activeOrganizationId: string | null;
  activeOrganization: AccessMembership | null;
  memberships: AccessMembership[];
  permissions: string[];
}

export interface SessionContext {
  sessionId: string;
  tokenHash: string;
  user: AccessUser;
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function loadUserAccess(userId: string, activeOrganizationId?: string | null): Promise<AccessUser | null> {
  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      phone: users.phone,
      avatar: users.avatar,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.isActive, true)))
    .limit(1);

  const user = userRows[0];
  if (!user) return null;

  const rows = await db
    .select({
      membershipId: organizationMembers.id,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationCode: organizations.code,
      organizationType: organizations.type,
      isOwner: organizationMembers.isOwner,
      roleId: roles.id,
      roleCode: roles.code,
      roleName: roles.name,
      permissionCode: permissions.code,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .leftJoin(memberRoles, eq(memberRoles.memberId, organizationMembers.id))
    .leftJoin(roles, eq(roles.id, memberRoles.roleId))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.status, 'active'),
      eq(organizations.status, 'active'),
    ));

  const membershipMap = new Map<string, AccessMembership & { roleIds: Set<string>; permissionCodes: Set<string> }>();
  for (const row of rows) {
    let membership = membershipMap.get(row.membershipId);
    if (!membership) {
      membership = {
        id: row.membershipId,
        organizationId: row.organizationId,
        organizationName: row.organizationName,
        organizationCode: row.organizationCode,
        organizationType: row.organizationType,
        isOwner: row.isOwner,
        roles: [],
        permissions: [],
        roleIds: new Set<string>(),
        permissionCodes: new Set<string>(),
      };
      membershipMap.set(row.membershipId, membership);
    }

    if (row.roleId && row.roleCode && row.roleName && !membership.roleIds.has(row.roleId)) {
      membership.roleIds.add(row.roleId);
      membership.roles.push({ id: row.roleId, code: row.roleCode, name: row.roleName });
    }
    if (row.permissionCode) membership.permissionCodes.add(row.permissionCode);
  }

  const memberships = Array.from(membershipMap.values())
    .map(({ roleIds: _roleIds, permissionCodes, ...membership }) => ({
      ...membership,
      permissions: Array.from(permissionCodes).sort(),
    }))
    .sort((left, right) => Number(right.isOwner) - Number(left.isOwner) || left.organizationName.localeCompare(right.organizationName));

  const activeOrganization = memberships.find((membership) => membership.organizationId === activeOrganizationId)
    ?? memberships[0]
    ?? null;

  return {
    ...user,
    activeOrganizationId: activeOrganization?.organizationId ?? null,
    activeOrganization,
    memberships,
    permissions: activeOrganization?.permissions ?? [],
  };
}

export async function createSession(userId: string, requestedOrganizationId?: string | null) {
  const access = await loadUserAccess(userId, requestedOrganizationId);
  if (!access) throw new Error('用户不存在或已被禁用');

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(authSessions).values({
    userId,
    tokenHash,
    activeOrganizationId: access.activeOrganizationId,
    expiresAt,
  });

  return { token, expiresAt, user: access };
}

export async function getSessionContext(token: string): Promise<SessionContext | null> {
  const tokenHash = hashSessionToken(token);
  const rows = await db
    .select({
      sessionId: authSessions.id,
      userId: authSessions.userId,
      activeOrganizationId: authSessions.activeOrganizationId,
    })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(and(
      eq(authSessions.tokenHash, tokenHash),
      isNull(authSessions.revokedAt),
      gt(authSessions.expiresAt, new Date()),
      eq(users.isActive, true),
    ))
    .limit(1);

  const session = rows[0];
  if (!session) return null;

  const user = await loadUserAccess(session.userId, session.activeOrganizationId);
  if (!user) return null;

  if (user.activeOrganizationId !== session.activeOrganizationId) {
    await db
      .update(authSessions)
      .set({ activeOrganizationId: user.activeOrganizationId, lastSeenAt: new Date() })
      .where(eq(authSessions.id, session.sessionId));
  } else {
    await db
      .update(authSessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(authSessions.id, session.sessionId));
  }

  return { sessionId: session.sessionId, tokenHash, user };
}

export async function switchSessionOrganization(sessionId: string, userId: string, organizationId: string) {
  const access = await loadUserAccess(userId, organizationId);
  if (!access || access.activeOrganizationId !== organizationId) return null;

  await db
    .update(authSessions)
    .set({ activeOrganizationId: organizationId, lastSeenAt: new Date() })
    .where(and(eq(authSessions.id, sessionId), eq(authSessions.userId, userId)));

  return access;
}

export async function revokeSession(sessionId: string) {
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(eq(authSessions.id, sessionId));
}
