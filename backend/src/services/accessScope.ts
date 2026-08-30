import { sql } from 'drizzle-orm';
import { db } from '../database/client';
import { AccessUser } from './session';

export async function getAccessibleEnterpriseIds(user: AccessUser): Promise<string[] | null> {
  if (user.permissions.includes('platform.manage') || user.activeOrganization?.organizationType === 'platform') {
    return null;
  }

  const organizationId = user.activeOrganizationId;
  if (!organizationId) return [];

  const result = await db.execute(sql`
    SELECT DISTINCT enterprise.id
    FROM enterprises AS enterprise
    LEFT JOIN bases AS base ON base.id = enterprise.base_id
    LEFT JOIN organization_bases AS organization_base ON organization_base.base_id = enterprise.base_id
    LEFT JOIN service_engagements AS engagement
      ON engagement.enterprise_organization_id = enterprise.organization_id
      AND engagement.provider_organization_id = ${organizationId}
      AND engagement.status = 'active'
      AND (engagement.starts_on IS NULL OR engagement.starts_on <= CURRENT_DATE)
      AND (engagement.ends_on IS NULL OR engagement.ends_on >= CURRENT_DATE)
    LEFT JOIN service_grants AS service_grant
      ON service_grant.engagement_id = engagement.id
      AND service_grant.app_code IN ('metrics', 'accounting')
    WHERE enterprise.organization_id = ${organizationId}
       OR base.organization_id = ${organizationId}
       OR organization_base.organization_id = ${organizationId}
       OR service_grant.id IS NOT NULL
  `) as unknown as { rows: Array<{ id: string }> };

  return result.rows.map((row) => row.id);
}

export async function canAccessEnterprise(user: AccessUser, enterpriseId: string) {
  const enterpriseIds = await getAccessibleEnterpriseIds(user);
  return enterpriseIds === null || enterpriseIds.includes(enterpriseId);
}
