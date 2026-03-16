# 辅助核算模块设计文档

## 一、模块概述

辅助核算模块用于管理会计凭证中需要辅助核算的基础档案，支持8种核算类型。

### 核算类型
| 类型代码 | 类型名称 | 说明 |
|---------|---------|------|
| customer | 客户 | 客户档案管理，包含纳税人类型、信用代码等 |
| supplier | 供应商 | 供应商档案管理 |
| department | 部门 | 部门组织架构 |
| employee | 职员 | 职员信息管理 |
| project | 项目 | 项目档案管理 |
| inventory | 存货 | 存货档案管理 |
| fixed_asset | 固定资产 | 固定资产管理 |
| partner | 往来单位 | 兼具客户/供应商属性的单位 |

## 二、业务逻辑

### 2.1 科目与辅助核算的关联
- 每个会计科目可设置多个辅助核算类型
- 辅助核算类型根据科目编码智能推荐：
  - **数量核算**：适用于原材料、库存商品等存货类科目（编码 140x）
  - **客户核算**：适用于应收账款、预收账款等（编码 1122、2203）
  - **供应商核算**：适用于应付账款、预付账款等（编码 2202、1123）
  - **职员核算**：适用于其他应收款-备用金、应付职工薪酬等
  - **部门核算**：适用于管理费用、销售费用等
  - **项目核算**：适用于工程物资、在建工程等

### 2.2 编码规则
- 各类型档案独立编码，互不干扰
- 编码支持手动输入或自动生成
- 建议编码规则：
  - 部门：2位数字（01, 02, ...）
  - 职员：E + 3位数字（E001, E002, ...）
  - 项目：P + 3位数字（P001, P002, ...）
  - 存货：INV + 3位数字
  - 客户/供应商：顺序编号

### 2.3 状态管理
- 每个档案有"启用"/"停用"两种状态
- 停用的档案不在凭证录入时显示
- 已使用的档案不允许删除，只能停用

## 三、数据结构

