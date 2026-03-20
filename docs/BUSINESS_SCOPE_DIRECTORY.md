# 经营范围规范表述目录

## 数据来源

**官方文件**：《经营范围规范表述目录（征求意见稿）》

**发布机构**：国家市场监督管理总局

**发布时间**：2021年3月15日

**官方链接**：https://www.samr.gov.cn/hd/zjdc/art/2023/art_45c400468e9a45caa2254defd2ef074b.html

**PDF下载**：https://www.samr.gov.cn/cms_files/filemanager/1647978232/attach/20233/P020210316361615430877.pdf

## 法律依据

### 1. 《市场主体登记管理条例》第十四条

> 市场主体的经营范围包括一般经营项目和许可经营项目。经营范围中属于在登记前依法须经批准的许可经营项目，市场主体应当在申请登记时提交有关批准文件。
>
> 市场主体应当按照登记机关公布的经营项目分类标准办理经营范围登记。

### 2. 《企业经营范围登记管理规定》第三条

> 申请人应当参照《国民经济行业分类》选择一种或多种小类、中类或者大类自主提出经营范围登记申请。

### 3. 《国民经济行业分类》GB/T 4754-2017

国民经济行业分类是中华人民共和国国家标准，规定了全社会经济活动的分类和代码。

## 数据统计

### 总条目数

**1550条** 经营范围规范表述条目

### 按行业大类统计

| 行业大类 | 条目数 |
|---------|-------|
| 批发和零售业 | 584条 |
| 科学研究和技术服务业 | 161条 |
| 租赁和商务服务业 | 146条 |
| 农、林、牧、渔业 | 89条 |
| 交通运输、仓储和邮政业 | 86条 |
| 制造业 | 71条 |
| 水利、环境和公共设施管理业 | 65条 |
| 居民服务、修理和其他服务业 | 64条 |
| 信息传输、软件和信息技术服务业 | 60条 |
| 金融业 | 60条 |
| 文化、体育和娱乐业 | 55条 |
| 建筑业 | 28条 |
| 教育 | 25条 |
| 电力、热力、燃气及水生产和供应业 | 13条 |
| 住宿和餐饮业 | 12条 |
| 卫生和社会工作 | 12条 |
| 房地产业 | 10条 |
| 采矿业 | 9条 |

### 按许可类型统计

| 许可类型 | 条目数 | 说明 |
|---------|-------|------|
| 一般事项 | 995条 | 无需许可，可直接登记 |
| 后置许可 | 520条 | 登记后需取得相关许可 |
| 前置许可 | 35条 | 登记前需取得相关批准 |

## 数据格式

### TypeScript 接口

```typescript
export type LicenseType = 'general' | 'post' | 'pre';

export interface BusinessScope {
  /** 条目代码（如 A1001） */
  id: string;
  /** 经营范围表述（如 "谷物种植"） */
  name: string;
  /** 行业大类名称（如 "农、林、牧、渔业"） */
  category: string;
  /** 行业大类代码（如 "A"） */
  categoryCode: string;
  /** 许可类型 */
  licenseType: LicenseType;
}
```

### 示例数据

```typescript
{ id: 'A1001', name: '谷物种植', category: '农、林、牧、渔业', categoryCode: 'A', licenseType: 'general' }
{ id: 'A1008', name: '烟草种植', category: '农、林、牧、渔业', categoryCode: 'A', licenseType: 'pre' }
{ id: 'A1017', name: '茶叶种植', category: '农、林、牧、渔业', categoryCode: 'A', licenseType: 'post' }
```

## 使用方法

### 在项目中使用

```typescript
import { 
  BUSINESS_SCOPES, 
  searchBusinessScopes, 
  getScopesByCategory,
  getScopeById 
} from './data/business-scopes-official';

// 搜索经营范围
const results = searchBusinessScopes('谷物');
// [{ id: 'A1001', name: '谷物种植', ... }]

// 按行业大类筛选
const agriculturalScopes = getScopesByCategory('A');

// 按ID查询
const scope = getScopeById('A1001');
```

## 文件位置

- **PDF原文**：`docs/经营范围规范表述目录.pdf`
- **TypeScript数据**：`src/app/dashboard/base/applications/[id]/data/business-scopes-official.ts`

## 更新说明

数据来源于2021年3月发布的征求意见稿。正式版发布后需及时更新。

如需获取最新数据，请访问：
- 市场监管总局官网：https://www.samr.gov.cn
- 各省市场监管局官网
