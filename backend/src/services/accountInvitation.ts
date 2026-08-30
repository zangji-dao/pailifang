import { createHash, randomBytes } from 'crypto';
import {
  accountInvitations,
  and,
  db,
  eq,
  inArray,
  memberRoles,
  organizationMembers,
  organizations,
  roles,
  users,
} from '../database/client';
import { hashPassword } from './password';
import { createSession } from './session';

const INVITATION_TTL_DAYS = 7;

export class AccountInvitationError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

function hashInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createAccountInvitation(input: {
  organizationId: string;
  email: string;
  name: string;
  phone?: string | null;
  roleCodes: string[];
  invitedBy?: string | null;
  expiresInDays?: number;
}) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const roleCodes = Array.from(new Set(input.roleCodes.filter(Boolean)));
  if (!email || !name || roleCodes.length === 0) {
    throw new AccountInvitationError('组织、受邀人和角色不能为空');
  }

  const organizationRows = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
  const organization = organizationRows[0];
  if (!organization || organization.status !== 'active') {
    throw new AccountInvitationError('组织不存在或已停用', 404);
  }

  const selectedRoles = await db
    .select()
    .from(roles)
    .where(and(eq(roles.organizationType, organization.type), inArray(roles.code, roleCodes)));
  if (selectedRoles.length !== roleCodes.length) {
    throw new AccountInvitationError('所选角色不适用于当前组织');
  }

  const expiresInDays = Math.min(Math.max(input.expiresInDays ?? INVITATION_TTL_DAYS, 1), 30);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashInvitationToken(token);

  const invitation = await db.transaction(async (transaction) => {
    await transaction
      .update(accountInvitations)
      .set({ status: 'revoked', revokedAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(accountInvitations.organizationId, input.organizationId),
        eq(accountInvitations.email, email),
        eq(accountInvitations.status, 'pending'),
      ));

    const rows = await transaction.insert(accountInvitations).values({
      organizationId: input.organizationId,
      email,
      name,
      phone: input.phone?.trim() || null,
      roleCodes,
      tokenHash,
      expiresAt,
      invitedBy: input.invitedBy ?? null,
    }).returning();
    return rows[0];
  });

  return {
    invitation,
    token,
    activationPath: `/activate-account?token=${encodeURIComponent(token)}`,
  };
}

export async function listAccountInvitations(organizationId: string) {
  const rows = await db
    .select()
    .from(accountInvitations)
    .where(eq(accountInvitations.organizationId, organizationId))
    .orderBy(accountInvitations.createdAt);

  const now = new Date();
  const expiredIds = rows
    .filter((invitation) => invitation.status === 'pending' && invitation.expiresAt <= now)
    .map((invitation) => invitation.id);
  if (expiredIds.length > 0) {
    await db
      .update(accountInvitations)
      .set({ status: 'expired', updatedAt: now })
      .where(inArray(accountInvitations.id, expiredIds));
  }

  return rows.map((invitation) => ({
    ...invitation,
    status: expiredIds.includes(invitation.id) ? 'expired' : invitation.status,
    tokenHash: undefined,
  }));
}

export async function revokeAccountInvitation(invitationId: string) {
  const rows = await db
    .update(accountInvitations)
    .set({ status: 'revoked', revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(accountInvitations.id, invitationId), eq(accountInvitations.status, 'pending')))
    .returning();
  if (!rows[0]) throw new AccountInvitationError('邀请不存在或已失效', 404);
  return rows[0];
}

export async function getAccountInvitation(invitationId: string) {
  const rows = await db.select().from(accountInvitations).where(eq(accountInvitations.id, invitationId)).limit(1);
  return rows[0] ?? null;
}

