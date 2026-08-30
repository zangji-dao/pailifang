# Π立方企业服务平台

Π立方是企业入驻、代理记账、合同、客户、工单、结算和人力资源一体化管理平台。

## 架构

```text
Browser / Mini Program
        |
        v
Next.js 16 (port 5000)
        |
        +--> PostgreSQL
        +--> Express API (port 4001)
        +--> S3-compatible storage
        +--> OpenAI-compatible AI service
        +--> Alipay / OnlyOffice / Ys7
```

项目源码已从 Coze 导出结构迁移为标准 Node.js 工程，不再依赖 Coze SDK、workload identity、Coze 对象存储代理或 Supabase REST SDK。数据库查询兼容层直接使用参数化 PostgreSQL SQL。

## 推荐启动

1. 创建自托管配置：

```powershell
Copy-Item .env.compose.example .env.compose
```

2. 修改 `.env.compose` 中的数据库、MinIO 和 OnlyOffice 密钥。

3. 启动完整服务：

```powershell
docker compose --env-file .env.compose up -d --build
```

4. 访问：

- Web：`http://localhost:5000`
- 后端健康检查：`http://localhost:4001/health`
- MinIO 控制台：`http://localhost:9001`
- OnlyOffice：`http://localhost:8080`

旧项目数据迁移前，请先执行 `docs/FULL_MIGRATION_RUNBOOK_2026-08-23.md` 中的数据库和对象存储步骤。

## 本地开发

当前工作机已按与 CHEMICALOOP 相同的“本机进程 + 独立数据目录”方式完成配置，不需要 Docker，也不会占用 CHEMICALOOP 的数据库或 Web 端口：

```powershell
pnpm install
pnpm local:setup
pnpm dev
```

本机开发地址：

- Web：`http://localhost:5100`
- 后端：`http://localhost:4101`
- PostgreSQL：`127.0.0.1:55432/pi_cube`
- MinIO API：`http://127.0.0.1:9100`
- MinIO 控制台：`http://127.0.0.1:9101`

本机管理员账号为 `admin@pi-cube.local`。登录页在本机开发模式下提供“管理员一键登录”，凭据只保存在未提交的 `.env.local` 中，不会写入浏览器代码或生产构建。

`pnpm local:setup` 会生成未提交的 `.env.local` 和 `backend/.env`，创建独立 PostgreSQL 数据目录、完整业务与权限表结构以及 `pi-cube-files` 空桶。不会复制原系统业务数据。

## 账号权限与经营数据

- 工作台右上角支持在用户所属组织之间切换，权限按当前组织重新计算。
- `http://localhost:5100/dashboard/access-control` 用于创建组织账号、分配角色、维护服务机构和企业委托。
- `http://localhost:5100/dashboard/base/metrics` 用于按企业和月份填报销售收入、税收、投资与就业数据。
- 经营数据按“草稿 → 待审核 → 已确认 / 已驳回”流转，只有已确认数据进入工作台汇总。
- 新建基地和企业时，数据库会自动建立对应组织、资源关联和默认应用订阅。
- 企业入驻完成后自动生成企业负责人邀请，负责人通过一次性链接激活账号并成为企业管理员。
- 企业管理员可在“账号与权限”中邀请员工；邀请默认 7 天失效，并支持撤销或重新生成链接。
- 账号回收会立即禁用组织成员身份并注销相关会话，恢复后才可重新登录；企业退出时自动回收该企业全部账号和未使用邀请。
- 公开注册默认关闭；园区和服务机构账号应由具有成员管理权限的管理员创建。

权限模型由用户、组织、成员身份、角色、权限、数据范围和服务委托组成。平台、园区、企业、服务机构及监管单位使用同一套组织模型，代账机构只能访问企业明确授权的应用和数据范围。

## 基地空间与企业关系

- 基地空间采用“基地 → 物业 → 物理空间 → 工位”四级模型；物业是按独立水表、电表划分的计量管理单元，物理空间是物业内规划的房间，工位是可分配的最小物理单元。
- `registration_numbers` 是唯一工位主数据源；`workstation_assignments` 保存工位分配及释放历史。
- 入驻企业必须选择基地并分配工位；服务企业不占用工位，但必须选择主要服务基地，并可在企业详情中继续增加其他服务基地。
- `enterprise_base_relations` 保存企业与基地之间的入驻或服务关系，企业转为服务企业、迁出或停用时会自动释放工位。
- 基地列表按基地批量统计物业、空间、工位、已分配工位、去重后的入驻企业和服务企业，不再把工位数量当作企业数量。

如需手工配置其他环境，至少设置：

- `DATABASE_URL`
- `S3_BUCKET`、`S3_REGION` 和对应凭据
- `APP_URL`
- `BACKEND_URL`
- 使用 AI、OnlyOffice、支付宝或萤石云功能时对应的服务变量

## 常用命令

```powershell
pnpm dev
pnpm local:setup
pnpm local:status
pnpm local:stop
pnpm ts-check
pnpm build:web
pnpm build:backend
pnpm build
pnpm start
pnpm migrate:database -- --confirm-target pi_cube
pnpm migrate:database:verify
pnpm migrate:storage -- --verify
pnpm migrate:storage:references
```

迁移命令默认读取未提交的 `.env.migration`，模板为 `.env.migration.example`。

## 外部服务

- 数据库：标准 PostgreSQL，使用 `DATABASE_URL` 或 `PG_*`
- 对象存储：AWS SDK，支持 S3、腾讯云 COS、MinIO 等兼容服务
- AI：OpenAI-compatible `/chat/completions`
- 文档：OnlyOffice；Word 解析和导出运行时包含 LibreOffice Writer
- 历史搜索脚本：通过 `SEARCH_API_URL` 对接自有搜索网关

## 迁移状态

- 源码、依赖、构建脚本和部署结构已完成迁出。
- 数据库及对象存储迁移工具已提供。
- 当前本机环境采用全新空数据库和空对象存储；按用户选择未复制原业务数据。
- 40 张业务表的空结构基线已固化在 `database/init/10-application-schema.sql`，新环境不依赖原数据库初始化。
- OnlyOffice、AI、支付宝和萤石云属于可选外部服务，使用对应功能前仍需配置服务或凭据。
- 迁移记录见 `docs/MIGRATION_FROM_COZE_2026-08-23.md`。
