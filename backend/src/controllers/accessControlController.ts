import { Response } from 'express';
import {
  and,
  appSubscriptions,
  authSessions,
  auditLogs,
  db,
  eq,
  memberRoles,
  organizationMembers,
  organizations,
  roles,
  serviceEngagements,
  serviceGrants,
  users,
} from '../database/client';
import { AuthRequest } from '../middleware/auth';
import { hashPassword } from '../services/password';
import {
  AccountInvitationError,
  createAccountInvitation,
  getAccountInvitation,
  listAccountInvitations,
  revokeAccountInvitation,
} from '../services/accountInvitation';

const ORGANIZATION_TYPES = new Set(['park', 'service', 'regulator']);

function canManageOrganization(req: AuthRequest, organizationId: string) {
  return Boolean(
    req.user?.permissions.includes('platform.manage')
    || (req.user?.activeOrganizationId === organizationId && req.user.permissions.includes('membership.manage')),
  );
}

async function writeAudit(req: AuthRequest, action: string, resourceType: string, resourceId: string | null, details: Record<string, unknown>) {
  if (!req.user) return;
  await db.insert(auditLogs).values({
    userId: req.user.id,
    organizationId: req.user.activeOrganizationId,
    action,
    resourceType,
    resourceId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    details,
  });
}