### 3.1 辅助核算类型表 (auxiliary_types)
```sql
CREATE TABLE auxiliary_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,  -- 类型代码
  name VARCHAR(100) NOT NULL,         -- 类型名称
  description TEXT,                    -- 描述
  is_system BOOLEAN DEFAULT true,      -- 是否系统预设
  sort_order INT DEFAULT 0,           -- 排序
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 辅助核算档案表 (auxiliary_items)
```sql
CREATE TABLE auxiliary_items (
  id SERIAL PRIMARY KEY,
  type_id INT NOT NULL REFERENCES auxiliary_types(id),
  code VARCHAR(50) NOT NULL,           -- 档案编码
  name VARCHAR(200) NOT NULL,          -- 档案名称
  custom_fields JSONB,                 -- 扩展字段（JSON格式存储不同类型的特有字段）
  status VARCHAR(20) DEFAULT '启用',   -- 状态
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(type_id, code)                -- 同类型下编码唯一
);
```

### 3.3 科目辅助核算设置表 (account_auxiliary_settings)
```sql
CREATE TABLE account_auxiliary_settings (
  id SERIAL PRIMARY KEY,
  account_id INT NOT NULL REFERENCES chart_of_accounts(id),
  auxiliary_type_id INT NOT NULL REFERENCES auxiliary_types(id),
  is_required BOOLEAN DEFAULT false,   -- 是否必填
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, auxiliary_type_id)
);
```

### 3.4 凭证分录辅助核算明细表 (voucher_entry_auxiliaries)
```sql
CREATE TABLE voucher_entry_auxiliaries (
  id SERIAL PRIMARY KEY,
  entry_id INT NOT NULL REFERENCES voucher_entries(id),
  auxiliary_type_id INT NOT NULL REFERENCES auxiliary_types(id),
  auxiliary_item_id INT NOT NULL REFERENCES auxiliary_items(id),
  amount DECIMAL(18,2),                -- 辅助核算金额（用于多币种、数量核算等）
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 四、扩展字段设计

不同类型的档案有不同的字段，使用 JSONB 存储扩展字段：

### 客户/供应商
```json
{
  "category": "一般纳税人",           // 客户类别
  "creditCode": "91220700MAEW85BW0W", // 统一社会信用代码
  "contact": "王经理",                // 联系人
  "phone": "13800138001",            // 手机号
  "address": "吉林省松原市",          // 地址
  "bankName": "中国银行",             // 开户银行
  "bankAccount": "6217000010000000"  // 银行账号
}
```

### 职员
```json
{
  "department": "财务部",    // 所属部门
  "phone": "13800138001",   // 手机号
  "idCard": "220xxx",       // 身份证号
  "entryDate": "2024-01-01" // 入职日期
}
```

### 项目
```json
{
  "startDate": "2026-01-01",  // 开始日期
  "endDate": "2026-12-31",    // 结束日期
  "manager": "张三",          // 负责人
  "budget": 1000000           // 预算
}
```

### 存货
```json
{
  "spec": "通用型",      // 规格型号
  "unit": "套",         // 计量单位
  "category": "办公用品" // 存货类别
}
```

### 固定资产
```json
{
  "category": "电子设备",     // 资产类别
  "purchaseDate": "2024-01-01", // 购置日期
  "originalValue": 10000,       // 原值
  "depreciationYears": 5        // 折旧年限
}
```

## 五、关键文件

| 文件路径 | 说明 |
|---------|------|
| `src/app/accounting/auxiliary/AuxiliarySettingsPage.tsx` | 列表页面（类型切换、视图切换、搜索） |
| `src/app/accounting/auxiliary/AuxiliaryEditPage.tsx` | 编辑页面（新增/编辑档案） |
| `src/app/accounting/auxiliary/index.ts` | 模块导出 |
| `backend/migrations/add_auxiliary_tables.sql` | 数据库迁移脚本 |
| `backend/src/config/accountingSchema.ts` | 数据表定义 |

## 六、设计决策

1. **标签页模式**：新增/编辑操作在新标签页打开，不使用弹窗
2. **配色主题**：统一使用琥珀色（amber-500），与项目主色调一致
3. **视图切换**：支持列表视图和卡片视图，满足不同使用场景
4. **响应式布局**：工具栏单行紧凑布局，适配不同屏幕宽度
5. **扩展字段**：使用 JSONB 存储不同类型的特有字段，便于扩展

## 七、后续优化

- [ ] 接入后端 API，实现真实数据存储
- [ ] 档案导入导出功能
- [ ] 档案使用情况查询（哪些凭证使用了该档案）
- [ ] 批量操作（批量启用/停用/删除）
- [ ] 编码自动生成规则配置

---

## 八、币种管理

### 8.1 功能说明
币种管理用于设置系统支持的币种及汇率，是外币核算的基础配置。

### 8.2 数据结构

#### 币种档案表 (currencies)
```sql
CREATE TABLE currencies (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,        -- 币种代码（如 CNY、USD、EUR）
  name VARCHAR(50) NOT NULL,               -- 币种名称（如 人民币、美元）
  symbol VARCHAR(10),                       -- 货币符号（如 ¥、$、€）
  exchange_rate DECIMAL(18, 6) DEFAULT 1,   -- 汇率（相对于本位币）
  is_base BOOLEAN DEFAULT FALSE,            -- 是否本位币
  decimal_places INTEGER DEFAULT 2,         -- 小数位数
  status VARCHAR(20) DEFAULT 'active',      -- 状态
  sort_order INTEGER DEFAULT 0,             -- 排序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 汇率历史表 (exchange_rate_history)
```sql
CREATE TABLE exchange_rate_history (
  id VARCHAR(36) PRIMARY KEY,
  currency_id VARCHAR(36) NOT NULL,         -- 币种ID
  currency_code VARCHAR(10) NOT NULL,       -- 币种代码
  rate_date DATE NOT NULL,                  -- 汇率日期
  exchange_rate DECIMAL(18, 6) NOT NULL,    -- 汇率
  source VARCHAR(50),                       -- 汇率来源
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8.3 业务规则

1. **本位币设置**
   - 系统必须且只能有一个本位币
   - 本位币汇率固定为 1
   - 本位币不能停用或删除

2. **汇率管理**
   - 汇率表示外币相对于本位币的比值
   - 汇率更新后，已录入凭证不受影响
   - 支持汇率历史记录

3. **小数位数**
   - 控制外币金额的显示精度
   - 日元、韩元等为 0 位
   - 人民币、美元等为 2 位

### 8.4 预设币种

| 代码 | 名称 | 符号 | 小数位 |
|-----|------|-----|-------|
| CNY | 人民币 | ¥ | 2 |
| USD | 美元 | $ | 2 |
| EUR | 欧元 | € | 2 |
| GBP | 英镑 | £ | 2 |
| JPY | 日元 | ¥ | 0 |
| HKD | 港币 | HK$ | 2 |
| TWD | 新台币 | NT$ | 2 |
| KRW | 韩元 | ₩ | 0 |

### 8.5 关键文件

| 文件路径 | 说明 |
|---------|------|
| `src/app/accounting/currency/CurrencySettingsPage.tsx` | 币别设置页面 |
| `src/app/accounting/currency/index.ts` | 模块导出 |
| `backend/migrations/add_currency_tables.sql` | 数据库迁移脚本 |

### 8.6 外币核算流程

1. **科目设置**：在科目设置中启用"外币核算"，选择默认币种
2. **凭证录入**：录入时填写原币金额，系统根据汇率自动折算本币金额
3. **账簿查询**：支持按原币或本币查询余额和发生额
