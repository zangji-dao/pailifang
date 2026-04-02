# 合同管理模块 - 业务梳理与重构规划

## 一、当前问题诊断

### 1. 代码层面问题
- ✗ 主文件 `page.tsx` 已达 919 行，难以维护
- ✗ 状态管理混乱，有 20+ 个 useState
- ✗ 草稿保存/恢复逻辑复杂，容易出错
- ✗ 文件上传状态判断逻辑不清晰
- ✗ 附件管理逻辑分散在多处

### 2. 业务逻辑问题
- ✗ 草稿保存时机不明确
- ✗ 文件上传失败后无法重试
- ✗ 附件数据和主文档数据耦合
- ✗ 变量绑定逻辑复杂

---

## 二、核心业务流程梳理

### 1. 合同模板创建流程（5步）

```
┌──────────────────────────────────────────────────────────────┐
│                      Step 1: 上传文档                          │
├──────────────────────────────────────────────────────────────┤
│ 用户操作：                                                     │
│ - 选择主文档（Word格式）                                        │
│ - 选择附件（Word格式，可选，可多个）                             │
│                                                              │
│ 系统行为：                                                     │
│ - 自动上传主文档到对象存储                                       │
│ - 自动上传附件到对象存储                                         │
│ - 返回文件URL和templateId                                       │
│                                                              │
│ 状态变化：                                                     │
│ - templateId: string                                          │
│ - mainFileUrl: string                                         │
│ - attachments: Attachment[]                                    │
│                                                              │
│ 下一步条件：                                                   │
│ - templateId && mainFileUrl 存在                               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      Step 2: 编辑文档                          │
├──────────────────────────────────────────────────────────────┤
│ 系统行为（自动执行）：                                          │
│ - 调用解析API，将Word转换为HTML                                 │
│ - 提取附件内容                                                  │
│ - 保存解析结果到 parseResult                                    │
│                                                              │
│ 用户操作：                                                     │
│ - 编辑主文档HTML内容                                            │
│ - 切换附件标签页编辑附件                                         │
│ - 使用编辑器工具调整格式                                         │
│                                                              │
│ 状态变化：                                                     │
│ - parseResult: ParseResult                                    │
│ - editedHtml: string                                          │
│                                                              │
│ 草稿保存：                                                     │
│ - 点击"下一步"时自动保存                                         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      Step 3: 绑定变量                          │
├──────────────────────────────────────────────────────────────┤
│ 用户操作：                                                     │
│ - 在文档中定位光标                                               │
│ - 点击"插入变量标记"按钮                                         │
│ - 从变量面板选择变量类型                                         │
│ - 可添加自定义变量                                               │
│                                                              │
│ 系统行为：                                                     │
│ - 插入 {{变量名}} 标记                                          │
│ - 记录标记位置和变量类型                                         │
│                                                              │
│ 状态变化：                                                     │
│ - markers: Marker[]                                           │
│ - selectedVariables: Variable[]                                │
│ - bindings: Binding[]                                          │
│                                                              │
│ 草稿保存：                                                     │
│ - 点击"下一步"时自动保存                                         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      Step 4: 基本信息                          │
├──────────────────────────────────────────────────────────────┤
│ 用户操作：                                                     │
│ - 填写模板名称                                                   │
│ - 填写模板描述                                                   │
│ - 选择模板类型（入驻企业/服务企业）                                │
│ - 选择所属基地                                                   │
│ - 设置是否默认模板                                               │
│                                                              │
│ 状态变化：                                                     │
│ - name: string                                                │
│ - description: string                                          │
│ - type: 'tenant' | 'non_tenant'                               │
│ - baseId: string                                              │
│ - isDefault: boolean                                          │
│                                                              │
│ 草稿保存：                                                     │
│ - 点击"下一步"时自动保存                                         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      Step 5: 完成                              │
├──────────────────────────────────────────────────────────────┤
│ 用户操作：                                                     │
│ - 预览模板                                                      │
│ - 确认无误后点击"发布"                                           │
│                                                              │
│ 系统行为：                                                     │
│ - 保存最终模板数据                                               │
│ - 更新模板状态为 'published'                                     │
│ - 保存变量字段到 contract_fields 表                              │
│ - 跳转到模板列表页                                               │
│                                                              │
│ 状态变化：                                                     │
│ - status: 'published'                                         │
└──────────────────────────────────────────────────────────────┘
```

### 2. 合同模板编辑流程

