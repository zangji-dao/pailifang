import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  Clock3,
  FileSignature,
  GraduationCap,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const METRICS = [
  { label: "在职员工", value: "322", note: "覆盖 4 个派遣项目", icon: Users, tone: "bg-blue-50 text-blue-600" },
  { label: "本月待入职", value: "8", note: "3 人等待资料确认", icon: UserPlus, tone: "bg-emerald-50 text-emerald-600" },
  { label: "招聘需求", value: "56", note: "重点岗位 12 个", icon: BriefcaseBusiness, tone: "bg-violet-50 text-violet-600" },
  { label: "合同待处理", value: "5", note: "30 天内到期", icon: FileSignature, tone: "bg-amber-50 text-amber-600" },
];

const WORKFLOW = [
  { label: "简历筛选", count: 28, description: "等待初审", href: "/dashboard/hr/recruitment" },
  { label: "面试安排", count: 12, description: "本周待面试", href: "/dashboard/hr/recruitment" },
  { label: "入职办理", count: 8, description: "等待资料归档", href: "/dashboard/hr/archives" },
  { label: "合同签署", count: 5, description: "待续签或补签", href: "/dashboard/hr/contracts" },
];

const QUICK_LINKS = [
  { name: "考勤管理", description: "异常考勤与月度汇总", href: "/dashboard/hr/attendance", icon: CalendarCheck2 },
  { name: "薪酬管理", description: "工资核算与发放进度", href: "/dashboard/hr/payroll", icon: WalletCards },
  { name: "派遣项目", description: "项目人员配置与状态", href: "/dashboard/hr/dispatch", icon: BriefcaseBusiness },
  { name: "培训管理", description: "培训计划与完成情况", href: "/dashboard/hr/training", icon: GraduationCap },
];

export default function HumanResourcesDashboardPage() {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#fff7ed_100%)] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="mb-3 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
              人力资源业务看板
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              人员全周期运营概览
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              聚合招聘、入职、合同、派遣、考勤与薪酬进度，优先处理影响用工交付的待办事项。
            </p>
          </div>
          <Link
            href="/dashboard/hr/reports"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-amber-300 hover:text-amber-700"
          >
            查看统计报表
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((metric) => (
          <Card key={metric.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
                  <p className="mt-2 text-xs text-slate-400">{metric.note}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.tone}`}>
                  <metric.icon className="h-5 w-5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">招聘入职流程</CardTitle>
              <p className="mt-1 text-sm text-slate-500">按业务阶段查看当前待办量</p>
            </div>
            <Clock3 className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {WORKFLOW.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/50 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600" />
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  </div>
                  <span className="text-2xl font-semibold text-slate-950">{item.count}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">核心业务入口</CardTitle>
            <p className="text-sm text-slate-500">进入当前人力模块的常用工作区</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-amber-50 group-hover:text-amber-600">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">{item.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{item.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
