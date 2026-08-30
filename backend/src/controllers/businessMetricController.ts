import { Response } from 'express';
import { SQL, sql } from 'drizzle-orm';
import {
  and,
  auditLogs,
  bases,
  businessMetricReports,
  db,
  desc,
  enterprises,
  eq,
  gte,
  inArray,
  lte,
} from '../database/client';
import { AuthRequest } from '../middleware/auth';
import { canAccessEnterprise, getAccessibleEnterpriseIds } from '../services/accessScope';

const REPORT_STATUSES = new Set(['draft', 'submitted', 'confirmed', 'rejected']);

function normalizePeriod(value: unknown) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(0[1-9]|1[0-2])(?:-\d{2})?$/);
  return match ? `${match[1]}-${match[2]}-01` : null;
}

function nonnegativeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed.toFixed(2) : null;
}

function nonnegativeInteger(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function writeAuditLog(req: AuthRequest, action: string, resourceId: string | null, details: Record<string, unknown> = {}) {
  if (!req.user) return;
  await db.insert(auditLogs).values({
    userId: req.user.id,
    organizationId: req.user.activeOrganizationId,
    action,
    resourceType: 'business_metric_report',
    resourceId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    details,
  });
}

async function getReport(reportId: string) {
  const rows = await db
    .select()
    .from(businessMetricReports)
    .where(eq(businessMetricReports.id, reportId))
    .limit(1);
  return rows[0] ?? null;
}

export const businessMetricController = {
  async options(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: '未授权访问' });

    const accessibleEnterpriseIds = await getAccessibleEnterpriseIds(req.user);
    if (accessibleEnterpriseIds?.length === 0) {
      return res.json({ success: true, data: { bases: [], enterprises: [] } });
    }

    const filters: SQL[] = [eq(enterprises.status, 'active')];
    if (accessibleEnterpriseIds) filters.push(inArray(enterprises.id, accessibleEnterpriseIds));

    const enterpriseRows = await db
      .select({
        id: enterprises.id,
        name: enterprises.name,
        creditCode: enterprises.creditCode,
        baseId: enterprises.baseId,
        baseName: bases.name,
      })
      .from(enterprises)
      .leftJoin(bases, eq(bases.id, enterprises.baseId))
      .where(and(...filters))
      .orderBy(enterprises.name);

    const baseMap = new Map<string, { id: string; name: string }>();
    if (accessibleEnterpriseIds === null) {
      const baseRows = await db
        .select({ id: bases.id, name: bases.name })
        .from(bases)
        .where(eq(bases.status, 'active'))
        .orderBy(bases.name);
      for (const base of baseRows) baseMap.set(base.id, base);
    } else {
      for (const enterprise of enterpriseRows) {
        if (enterprise.baseId && enterprise.baseName) {
          baseMap.set(enterprise.baseId, { id: enterprise.baseId, name: enterprise.baseName });
        }
      }
    }

    return res.json({
      success: true,
      data: {
        bases: Array.from(baseMap.values()),
        enterprises: enterpriseRows,
      },
    });
  },

  async list(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: '未授权访问' });

    const accessibleEnterpriseIds = await getAccessibleEnterpriseIds(req.user);
    if (accessibleEnterpriseIds?.length === 0) return res.json({ success: true, data: [] });

    const filters: SQL[] = [];
    if (accessibleEnterpriseIds) filters.push(inArray(businessMetricReports.enterpriseId, accessibleEnterpriseIds));
    if (typeof req.query.baseId === 'string' && req.query.baseId) filters.push(eq(businessMetricReports.baseId, req.query.baseId));
    if (typeof req.query.enterpriseId === 'string' && req.query.enterpriseId) filters.push(eq(businessMetricReports.enterpriseId, req.query.enterpriseId));
    if (typeof req.query.status === 'string' && REPORT_STATUSES.has(req.query.status)) filters.push(eq(businessMetricReports.status, req.query.status));

    const period = normalizePeriod(req.query.period);
    if (period) filters.push(eq(businessMetricReports.reportingPeriod, period));

    const reports = await db
      .select({
        id: businessMetricReports.id,
        enterpriseId: businessMetricReports.enterpriseId,
        enterpriseName: enterprises.name,
        baseId: businessMetricReports.baseId,
        baseName: bases.name,
        reportingPeriod: businessMetricReports.reportingPeriod,
        revenue: businessMetricReports.revenue,
        taxTotal: businessMetricReports.taxTotal,
        taxLocal: businessMetricReports.taxLocal,
        employees: businessMetricReports.employees,
        localEmployees: businessMetricReports.localEmployees,
        investment: businessMetricReports.investment,
        sourceType: businessMetricReports.sourceType,
        status: businessMetricReports.status,
        submittedAt: businessMetricReports.submittedAt,
        reviewedAt: businessMetricReports.reviewedAt,
        reviewComment: businessMetricReports.reviewComment,
        updatedAt: businessMetricReports.updatedAt,
      })
      .from(businessMetricReports)
      .innerJoin(enterprises, eq(enterprises.id, businessMetricReports.enterpriseId))
      .innerJoin(bases, eq(bases.id, businessMetricReports.baseId))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(businessMetricReports.reportingPeriod), enterprises.name);

    return res.json({ success: true, data: reports });
  },

  async summary(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: '未授权访问' });

    const accessibleEnterpriseIds = await getAccessibleEnterpriseIds(req.user);
    if (accessibleEnterpriseIds?.length === 0) {
      return res.json({ success: true, data: { totals: {}, monthly: [] } });
    }

    const year = typeof req.query.year === 'string' && /^\d{4}$/.test(req.query.year)
      ? req.query.year
      : String(new Date().getFullYear());
    const filters: SQL[] = [
      eq(businessMetricReports.status, 'confirmed'),
      gte(businessMetricReports.reportingPeriod, `${year}-01-01`),
      lte(businessMetricReports.reportingPeriod, `${year}-12-31`),
    ];
    if (accessibleEnterpriseIds) filters.push(inArray(businessMetricReports.enterpriseId, accessibleEnterpriseIds));
    if (typeof req.query.baseId === 'string' && req.query.baseId) filters.push(eq(businessMetricReports.baseId, req.query.baseId));

    const whereClause = and(...filters);
    const totalsRows = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${businessMetricReports.revenue}), 0)`,
        taxTotal: sql<string>`COALESCE(SUM(${businessMetricReports.taxTotal}), 0)`,
        taxLocal: sql<string>`COALESCE(SUM(${businessMetricReports.taxLocal}), 0)`,
        investment: sql<string>`COALESCE(SUM(${businessMetricReports.investment}), 0)`,
        enterpriseCount: sql<number>`COUNT(DISTINCT ${businessMetricReports.enterpriseId})::int`,
        reportCount: sql<number>`COUNT(*)::int`,
      })
      .from(businessMetricReports)
      .where(whereClause);

    const monthly = await db
      .select({
        period: businessMetricReports.reportingPeriod,
        revenue: sql<string>`COALESCE(SUM(${businessMetricReports.revenue}), 0)`,
        taxTotal: sql<string>`COALESCE(SUM(${businessMetricReports.taxTotal}), 0)`,
        taxLocal: sql<string>`COALESCE(SUM(${businessMetricReports.taxLocal}), 0)`,
        employees: sql<number>`COALESCE(SUM(${businessMetricReports.employees}), 0)::int`,
        localEmployees: sql<number>`COALESCE(SUM(${businessMetricReports.localEmployees}), 0)::int`,
        investment: sql<string>`COALESCE(SUM(${businessMetricReports.investment}), 0)`,
      })
      .from(businessMetricReports)
      .where(whereClause)
      .groupBy(businessMetricReports.reportingPeriod)
      .orderBy(businessMetricReports.reportingPeriod);

    const snapshotRows = await db
      .select({
        enterpriseId: businessMetricReports.enterpriseId,
        period: businessMetricReports.reportingPeriod,
        employees: businessMetricReports.employees,
        localEmployees: businessMetricReports.localEmployees,
      })
      .from(businessMetricReports)
      .where(whereClause)
      .orderBy(businessMetricReports.enterpriseId, desc(businessMetricReports.reportingPeriod));

    const latestSnapshots = new Map<string, { employees: number; localEmployees: number }>();
    for (const row of snapshotRows) {
      if (!latestSnapshots.has(row.enterpriseId)) {
        latestSnapshots.set(row.enterpriseId, { employees: row.employees, localEmployees: row.localEmployees });
      }
    }

    const employment = Array.from(latestSnapshots.values()).reduce(
      (total, row) => ({ employees: total.employees + row.employees, localEmployees: total.localEmployees + row.localEmployees }),
      { employees: 0, localEmployees: 0 },
    );

    return res.json({
      success: true,
      data: {
        year,
        totals: { ...totalsRows[0], ...employment },
        monthly,
      },
    });
  },

  async save(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: '未授权访问' });

    const enterpriseId = typeof req.body.enterpriseId === 'string' ? req.body.enterpriseId : '';
    const reportingPeriod = normalizePeriod(req.body.reportingPeriod);
    if (!enterpriseId || !reportingPeriod) {
      return res.status(400).json({ success: false, error: '企业和填报月份不能为空' });
    }
    if (!(await canAccessEnterprise(req.user, enterpriseId))) {
      return res.status(403).json({ success: false, error: '无权填报该企业数据' });
    }

    const values = {
      revenue: nonnegativeNumber(req.body.revenue),
      taxTotal: nonnegativeNumber(req.body.taxTotal),
      taxLocal: nonnegativeNumber(req.body.taxLocal),
      employees: nonnegativeInteger(req.body.employees),
      localEmployees: nonnegativeInteger(req.body.localEmployees),
      investment: nonnegativeNumber(req.body.investment),
    };
    if (Object.values(values).some((value) => value === null)) {
      return res.status(400).json({ success: false, error: '经营指标必须为非负数' });
    }

    const enterpriseRows = await db
      .select({ id: enterprises.id, baseId: enterprises.baseId })
      .from(enterprises)
      .where(eq(enterprises.id, enterpriseId))
      .limit(1);
    const enterprise = enterpriseRows[0];
    const baseId = enterprise?.baseId || (typeof req.body.baseId === 'string' ? req.body.baseId : '');
    if (!enterprise || !baseId) {
      return res.status(400).json({ success: false, error: '企业尚未关联基地，请先完善企业档案' });
    }

    const existingRows = await db
      .select()
      .from(businessMetricReports)
      .where(and(
        eq(businessMetricReports.enterpriseId, enterpriseId),
        eq(businessMetricReports.reportingPeriod, reportingPeriod),
      ))
      .limit(1);
    const existing = existingRows[0];
    if (existing && !['draft', 'rejected'].includes(existing.status) && !req.user.permissions.includes('metrics.manage')) {
      return res.status(409).json({ success: false, error: '已提交或已审核的数据不能直接修改' });
    }

    const payload = {
      enterpriseId,
      baseId,
      reportingPeriod,
      revenue: values.revenue!,
      taxTotal: values.taxTotal!,
      taxLocal: values.taxLocal!,
      employees: values.employees!,
      localEmployees: values.localEmployees!,
      investment: values.investment!,
      sourceType: 'manual',
      status: 'draft',
      submittedBy: null,
      submittedAt: null,
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null,
      updatedAt: new Date(),
    };

    const savedRows = existing
      ? await db.update(businessMetricReports).set(payload).where(eq(businessMetricReports.id, existing.id)).returning()
      : await db.insert(businessMetricReports).values(payload).returning();

    await writeAuditLog(req, existing ? 'metrics.update' : 'metrics.create', savedRows[0].id, { enterpriseId, reportingPeriod });
    return res.json({ success: true, data: savedRows[0] });
  },

  async submit(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: '未授权访问' });
    const report = await getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: '填报记录不存在' });
    if (!(await canAccessEnterprise(req.user, report.enterpriseId))) {
      return res.status(403).json({ success: false, error: '无权提交该企业数据' });
    }
    if (!['draft', 'rejected'].includes(report.status)) {
      return res.status(409).json({ success: false, error: '当前状态不能提交审核' });
    }

    const rows = await db
      .update(businessMetricReports)
      .set({ status: 'submitted', submittedBy: req.user.id, submittedAt: new Date(), reviewComment: null, updatedAt: new Date() })
      .where(eq(businessMetricReports.id, report.id))
      .returning();
    await writeAuditLog(req, 'metrics.submit', report.id);
    return res.json({ success: true, data: rows[0] });
  },

  async review(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: '未授权访问' });
    const report = await getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: '填报记录不存在' });
    if (!(await canAccessEnterprise(req.user, report.enterpriseId))) {
      return res.status(403).json({ success: false, error: '无权审核该企业数据' });
    }
    if (report.status !== 'submitted') {
      return res.status(409).json({ success: false, error: '只有待审核数据可以审核' });
    }

    const approved = req.body.approved === true;
    const reviewComment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    if (!approved && !reviewComment) {
      return res.status(400).json({ success: false, error: '驳回时必须填写原因' });
    }

    const rows = await db
      .update(businessMetricReports)
      .set({
        status: approved ? 'confirmed' : 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        reviewComment: reviewComment || null,
        updatedAt: new Date(),
      })
      .where(eq(businessMetricReports.id, report.id))
      .returning();
    await writeAuditLog(req, approved ? 'metrics.approve' : 'metrics.reject', report.id, { comment: reviewComment });
    return res.json({ success: true, data: rows[0] });
  },
};