```
用户点击"编辑模板"
        ↓
检查模板状态
        ↓
    ┌───────────┐
    │  草稿状态   │ → 直接加载草稿数据，恢复到上次的步骤
    └───────────┘
        ↓
    ┌───────────┐
    │ 已发布状态  │ → 创建新草稿记录？还是直接编辑？
    └───────────┘
```

**问题**：当前实现是直接编辑已发布模板，保存草稿时更新同一条记录的 `draft_data`。这样会导致：
1. 已发布模板被修改
2. 无法回滚到之前的版本

**建议**：
- 编辑已发布模板时，创建一个新的草稿记录
- 草稿记录关联原模板ID（`original_template_id`）
- 发布时更新原模板数据

### 3. 合同创建流程（基于模板生成合同）

```
┌──────────────────────────────────────────────────────────────┐
│                      Step 1: 选择企业                          │
├──────────────────────────────────────────────────────────────┤
│ 用户操作：                                                     │
│ - 搜索企业（按名称/编码）                                        │
│ - 选择企业                                                      │
│                                                              │
│ 状态变化：                                                     │
│ - selectedEnterprise: Enterprise                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      Step 2: 选择模板 & 填写信息                │
├──────────────────────────────────────────────────────────────┤
│ 用户操作：                                                     │
│ - 选择合同模板                                                   │
│ - 填写签订日期                                                   │
│ - 选择合同类型（入驻/服务）                                       │
│ - 上传合同附件                                                   │
│                                                              │
│ 状态变化：                                                     │
│ - selectedTemplate: Template                                  │
│ - signDate: Date                                              │
│ - contractType: string                                        │
│ - attachments: Attachment[]                                    │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      Step 3: 填写变量                          │
├──────────────────────────────────────────────────────────────┤
│ 用户操作：                                                     │
│ - 根据模板变量字段填写值                                          │
│ - 系统自动填充企业基本信息                                         │
│                                                              │
│ 系统行为：                                                     │
│ - 从企业信息自动填充：企业名称、地址、联系方式等                      │
│ - 用户可修改自动填充的值                                          │
│                                                              │
│ 状态变化：                                                     │
│ - variableValues: Record<string, string>                      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      Step 4: 生成合同                          │
├──────────────────────────────────────────────────────────────┤
│ 系统行为：                                                     │
│ - 替换模板中的变量标记为实际值                                     │
│ - 生成PDF文件                                                   │
│ - 保存合同记录到数据库                                           │
│                                                              │
│ 状态变化：                                                     │
│ - contractId: string                                          │
│ - pdfUrl: string                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 三、数据模型设计

### 1. contract_templates 表（合同模板）

```typescript
interface ContractTemplate {
  id: string;                      // 主键
  name: string;                    // 模板名称
  description: string;             // 模板描述
  type: 'tenant' | 'non_tenant';   // 模板类型
  base_id: string;                 // 所属基地ID
  status: 'draft' | 'published' | 'archived'; // 模板状态
  
  // 文件信息
  source_file_url: string;         // 主文档URL
  source_file_name: string;        // 主文档文件名
  source_file_type: string;        // 文件类型（docx）
  
  // 草稿数据（JSON）
  draft_data: {
    currentStep: number;           // 当前步骤
    editedHtml: string;            // 编辑后的HTML
    styles: string;                // 样式
    markers: Marker[];             // 变量标记
    selectedVariables: Variable[]; // 选中的变量
    bindings: Binding[];           // 变量绑定关系
    attachments: Attachment[];     // 附件列表（含HTML和样式）
    uploadedAttachments: UploadedAttachment[]; // 已上传的附件信息
    original_template_id?: string; // 原模板ID（用于编辑已发布模板）
  };
  
  // 附件列表（简化版，用于列表页显示）
  attachments: {
    id: string;
    name: string;
    url: string;
    description: string;
    required: boolean;
    order: number;
  }[];
  
  is_default: boolean;             // 是否默认模板
  is_active: boolean;              // 是否启用
  created_at: string;
  updated_at: string;
}
```

### 2. contract_fields 表（模板变量字段）

```typescript
interface ContractField {
  id: string;
  template_id: string;             // 所属模板ID
  field_key: string;               // 字段键名（如：enterprise_name）
  field_label: string;             // 字段显示名（如：企业名称）
  field_type: 'text' | 'date' | 'number' | 'select'; // 字段类型
  placeholder?: string;            // 占位符
  default_value?: string;          // 默认值
  options?: string[];              // 选项（用于select类型）
  sort_order: number;              // 排序
  created_at: string;
}
```

### 3. contracts 表（合同）

```typescript
interface Contract {
  id: string;
  enterprise_id: string;           // 企业ID
  template_id: string;             // 模板ID
  contract_no: string;             // 合同编号
  sign_date: string;               // 签订日期
  start_date: string;              // 开始日期
  end_date: string;                // 结束日期
  type: string;                    // 合同类型
  status: 'draft' | 'active' | 'completed' | 'terminated'; // 合同状态
  
