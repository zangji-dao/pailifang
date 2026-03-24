# 压缩摘要

## 用户需求与目标
- 原始目标: 创建企业入驻流程管理系统，支持分配地址、工商注册、签订合同、费用缴纳等完整流程
- 当前目标: 统一合同管理模块的UI风格，与全局七彩配色系统保持一致

## 项目概览
- 概述: 企业入驻管理系统，支持企业从申请到入驻的完整流程管理
- 技术栈: Next.js 16, React 19, TypeScript 5, shadcn/ui, Tailwind CSS 4, Supabase
- 编码规范: Airbnb

## 关键决策
- 使用 LLM 视觉模型实现营业执照自动识别
- 合同管理采用通用模式，支持各种合同类型
- 合同创建流程简化为3步：选择企业 → 填写合同信息 → 上传附件
- 合同日期简化为：开始日期 + 有效时长（自动计算截止日期）
- 合同状态逻辑：创建为草稿，上传附件保持草稿，点击确认签署变为已签
- 企业名称查重：创建和更新企业时检查名称是否重复（排除已终止企业）
- **UI风格统一**: 使用 globals.css 定义的七彩配色系统

## 全局样式约定（globals.css）
- 七彩配色系统对应入驻流程步骤：
  - 天蓝色 - 分配地址
  - 紫罗兰色 - 工商注册
  - 琥珀色 - 签订合同
  - 翡翠绿 - 费用缴纳
  - 玫瑰粉 - 完成入驻
- CSS变量: `--step-sky`, `--step-violet`, `--step-amber`, `--step-emerald`, `--step-rose`
- Tailwind类: `bg-step-amber`, `text-step-amber`, `bg-step-amber-muted` 等

## 合同状态颜色映射
| 状态 | 颜色 | Tailwind类 | 对应入驻步骤 |
|------|------|-----------|-------------|
| draft (草稿) | 灰色 | slate-* | 初始状态 |
| pending (待签) | 琥珀色 | amber-* | 签订合同 |
| signed (已签) | 翡翠绿 | emerald-* | 费用缴纳/完成 |
| expired (已到期) | 玫瑰粉 | rose-* | 异常状态 |
| terminated (已终止) | 灰色 | slate-* | 终止状态 |

## 核心文件修改
- 文件操作:
  - edit: `src/app/dashboard/base/contracts/page.tsx` - 合同列表页面，统一状态颜色
  - edit: `src/app/dashboard/base/contracts/[id]/page.tsx` - 合同详情页面，统一状态颜色
  - edit: `src/app/dashboard/base/contracts/new/page.tsx` - 合同创建流程
  - edit: `src/app/dashboard/constants.tsx` - 导航结构
  - edit: `src/app/api/enterprises/route.ts` - 企业名称查重
  - edit: `src/app/api/enterprises/[id]/route.ts` - 企业更新查重
- 关键修改:
  - 合同状态配置统一使用七彩配色系统
  - 草稿: slate（灰色）、待签: amber（琥珀色）、已签: emerald（翡翠绿）、已到期: rose（玫瑰粉）、已终止: slate（灰色）

## 问题或错误及解决方案
- 问题: 用户反馈合同创建流程过于复杂
  - 解决方案: 简化为3步通用流程，去掉场地类型、费用计算等复杂步骤
- 问题: 用户反馈日期填写繁琐
  - 解决方案: 改为开始日期+有效时长，自动计算截止日期
- 问题: 合同详情页面显示混乱
  - 解决方案: 简化为卡片式布局，只显示核心信息
- 问题: 上传附件时报错 `Cannot read properties of undefined (reading 'key')`
  - 解决方案: 修正属性访问路径为 `result.key` 而非 `result.data.key`
- 问题: 合同状态未按预期变化
  - 解决方案: 创建合同时统一为草稿，上传附件后保持原状态，点击确认签署才变为已签
- 问题: 合同列表按状态过滤不生效
  - 解决方案: 添加独立的状态过滤器，统计卡片点击时按状态过滤而非关键词搜索
- 问题: 删除确认使用浏览器原生弹窗
  - 解决方案: 改用 shadcn/ui 的 AlertDialog 组件
- 问题: 存在重复企业名称
  - 解决方案: 添加企业名称查重逻辑，清理重复数据
- 问题: 合同管理页面UI风格与其他页面不一致
  - 解决方案: 统一使用 globals.css 定义的七彩配色系统，与入驻流程步骤颜色对应

## TODO
- 基于合同范本实现合同生成功能
