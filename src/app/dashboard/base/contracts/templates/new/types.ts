// 步骤定义 - 基本信息放在第一步
export const STEPS = [
  { id: 1, title: "基本信息", description: "填写模板信息" },
  { id: 2, title: "上传文档", description: "上传合同文件" },
  { id: 3, title: "解析文档", description: "解析文档内容" },
  { id: 4, title: "绑定变量", description: "选择变量并绑定位置" },
  { id: 5, title: "完成", description: "预览并保存" },
] as const;

// 附件文件类型（包含上传状态）
export interface AttachmentFile {
  id: string;
  file?: File | null; // 新上传的文件（可选，已上传的附件没有这个）
  name: string;
  type: string;
  size: number;
  url?: string; // 已上传的附件 URL（可选）
  uploading?: boolean; // 是否正在上传
}

// 已上传的附件类型
export interface UploadedAttachment {
  id: string;
  name: string;
  url: string;
  fileType: string;
  size?: number; // 可选
}

// 基地类型
export interface Base {
  id: string;
  name: string;
  address: string | null;
}

// 标记类型
export interface Marker {
  id: string;
  documentId: string; // 'main' 或附件ID
  status: 'pending' | 'bound';
  variableKey?: string;
  position: {
    beforeText: string;
    afterText: string;
    textOffset: number;
    clickContext?: {
      parentTagName: string;
      parentClass: string;
      nearestId: string;
      party?: string;
    };
  };
  displayText?: string;
}

// 变量绑定
export interface Binding {
  id: string;
  variableKey: string;
  position: Marker['position'];
}

// 字体选项
export const FONT_OPTIONS = [
  { value: 'SimSun', label: '宋体' },
  { value: 'SimHei', label: '黑体' },
  { value: 'KaiTi', label: '楷体' },
  { value: 'FangSong', label: '仿宋' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
] as const;

// 行间距选项
export const LINE_HEIGHT_OPTIONS = [
  { value: '0.5', label: '0.5倍' },
  { value: '0.75', label: '0.75倍' },
  { value: '1', label: '单倍' },
  { value: '1.15', label: '1.15倍' },
  { value: '1.5', label: '1.5倍' },
  { value: '2', label: '2倍' },
  { value: '2.5', label: '2.5倍' },
  { value: '3', label: '3倍' },
] as const;

// 公文格式预设（包含完整的样式定义）
export interface DocumentPreset {
  key: string;
  label: string;
  font: string;
  size: number;
  lineHeight: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  description?: string;
}

export const DOCUMENT_PRESETS: DocumentPreset[] = [
  { 
    key: 'official-title', 
    label: '公文标题', 
    font: 'SimHei', 
    size: 22, 
    lineHeight: '1.5',
    bold: true,
    align: 'center',
    description: '黑体、二号、居中、1.5倍行距'
  },
  { 
    key: 'heading1', 
    label: '一级标题', 
    font: 'SimHei', 
    size: 16, 
    lineHeight: '1.5',
    bold: true,
    align: 'left',
    description: '黑体、三号、加粗、1.5倍行距'
  },
  { 
    key: 'heading2', 
    label: '二级标题', 
    font: 'SimHei', 
    size: 14, 
    lineHeight: '1.5',
    bold: true,
    align: 'left',
    description: '黑体、四号、加粗、1.5倍行距'
  },
  { 
    key: 'heading3', 
    label: '三级标题', 
    font: 'SimHei', 
    size: 12, 
    lineHeight: '1.5',
    bold: true,
    align: 'left',
    description: '黑体、小四、加粗、1.5倍行距'
  },
  { 
    key: 'body-normal', 
    label: '正文(三号)', 
    font: 'SimSun', 
    size: 16, 
    lineHeight: '1.5',
    align: 'justify',
    description: '宋体、三号、两端对齐、1.5倍行距'
  },
  { 
    key: 'body-small', 
    label: '正文(小四)', 
    font: 'SimSun', 
    size: 12, 
    lineHeight: '1.5',
    align: 'justify',
    description: '宋体、小四、两端对齐、1.5倍行距'
  },
  { 
    key: 'signature', 
    label: '签章区', 
    font: 'SimSun', 
    size: 12, 
    lineHeight: '1.5',
    align: 'right',
    description: '宋体、小四、右对齐、1.5倍行距'
  },
];

// 工具函数：格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// 工具函数：附件去重和排序
export function dedupeAndSortAttachments<T extends { id: string; order?: number }>(
  attachments: T[]
): T[] {
  return [...attachments]
    .filter((att, index, self) => 
      self.findIndex(a => a.id === att.id) === index
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}