  // 合同内容
  content_html: string;            // 合同HTML内容
  pdf_url: string;                 // PDF文件URL
  
  // 附件
  attachments: {
    id: string;
    name: string;
    url: string;
  }[];
  
  // 变量值
  field_values: Record<string, string>; // 字段值
  
  created_at: string;
  updated_at: string;
}
```

---

## 四、状态管理方案

### 当前问题
主文件中有 20+ 个 useState，状态分散，难以管理。

### 建议方案：使用 Context + useReducer

```typescript
// 1. 创建全局状态 Context
type TemplateState = {
  // 当前步骤
  currentStep: number;
  
  // 模板基本信息
  templateId: string;
  name: string;
  description: string;
  type: 'tenant' | 'non_tenant';
  baseId: string;
  isDefault: boolean;
  
  // 文件信息
  mainFile: File | null;
  mainFileUrl: string;
  mainFileName: string;
  
  // 上传状态
  uploading: boolean;
  parsing: boolean;
  parseProgress: number;
  
  // 解析结果
  parseResult: ParseResult | null;
  editedHtml: string;
  
  // 变量管理
  markers: Marker[];
  selectedVariables: Variable[];
  bindings: Binding[];
  
  // 附件管理
  attachments: Attachment[];
  uploadedAttachments: UploadedAttachment[];
  
  // 加载状态
  loadingDraft: boolean;
  saving: boolean;
};

// 2. 创建 Reducer
type TemplateAction = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_TEMPLATE_ID'; payload: string }
  | { type: 'SET_MAIN_FILE'; payload: { file: File; url: string; name: string } }
  | { type: 'SET_PARSE_RESULT'; payload: ParseResult }
  | { type: 'ADD_MARKER'; payload: Marker }
  | { type: 'REMOVE_MARKER'; payload: string }
  // ... 其他 action
  ;

// 3. 创建 Context Provider
export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(templateReducer, initialState);
  
  return (
    <TemplateContext.Provider value={{ state, dispatch }}>
      {children}
    </TemplateContext.Provider>
  );
}

// 4. 创建自定义 Hook
export function useTemplate() {
  const { state, dispatch } = useContext(TemplateContext);
  
  const setStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };
  
  // ... 其他方法
  
  return { state, setStep, /* ... */ };
}
```

### 状态管理拆分建议

```
src/app/dashboard/base/contracts/templates/new/
├── page.tsx                    # 主页面（精简到100行以内）
├── context/
│   └── TemplateContext.tsx     # 全局状态管理
├── hooks/
│   ├── useTemplateActions.ts   # 模板操作（保存、发布等）
│   ├── useFileUpload.ts        # 文件上传逻辑
│   ├── useDraft.ts             # 草稿保存/恢复逻辑
│   ├── useVariables.ts         # 变量管理逻辑
│   └── index.ts
├── components/
│   ├── steps/
│   │   ├── UploadStep.tsx      # 上传文档步骤
│   │   ├── EditStep.tsx        # 编辑文档步骤
│   │   ├── BindVariablesStep.tsx # 绑定变量步骤
│   │   ├── BasicInfoStep.tsx   # 基本信息步骤
│   │   └── CompleteStep.tsx    # 完成步骤
│   ├── shared/
│   │   ├── StepIndicator.tsx   # 步骤指示器
│   │   ├── StepNavigation.tsx  # 步骤导航按钮
│   │   └── AttachmentTabs.tsx  # 附件标签页
│   └── index.ts
└── types/
    └── index.ts                # 类型定义