export async function getInvitationDetails(token: string) {
  const tokenHash = hashInvitationToken(token);
  const rows = await db
    .select({
      invitation: accountInvitations,
      organizationName: organizations.name,
      organizationType: organizations.type,
      organizationStatus: organizations.status,
    })
    .from(accountInvitations)
    .innerJoin(organizations, eq(organizations.id, accountInvitations.organizationId))
    .where(eq(accountInvitations.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) throw new AccountInvitationError('邀请链接无效', 404);

  if (row.invitation.status === 'pending' && row.invitation.expiresAt <= new Date()) {
    await db
      .update(accountInvitations)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(accountInvitations.id, row.invitation.id));
    throw new AccountInvitationError('邀请链接已过期，请联系管理员重新发送', 410);
  }
  if (row.invitation.status !== 'pending') {
    throw new AccountInvitationError(
      row.invitation.status === 'accepted' ? '邀请已被使用' : '邀请已失效',
      410,
    );
  }
  if (row.organizationStatus !== 'active') {
    throw new AccountInvitationError('组织已停用，无法激活账号', 410);
  }

  const existingUsers = await db.select({ id: users.id }).from(users).where(eq(users.email, row.invitation.email)).limit(1);
  const roleRows = await db.select({ code: roles.code, name: roles.name }).from(roles).where(inArray(roles.code, row.invitation.roleCodes));

  return {
    id: row.invitation.id,
    organizationId: row.invitation.organizationId,
    organizationName: row.organizationName,
    organizationType: row.organizationType,
    email: row.invitation.email,
    name: row.invitation.name,
    phone: row.invitation.phone,
    roles: roleRows,
    expiresAt: row.invitation.expiresAt,
    existingAccount: existingUsers.length > 0,
  };
}

export async function acceptAccountInvitation(token: string, password?: string) {
  const details = await getInvitationDetails(token);
  const tokenHash = hashInvitationToken(token);

  const userId = await db.transaction(async (transaction) => {
    const invitationRows = await transaction
      .select()
      .from(accountInvitations)
      .where(and(eq(accountInvitations.tokenHash, tokenHash), eq(accountInvitations.status, 'pending')))
      .limit(1);
    const invitation = invitationRows[0];
    if (!invitation || invitation.expiresAt <= new Date()) {
      throw new AccountInvitationError('邀请链接已失效', 410);
    }

    const existingUsers = await transaction.select().from(users).where(eq(users.email, invitation.email)).limit(1);
    let user = existingUsers[0];
    if (!user) {
      if (!password || password.length < 8) {
        throw new AccountInvitationError('请设置至少 8 位登录密码');
      }
      const createdUsers = await transaction.insert(users).values({
        email: invitation.email,
        name: invitation.name,
        phone: invitation.phone,
        password: hashPassword(password),
        role: details.organizationType === 'service' ? 'accountant' : 'customer',
        isActive: true,
      }).returning();
      user = createdUsers[0];
    } else {
      await transaction
        .update(users)
        .set({ name: invitation.name, phone: invitation.phone, isActive: true, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const selectedRoles = await transaction
      .select()
      .from(roles)
      .where(and(eq(roles.organizationType, details.organizationType), inArray(roles.code, invitation.roleCodes)));
    if (selectedRoles.length !== invitation.roleCodes.length) {
      throw new AccountInvitationError('邀请角色配置已失效，请联系管理员重新发送');
    }

    const existingMemberships = await transaction
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, invitation.organizationId),
        eq(organizationMembers.userId, user.id),
      ))
      .limit(1);
    const shouldOwnOrganization = invitation.roleCodes.includes('enterprise_owner');
    const membership = existingMemberships[0] ?? (await transaction.insert(organizationMembers).values({
      organizationId: invitation.organizationId,
      userId: user.id,
      status: 'active',
      isOwner: shouldOwnOrganization,
      invitedBy: invitation.invitedBy,
    }).returning())[0];

    await transaction
      .update(organizationMembers)
      .set({
        status: 'active',
        isOwner: membership.isOwner || shouldOwnOrganization,
        updatedAt: new Date(),
      })
      .where(eq(organizationMembers.id, membership.id));
    await transaction.delete(memberRoles).where(eq(memberRoles.memberId, membership.id));
    await transaction.insert(memberRoles).values(selectedRoles.map((role) => ({
      memberId: membership.id,
      roleId: role.id,
      scopeType: 'organization',
      scopeId: invitation.organizationId,
    })));

    await transaction
      .update(accountInvitations)
      .set({
        status: 'accepted',
        acceptedUserId: user.id,
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(accountInvitations.id, invitation.id));

    return user.id;
  });

  return createSession(userId, details.organizationId);
}