export const accessControlController = {
  async organizations(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: '未授权访问' });

    if (req.user.permissions.includes('platform.manage')) {
      const rows = await db.select().from(organizations).orderBy(organizations.type, organizations.name);
      return res.json({ success: true, data: rows });
    }

    const ids = req.user.memberships.map((membership) => membership.organizationId);
    const ownOrganizations = req.user.memberships.map((membership) => ({
      id: membership.organizationId,
      name: membership.organizationName,
      code: membership.organizationCode,
      type: membership.organizationType,
      status: 'active',
      metadata: {},
    }));
    if (req.user.activeOrganization?.organizationType === 'enterprise' && req.user.permissions.includes('delegation.manage')) {
      const serviceOrganizations = await db
        .select()
        .from(organizations)
        .where(and(eq(organizations.type, 'service'), eq(organizations.status, 'active')))
        .orderBy(organizations.name);
      const ownIds = new Set(ids);
      return res.json({
        success: true,
        data: [...ownOrganizations, ...serviceOrganizations.filter((organization) => !ownIds.has(organization.id))],
        organizationIds: ids,
      });
    }
    return res.json({ success: true, data: ownOrganizations, organizationIds: ids });
  },

  async createOrganization(req: AuthRequest, res: Response) {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const type = typeof req.body.type === 'string' ? req.body.type : '';
    if (!name || !ORGANIZATION_TYPES.has(type)) {
      return res.status(400).json({ success: false, error: '组织名称或类型不正确' });
    }

    const creditCode = typeof req.body.creditCode === 'string'
      ? req.body.creditCode.replace(/[^0-9a-z]/gi, '').toUpperCase()
      : '';
    if (type === 'park' && creditCode.length !== 18) {
      return res.status(400).json({ success: false, error: '运营机构必须填写 18 位统一社会信用代码' });
    }

    const codeInput = typeof req.body.code === 'string' ? req.body.code.trim().toLowerCase() : '';
    const code = type === 'park'
      ? `operator-${creditCode}`
      : codeInput.replace(/[^a-z0-9-]/g, '') || `${type}-${Date.now()}`;
    const existingOrganizations = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.code, code))
      .limit(1);
    if (existingOrganizations.length > 0) {
      return res.status(409).json({
        success: false,
        error: type === 'park' ? '该统一社会信用代码的运营机构已存在' : '该组织编码已存在',
      });
    }

    const metadata = type === 'park'
      ? {
          identitySource: 'operator-master-data',
          managementCompanyCreditCode: creditCode,
          managementCompanyLegalPerson: typeof req.body.legalPerson === 'string' ? req.body.legalPerson.trim() : '',
          managementCompanyAddress: typeof req.body.address === 'string' ? req.body.address.trim() : '',
          managementCompanyPhone: typeof req.body.phone === 'string' ? req.body.phone.trim() : '',
        }
      : {};
    const rows = await db.insert(organizations).values({ name, type, code, metadata }).returning();
    const organization = rows[0];

    const appCodes = type === 'park'
      ? ['park-management']
      : type === 'enterprise'
        ? ['accounting', 'inventory', 'hr']
        : type === 'service'
          ? ['accounting']
          : [];
    if (appCodes.length > 0) {
      await db.insert(appSubscriptions).values(appCodes.map((appCode) => ({
        organizationId: organization.id,
        appCode,
        planCode: 'local',
      })));
    }

    await writeAudit(req, 'organization.create', 'organization', organization.id, { name, type, code, creditCode });
    return res.json({ success: true, data: organization });
  },

  async roles(req: AuthRequest, res: Response) {
    const organizationType = typeof req.query.organizationType === 'string' ? req.query.organizationType : '';
    const rows = organizationType
      ? await db.select().from(roles).where(eq(roles.organizationType, organizationType)).orderBy(roles.name)
      : await db.select().from(roles).orderBy(roles.organizationType, roles.name);
    return res.json({ success: true, data: rows });
  },

  async members(req: AuthRequest, res: Response) {
    const organizationId = typeof req.query.organizationId === 'string' ? req.query.organizationId : req.user?.activeOrganizationId;
    if (!organizationId || !canManageOrganization(req, organizationId)) {
      return res.status(403).json({ success: false, error: '无权查看该组织成员' });
    }

    const rows = await db
      .select({
        membershipId: organizationMembers.id,
        organizationId: organizationMembers.organizationId,
        status: organizationMembers.status,
        isOwner: organizationMembers.isOwner,
        joinedAt: organizationMembers.joinedAt,
        userId: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        legacyRole: users.role,
        roleId: roles.id,
        roleCode: roles.code,
        roleName: roles.name,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .leftJoin(memberRoles, eq(memberRoles.memberId, organizationMembers.id))
      .leftJoin(roles, eq(roles.id, memberRoles.roleId))
      .where(eq(organizationMembers.organizationId, organizationId))
      .orderBy(users.name);

    const members = new Map<string, {
      id: string;
      organizationId: string;
      status: string;
      isOwner: boolean;
      joinedAt: Date;
      user: { id: string; email: string; name: string; phone: string | null; role: string };
      roles: Array<{ id: string; code: string; name: string }>;
    }>();

    for (const row of rows) {
      const member = members.get(row.membershipId) ?? {
        id: row.membershipId,
        organizationId: row.organizationId,
        status: row.status,
        isOwner: row.isOwner,
        joinedAt: row.joinedAt,
        user: { id: row.userId, email: row.email, name: row.name, phone: row.phone, role: row.legacyRole },
        roles: [],
      };
      if (row.roleId && row.roleCode && row.roleName && !member.roles.some((role) => role.id === row.roleId)) {
        member.roles.push({ id: row.roleId, code: row.roleCode, name: row.roleName });
      }
      members.set(row.membershipId, member);
    }

    return res.json({ success: true, data: Array.from(members.values()) });
  },

  async saveMember(req: AuthRequest, res: Response) {
    const organizationId = typeof req.body.organizationId === 'string' ? req.body.organizationId : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : null;
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const roleCodes = Array.isArray(req.body.roleCodes) ? req.body.roleCodes.filter((code: unknown): code is string => typeof code === 'string') : [];

    if (!organizationId || !email || !name || roleCodes.length === 0) {
      return res.status(400).json({ success: false, error: '组织、账号信息和角色不能为空' });
    }
    if (!canManageOrganization(req, organizationId)) {
      return res.status(403).json({ success: false, error: '无权管理该组织成员' });
    }

    const organizationRows = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    const organization = organizationRows[0];
    if (!organization) return res.status(404).json({ success: false, error: '组织不存在' });

    const roleRows = await db.select().from(roles).where(eq(roles.organizationType, organization.type));
    const selectedRoles = roleRows.filter((role) => roleCodes.includes(role.code));
    if (selectedRoles.length !== roleCodes.length) {
      return res.status(400).json({ success: false, error: '所选角色不适用于当前组织' });
    }

    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let user = existingUsers[0];
    if (!user) {
      if (password.length < 8) {
        return res.status(400).json({ success: false, error: '新账号初始密码至少 8 位' });
      }
      const createdUsers = await db.insert(users).values({
        email,
        name,
        phone,
        password: hashPassword(password),
        role: organization.type === 'service' ? 'accountant' : 'customer',
      }).returning();
      user = createdUsers[0];
    } else {
      await db.update(users).set({ name, phone, isActive: true, updatedAt: new Date() }).where(eq(users.id, user.id));
    }

    const existingMemberships = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, user.id)))
      .limit(1);
    const membership = existingMemberships[0] ?? (await db.insert(organizationMembers).values({
      organizationId,
      userId: user.id,
      status: 'active',
      invitedBy: req.user?.id,
    }).returning())[0];

    await db.update(organizationMembers).set({ status: 'active', updatedAt: new Date() }).where(eq(organizationMembers.id, membership.id));
    await db.delete(memberRoles).where(eq(memberRoles.memberId, membership.id));
    await db.insert(memberRoles).values(selectedRoles.map((role) => ({
      memberId: membership.id,
      roleId: role.id,
      scopeType: 'organization',
      scopeId: organizationId,
    })));

    await writeAudit(req, 'membership.save', 'organization_member', membership.id, { organizationId, email, roleCodes });
    return res.json({ success: true, data: { membershipId: membership.id, userId: user.id } });
  },

  async updateMember(req: AuthRequest, res: Response) {
    const rows = await db.select().from(organizationMembers).where(eq(organizationMembers.id, req.params.id)).limit(1);
    const membership = rows[0];
    if (!membership || !canManageOrganization(req, membership.organizationId)) {
      return res.status(403).json({ success: false, error: '无权管理该成员' });
    }
    if (membership.isOwner && req.body.status === 'disabled' && !req.user?.permissions.includes('platform.manage')) {
      return res.status(409).json({ success: false, error: '组织所有者只能由平台管理员回收' });
    }

    const status = req.body.status === 'disabled' ? 'disabled' : 'active';
    await db.update(organizationMembers).set({ status, updatedAt: new Date() }).where(eq(organizationMembers.id, membership.id));
    if (status === 'disabled') {
      await db
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(and(
          eq(authSessions.userId, membership.userId),
          eq(authSessions.activeOrganizationId, membership.organizationId),
        ));
      const remainingMemberships = await db
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
        .where(and(
          eq(organizationMembers.userId, membership.userId),
          eq(organizationMembers.status, 'active'),
        ));
      if (remainingMemberships.length === 0) {
        await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, membership.userId));
        await db.update(authSessions).set({ revokedAt: new Date() }).where(eq(authSessions.userId, membership.userId));
      }
    } else {
      await db.update(users).set({ isActive: true, updatedAt: new Date() }).where(eq(users.id, membership.userId));
    }
    await writeAudit(req, 'membership.status', 'organization_member', membership.id, { status });
    return res.json({ success: true });
  },

  async invitations(req: AuthRequest, res: Response) {
    const organizationId = typeof req.query.organizationId === 'string' ? req.query.organizationId : '';
    if (!organizationId || !canManageOrganization(req, organizationId)) {
      return res.status(403).json({ success: false, error: '无权查看该组织邀请' });
    }
    const invitations = await listAccountInvitations(organizationId);
    return res.json({ success: true, data: invitations });
  },

  async createInvitation(req: AuthRequest, res: Response) {
    try {
      const organizationId = typeof req.body.organizationId === 'string' ? req.body.organizationId : '';
      if (!organizationId || !canManageOrganization(req, organizationId)) {
        return res.status(403).json({ success: false, error: '无权邀请该组织成员' });
      }
      const result = await createAccountInvitation({
        organizationId,
        email: typeof req.body.email === 'string' ? req.body.email : '',
        name: typeof req.body.name === 'string' ? req.body.name : '',
        phone: typeof req.body.phone === 'string' ? req.body.phone : null,
        roleCodes: Array.isArray(req.body.roleCodes) ? req.body.roleCodes : [],
        invitedBy: req.user?.id,
        expiresInDays: typeof req.body.expiresInDays === 'number' ? req.body.expiresInDays : undefined,
      });
      await writeAudit(req, 'invitation.create', 'account_invitation', result.invitation.id, {
        organizationId,
        email: result.invitation.email,
        roleCodes: result.invitation.roleCodes,
      });
      return res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AccountInvitationError) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      console.error('创建账号邀请失败:', error);
      return res.status(500).json({ success: false, error: '创建账号邀请失败' });
    }
  },

  async revokeInvitation(req: AuthRequest, res: Response) {
    try {
      const invitation = await getAccountInvitation(req.params.id);
      if (!invitation || !canManageOrganization(req, invitation.organizationId)) {
        return res.status(403).json({ success: false, error: '无权撤销该邀请' });
      }
      await revokeAccountInvitation(invitation.id);
      await writeAudit(req, 'invitation.revoke', 'account_invitation', invitation.id, {
        organizationId: invitation.organizationId,
        email: invitation.email,
      });
      return res.json({ success: true });
    } catch (error) {
      if (error instanceof AccountInvitationError) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      console.error('撤销账号邀请失败:', error);
      return res.status(500).json({ success: false, error: '撤销账号邀请失败' });
    }
  },

  async regenerateInvitation(req: AuthRequest, res: Response) {
    try {
      const invitation = await getAccountInvitation(req.params.id);
      if (!invitation || !canManageOrganization(req, invitation.organizationId)) {
        return res.status(403).json({ success: false, error: '无权重发该邀请' });
      }
      if (invitation.status === 'pending') await revokeAccountInvitation(invitation.id);
      const result = await createAccountInvitation({
        organizationId: invitation.organizationId,
        email: invitation.email,
        name: invitation.name,
        phone: invitation.phone,
        roleCodes: invitation.roleCodes,
        invitedBy: req.user?.id,
      });
      await writeAudit(req, 'invitation.regenerate', 'account_invitation', result.invitation.id, {
        previousInvitationId: invitation.id,
        organizationId: invitation.organizationId,
        email: invitation.email,
      });
      return res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AccountInvitationError) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      console.error('重发账号邀请失败:', error);
      return res.status(500).json({ success: false, error: '重发账号邀请失败' });
    }
  },

  async engagements(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: '未授权访问' });

    const rows = await db
      .select({
        id: serviceEngagements.id,
        enterpriseOrganizationId: serviceEngagements.enterpriseOrganizationId,
        providerOrganizationId: serviceEngagements.providerOrganizationId,
        status: serviceEngagements.status,
        startsOn: serviceEngagements.startsOn,
        endsOn: serviceEngagements.endsOn,
        createdAt: serviceEngagements.createdAt,
      })
      .from(serviceEngagements)
      .orderBy(serviceEngagements.createdAt);

    const organizationRows = await db.select({ id: organizations.id, name: organizations.name }).from(organizations);
    const organizationNames = new Map(organizationRows.map((organization) => [organization.id, organization.name]));
    const visibleRows = req.user.permissions.includes('platform.manage')
      ? rows
      : rows.filter((row) => row.enterpriseOrganizationId === req.user?.activeOrganizationId || row.providerOrganizationId === req.user?.activeOrganizationId);

    const data = await Promise.all(visibleRows.map(async (row) => {
      const grants = await db.select().from(serviceGrants).where(eq(serviceGrants.engagementId, row.id));
      return {
        ...row,
        enterpriseOrganizationName: organizationNames.get(row.enterpriseOrganizationId) ?? '企业组织',
        providerOrganizationName: organizationNames.get(row.providerOrganizationId) ?? '服务机构',
        grants,
      };
    }));

    return res.json({ success: true, data });
  },

  async saveEngagement(req: AuthRequest, res: Response) {
    const enterpriseOrganizationId = typeof req.body.enterpriseOrganizationId === 'string' ? req.body.enterpriseOrganizationId : '';
    const providerOrganizationId = typeof req.body.providerOrganizationId === 'string' ? req.body.providerOrganizationId : '';
    const appCodes: string[] = Array.isArray(req.body.appCodes) ? req.body.appCodes.filter((code: unknown): code is string => typeof code === 'string') : [];
    if (!enterpriseOrganizationId || !providerOrganizationId || appCodes.length === 0) {
      return res.status(400).json({ success: false, error: '企业、服务机构和授权应用不能为空' });
    }

    const organizationRows = await db.select().from(organizations);
    const enterpriseOrganization = organizationRows.find((organization) => organization.id === enterpriseOrganizationId);
    const providerOrganization = organizationRows.find((organization) => organization.id === providerOrganizationId);
    if (enterpriseOrganization?.type !== 'enterprise' || providerOrganization?.type !== 'service') {
      return res.status(400).json({ success: false, error: '委托双方组织类型不正确' });
    }
    if (!req.user?.permissions.includes('platform.manage') && req.user?.activeOrganizationId !== enterpriseOrganizationId) {
      return res.status(403).json({ success: false, error: '只有委托企业或平台管理员可以发起授权' });
    }

    const engagementRows = await db.insert(serviceEngagements).values({
      enterpriseOrganizationId,
      providerOrganizationId,
      status: 'active',
      startsOn: typeof req.body.startsOn === 'string' && req.body.startsOn ? req.body.startsOn : null,
      endsOn: typeof req.body.endsOn === 'string' && req.body.endsOn ? req.body.endsOn : null,
      createdBy: req.user?.id,
      approvedBy: req.user?.id,
    }).returning();
    const engagement = engagementRows[0];

    await db.insert(serviceGrants).values(appCodes.map((appCode) => ({
      engagementId: engagement.id,
      appCode,
      permissionCodes: appCode === 'accounting'
        ? ['ledger.read', 'ledger.write', 'metrics.read', 'metrics.submit']
        : appCode === 'metrics'
          ? ['metrics.read', 'metrics.submit']
          : [`${appCode}.read`],
      scopeType: 'enterprise',
      scopeId: enterpriseOrganizationId,
    })));

    await writeAudit(req, 'delegation.create', 'service_engagement', engagement.id, { enterpriseOrganizationId, providerOrganizationId, appCodes });
    return res.json({ success: true, data: engagement });
  },
};