```

---

## 五、草稿保存策略

### 当前问题
1. 草稿保存时机不明确
2. 草稿数据结构复杂
3. 恢复草稿时容易出错

### 建议方案：分层保存策略

#### 1. 自动保存（静默）
- **触发时机**：用户操作后 3 秒无新操作
- **保存内容**：当前步骤的所有状态
- **用户体验**：无提示，后台静默保存

#### 2. 步骤保存（显式）
- **触发时机**：点击"下一步"或"上一步"
- **保存内容**：当前步骤的所有状态
- **用户体验**：显示"保存中..."提示

#### 3. 最终保存
- **触发时机**：点击"发布"
- **保存内容**：所有数据 + 更新状态为 published
- **用户体验**：显示"发布中..."，成功后跳转

### 草稿数据结构优化

```typescript
// 简化后的草稿数据结构
interface DraftData {
  // 当前步骤
  currentStep: number;
  
  // 基本信息（Step 4）
  basicInfo: {
    name: string;
    description: string;
    type: 'tenant' | 'non_tenant';
    baseId: string;
    isDefault: boolean;
  };
  
  // 文档内容（Step 2）
  document: {
    editedHtml: string;
    styles: string;
    parseResult: ParseResult; // 包含附件信息
  };
  
  // 变量绑定（Step 3）
  variables: {
    markers: Marker[];
    selectedVariables: Variable[];
    bindings: Binding[];
  };
  
  // 元数据
  metadata: {
    lastSavedAt: string;
    stepCompleted: number[]; // 已完成的步骤
  };
}
```

---

## 六、重构建议

### 方案A：渐进式重构（推荐）

**优点**：
- 风险小，可以逐步验证
- 不影响现有功能
- 可以边重构边修复bug

**步骤**：
1. 先修复当前的bug（文件上传状态判断）
2. 创建 Context + useReducer 管理状态
3. 逐步将逻辑迁移到 Hooks
4. 最后清理主文件

**时间估算**：2-3天

### 方案B：完全重构

**优点**：
- 彻底解决架构问题
- 代码更清晰
- 易于维护

**缺点**：
- 风险大，可能引入新bug
- 时间长
- 需要完整测试

**时间估算**：5-7天

### 方案C：保持现状，只修复bug

**优点**：
- 快速解决当前问题

**缺点**：
- 后续维护困难
- 技术债务累积
- 可能出现更多bug

**时间估算**：1天

---

## 七、建议采用方案

**推荐方案A：渐进式重构**

### 第一阶段：修复当前bug（1天）
1. ✅ 修复文件上传状态判断逻辑
2. ✅ 修复草稿恢复逻辑
3. ✅ 添加更清晰的错误提示

### 第二阶段：创建状态管理（1天）
1. 创建 TemplateContext
2. 创建 useReducer
3. 迁移核心状态

### 第三阶段：拆分逻辑（1天）
1. 创建 useFileUpload Hook
2. 创建 useDraft Hook
3. 创建 useVariables Hook

### 第四阶段：清理代码（0.5天）
1. 删除主文件中的冗余代码
2. 优化导入导出
3. 添加注释和文档

---

## 八、API 接口设计

### 模板相关接口

```
POST   /api/contract-templates/upload          # 上传主文档
POST   /api/contract-templates/upload-attachment # 上传附件
POST   /api/contract-templates/parse            # 解析文档
POST   /api/contract-templates/draft            # 保存草稿
GET    /api/contract-templates/draft?id=xxx     # 获取草稿
GET    /api/contract-templates                  # 获取模板列表
GET    /api/contract-templates?id=xxx           # 获取模板详情
PUT    /api/contract-templates                  # 更新模板
DELETE /api/contract-templates?id=xxx           # 删除模板
POST   /api/contract-templates/publish          # 发布模板
```

### 合同相关接口

```
POST   /api/contracts                           # 创建合同
GET    /api/contracts                           # 获取合同列表
GET    /api/contracts?id=xxx                    # 获取合同详情
PUT    /api/contracts                           # 更新合同
DELETE /api/contracts?id=xxx                    # 删除合同
POST   /api/contracts/generate-pdf              # 生成PDF
```

---

## 九、下一步行动

请确认以下问题：

1. **重构方案选择**：
   - [ ] 方案A：渐进式重构（推荐）
   - [ ] 方案B：完全重构
   - [ ] 方案C：保持现状

2. **编辑已发布模板的策略**：
   - [ ] 直接编辑同一条记录（当前实现）
   - [ ] 创建新草稿记录，发布时更新原模板

3. **草稿保存策略**：
   - [ ] 自动保存（3秒无操作后）
   - [ ] 手动保存（点击"下一步"时）
   - [ ] 两者结合

4. **是否需要版本管理**：
   - [ ] 需要（可以回滚到历史版本）
   - [ ] 不需要（只有最新版本）

确认后，我会开始执行重构工作。
