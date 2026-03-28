import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// 申请类型映射
const applicationTypeMap: Record<string, string> = {
  new: "新建企业",
  migration: "迁移企业",
};

// 纳税人类型映射
const taxTypeMap: Record<string, string> = {
  general: "一般纳税人",
  small_scale: "小规模纳税人",
};

// 职务映射（匹配数据库存储的下划线格式）
const roleMap: Record<string, string> = {
  legal_person: "法人代表",
  supervisor: "监事",
  finance_manager: "财务负责人",
  ewt_contact: "e窗通登录联系人",
  // 兼容驼峰格式
  legalPerson: "法人代表",
  finance: "财务负责人",
};

// 股东类型映射
const shareholderTypeMap: Record<string, string> = {
  natural: "自然人",
  enterprise: "企业",
};

// ============ 合同模板类型定义 ============

export interface TemplateStyleConfig {
  pageSize: 'A4' | 'A5' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  font: { family: string; size: number; lineHeight: number };
  titleFont: { family: string; size: number; weight: string };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    border: string;
    headerBg: string;
  };
  layout: {
    showLogo: boolean;
    logoPosition: string;
    showPageNumber: boolean;
    pageNumberPosition: string;
    headerHeight: number;
    footerHeight: number;
  };
  clauseStyle: {
    numberingStyle: string;
    indent: number;
    spacing: number;
  };
}

export interface TemplateClause {
  id: string;
  title: string;
  content: string;
  order: number;
  required: boolean;
  editable: boolean;
}

// 合同附件类型
export interface ContractAttachment {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  order: number;
}

export interface ContractTemplateData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  styleConfig: TemplateStyleConfig;
  clauses: TemplateClause[];
  attachments?: ContractAttachment[]; // 合同附件列表
  isDefault: boolean;
  isActive: boolean;
}

// PDF导出选项
export interface PdfExportOptions {
  includeAttachments?: boolean; // 是否包含附件
  selectedAttachments?: string[]; // 选中的附件ID列表
}

// ============ 申请表类型定义 ============

export interface ApplicationData {
  id: string;
  applicationNo: string;
  applicationDate: string;
  enterpriseName: string;
  applicationType: string;
  registeredCapital: string;
  currencyType: string;
  taxType: string;
  enterpriseNameBackups: string[];
  originalRegisteredAddress: string;
  mailingAddress: string;
  businessAddress: string;
  personnel: any[];
  shareholders: any[];
  expectedAnnualRevenue: string;
  expectedAnnualTax: string;
  businessScope: string;
  ewtContactName: string;
  ewtContactPhone: string;
  intermediaryDepartment: string;
  intermediaryName: string;
  intermediaryPhone: string;
  remarks: string;
}

/**
 * 创建信息行 HTML
 */
function createInfoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="width: 140px; padding: 6px 0; font-weight: bold; vertical-align: top; color: rgb(0,0,0);">${label}</td>
      <td style="padding: 6px 0; vertical-align: top; color: rgb(0,0,0);">
        <div style="padding-bottom: 4px;">${value || "-"}</div>
        <div style="border-bottom: 1px solid rgb(0,0,0); height: 1px;"></div>
      </td>
    </tr>
  `;
}

/**
 * 创建申请表 HTML 内容
 */
function createApplicationHtml(application: ApplicationData): string {
  const personnel = Array.isArray(application.personnel) ? application.personnel : [];
  const shareholders = Array.isArray(application.shareholders) ? application.shareholders : [];
  const enterpriseNameBackups = application.enterpriseNameBackups || [];

  return `
    <div style="font-family: SimSun, 宋体, serif; font-size: 14px; line-height: 1.8; color: rgb(0,0,0); background: rgb(255,255,255); padding: 40px; width: 800px;">
      <!-- 标题 -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0; color: rgb(0,0,0);">企业入驻申请表</h1>
        <div style="font-size: 14px; color: rgb(102,102,102);">Π立方企业服务中心</div>
      </div>

      <!-- 基本信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid rgb(0,0,0); padding-bottom: 5px; margin-bottom: 15px; color: rgb(0,0,0);">一、基本信息</div>
        <table style="width: 100%; border-collapse: collapse; color: rgb(0,0,0);">
          <tr>
            <td style="width: 50%; padding: 0;">
              <table style="width: 100%;">
                ${createInfoRow("申请编号：", application.applicationNo)}
                ${createInfoRow("企业名称：", application.enterpriseName)}
                ${createInfoRow("注册资本：", application.registeredCapital ? `${application.registeredCapital} 万元` : "-")}
              </table>
            </td>
            <td style="width: 50%; padding: 0;">
              <table style="width: 100%;">
                ${createInfoRow("申请日期：", application.applicationDate ? new Date(application.applicationDate).toLocaleDateString("zh-CN") : "-")}
                ${createInfoRow("申请类型：", applicationTypeMap[application.applicationType || ""] || "-")}
                ${createInfoRow("纳税人类型：", taxTypeMap[application.taxType || ""] || "-")}
              </table>
            </td>
          </tr>
        </table>
        ${enterpriseNameBackups.length > 0 ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          ${createInfoRow("备选名称：", enterpriseNameBackups.join("、"))}
        </table>
        ` : ""}
      </div>

      <!-- 地址信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid rgb(0,0,0); padding-bottom: 5px; margin-bottom: 15px; color: rgb(0,0,0);">二、地址信息</div>
        <table style="width: 100%; border-collapse: collapse;">
          ${createInfoRow("原注册地址：", application.originalRegisteredAddress)}
          ${createInfoRow("通讯地址：", application.mailingAddress)}
          ${createInfoRow("经营地址：", application.businessAddress)}
        </table>
      </div>

      <!-- 人员信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid rgb(0,0,0); padding-bottom: 5px; margin-bottom: 15px; color: rgb(0,0,0);">三、人员信息</div>
        ${personnel.length > 0 ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; color: rgb(0,0,0);">
          <thead>
            <tr style="background: rgb(245,245,245);">
              <th style="border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; width: 100px; color: rgb(0,0,0);">姓名</th>
              <th style="border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; width: 120px; color: rgb(0,0,0);">职务</th>
              <th style="border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; width: 130px; color: rgb(0,0,0);">手机号</th>
              <th style="border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; color: rgb(0,0,0);">邮箱</th>
            </tr>
          </thead>
          <tbody>
            ${personnel.map((p: any) => `
              <tr>
                <td style="border: 1px solid rgb(0,0,0); padding: 8px 10px; color: rgb(0,0,0);">${p.name || "-"}</td>
                <td style="border: 1px solid rgb(0,0,0); padding: 8px 10px; color: rgb(0,0,0);">${(p.roles || []).map((r: string) => roleMap[r] || r).join("、") || "-"}</td>
                <td style="border: 1px solid rgb(0,0,0); padding: 8px 10px; color: rgb(0,0,0);">${p.phone || "-"}</td>
                <td style="border: 1px solid rgb(0,0,0); padding: 8px 10px; color: rgb(0,0,0);">${p.email || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ` : '<p style="color: rgb(153,153,153); margin: 0;">暂无人员信息</p>'}
      </div>

      <!-- 股东信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid rgb(0,0,0); padding-bottom: 5px; margin-bottom: 15px; color: rgb(0,0,0);">四、股东信息</div>
        ${shareholders.length > 0 ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; color: rgb(0,0,0);">
          <thead>
            <tr style="background: rgb(245,245,245);">
              <th style="border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; width: 80px; color: rgb(0,0,0);">类型</th>
              <th style="border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; width: 120px; color: rgb(0,0,0);">姓名/名称</th>
              <th style="border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; width: 100px; color: rgb(0,0,0);">投资额(万元)</th>
              <th style="border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; width: 130px; color: rgb(0,0,0);">手机号</th>
              <th style="border: 1px solid rgb(0,0,0); padding: 8px 10px; text-align: left; color: rgb(0,0,0);">备注</th>
            </tr>
          </thead>
          <tbody>
            ${shareholders.map((s: any) => `
              <tr>
                <td style="border: 1px solid rgb(0,0,0); padding: 8px 10px; color: rgb(0,0,0);">${shareholderTypeMap[s.type] || "-"}</td>
                <td style="border: 1px solid rgb(0,0,0); padding: 8px 10px; color: rgb(0,0,0);">${s.name || "-"}</td>
                <td style="border: 1px solid rgb(0,0,0); padding: 8px 10px; color: rgb(0,0,0);">${s.investment || "-"}</td>
                <td style="border: 1px solid rgb(0,0,0); padding: 8px 10px; color: rgb(0,0,0);">${s.phone || "-"}</td>
                <td style="border: 1px solid rgb(0,0,0); padding: 8px 10px; color: rgb(0,0,0);">${s.type === "enterprise" ? "企业股东" : ""}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ` : '<p style="color: rgb(153,153,153); margin: 0;">暂无股东信息</p>'}
      </div>

      <!-- 经营信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid rgb(0,0,0); padding-bottom: 5px; margin-bottom: 15px; color: rgb(0,0,0);">五、经营信息</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 0;">
              <table style="width: 100%;">
                ${createInfoRow("预计年营收：", application.expectedAnnualRevenue ? `${application.expectedAnnualRevenue} 万元` : "")}
              </table>
            </td>
            <td style="width: 50%; padding: 0;">
              <table style="width: 100%;">
                ${createInfoRow("预计年纳税：", application.expectedAnnualTax ? `${application.expectedAnnualTax} 万元` : "")}
              </table>
            </td>
          </tr>
        </table>
        ${application.businessScope ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          ${createInfoRow("经营范围：", application.businessScope)}
        </table>
        ` : ""}
      </div>

      <!-- 其他信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid rgb(0,0,0); padding-bottom: 5px; margin-bottom: 15px; color: rgb(0,0,0);">六、其他信息</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 0;">
              <table style="width: 100%;">
                ${createInfoRow("园区联系人：", application.ewtContactName)}
                ${createInfoRow("中介机构：", application.intermediaryDepartment)}
              </table>
            </td>
            <td style="width: 50%; padding: 0;">
              <table style="width: 100%;">
                ${createInfoRow("园区联系电话：", application.ewtContactPhone)}
                ${createInfoRow("中介联系人：", [application.intermediaryName, application.intermediaryPhone].filter(Boolean).join(" / "))}
              </table>
            </td>
          </tr>
        </table>
        ${application.remarks ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          ${createInfoRow("备注：", application.remarks)}
        </table>
        ` : ""}
      </div>

      <!-- 签名区域 -->
      <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div style="width: 220px; text-align: center;">
          <div style="border-bottom: 1px solid rgb(0,0,0); height: 80px; margin-bottom: 10px;"></div>
          <div style="font-weight: bold; color: rgb(0,0,0); margin-bottom: 15px;">申请人签字（盖章）</div>
          <div style="font-size: 12px; color: rgb(102,102,102);">日期：____年____月____日</div>
        </div>
        <div style="width: 220px; text-align: center;">
          <div style="border-bottom: 1px solid rgb(0,0,0); height: 80px; margin-bottom: 10px;"></div>
          <div style="font-weight: bold; color: rgb(0,0,0); margin-bottom: 15px;">审核人签字</div>
          <div style="font-size: 12px; color: rgb(102,102,102);">日期：____年____月____日</div>
        </div>
      </div>

      <!-- 页脚 -->
      <div style="margin-top: 40px; font-size: 12px; color: rgb(102,102,102); display: flex; justify-content: space-between;">
        <div>申请编号：${application.applicationNo}</div>
        <div>打印时间：${new Date().toLocaleString("zh-CN")}</div>
      </div>
    </div>
  `;
}

/**
 * 导出申请表为 PDF
 */
export async function exportApplicationToPdf(application: ApplicationData): Promise<void> {
  // 创建 iframe 来完全隔离样式
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "800px";
  iframe.style.height = "2000px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("无法创建 iframe 文档");
  }

  // 写入 HTML 内容到 iframe
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          color: rgb(0,0,0) !important;
          background-color: rgb(255,255,255) !important;
          border-color: rgb(0,0,0) !important;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0;">
      ${createApplicationHtml(application)}
    </body>
    </html>
  `);
  iframeDoc.close();

  // 等待内容渲染
  await new Promise(resolve => setTimeout(resolve, 200));

  const container = iframeDoc.body.firstElementChild as HTMLElement;

  try {
    // 使用 html2canvas 生成图片
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "rgb(255,255,255)",
    });

    // A4 尺寸 (mm)
    const pageWidth = 210;
    const pageHeight = 297;
    const marginTop = 15; // 上边距
    const marginBottom = 15; // 下边距
    const marginLeft = 15; // 左边距
    const contentWidth = pageWidth - marginLeft * 2;
    const contentHeight = pageHeight - marginTop - marginBottom;

    // 计算图片尺寸
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    
    // 每页能放的内容高度
    const usableHeight = contentHeight;
    let currentY = 0;
    let pageNum = 0;

    // 分页处理
    while (currentY < imgHeight) {
      if (pageNum > 0) {
        pdf.addPage();
      }

      // 计算当前页显示的图片区域
      const sourceY = (currentY / imgHeight) * canvas.height;
      const sourceHeight = Math.min(
        (usableHeight / imgHeight) * canvas.height,
        canvas.height - sourceY
      );

      // 创建当前页的图片
      if (pageNum === 0 && imgHeight <= usableHeight) {
        // 内容不超过一页，直接添加
        pdf.addImage(imgData, "PNG", marginLeft, marginTop, imgWidth, imgHeight);
      } else {
        // 需要分页，裁剪图片
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          const pageImgData = pageCanvas.toDataURL("image/png");
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
          pdf.addImage(pageImgData, "PNG", marginLeft, marginTop, imgWidth, pageImgHeight);
        }
      }

      currentY += usableHeight;
      pageNum++;
    }

    // 下载 PDF
    pdf.save(`入驻申请表-${application.enterpriseName}-${application.applicationNo}.pdf`);
  } finally {
    // 清理 iframe
    document.body.removeChild(iframe);
  }
}

/**
 * 创建合同模板 HTML 内容 - 1:1还原原始PDF样式
 * 支持数据库条款数据或使用默认完整模板
 */
function createContractTemplateHtml(
  template: ContractTemplateData,
  options: PdfExportOptions = {}
): string {
  const { includeAttachments = false, selectedAttachments = [] } = options;
  const clauses = template.clauses || [];
  const hasClauses = clauses.length > 0;

  // 共享的CSS样式
  const sharedStyles = `
    @page {
      size: A4;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: SimSun, 宋体, serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    /* 孤行/寡行控制 */
    p, .paragraph {
      orphans: 3;
      widows: 3;
    }
    /* 封面页 */
    .cover-page {
      width: 210mm;
      min-height: 297mm;
      padding: 40mm 40mm 50mm 40mm;
      background: #fff;
      page-break-after: always;
      break-after: page;
    }
    .cover-title-wrapper {
      text-align: center;
      padding-top: 10mm;
      margin-bottom: 120mm;
    }
    .cover-title {
      font-family: SimHei, 黑体;
      font-size: 26pt;
      font-weight: bold;
      letter-spacing: 6px;
      text-align: center;
      display: inline-block;
    }
    .cover-info {
      width: 100%;
    }
    .cover-row {
      margin-bottom: 20px;
      line-height: 2;
      white-space: nowrap;
    }
    .cover-line {
      text-decoration: underline;
      text-decoration-color: #000;
      white-space: pre;
    }
    
    /* 正文页 */
    .content-page {
      width: 210mm;
      padding: 20mm;
      background: #fff;
    }
    .main-title {
      font-family: SimHei, 黑体;
      font-size: 16pt;
      text-align: center;
      margin-bottom: 30px;
      font-weight: normal;
      page-break-after: avoid;
      break-after: avoid;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 12px;
      font-size: 12pt;
    }
    .section-content {
      text-indent: 2em;
      text-align: justify;
      margin-bottom: 8px;
      font-size: 12pt;
      white-space: pre-wrap;
    }
    .subsection {
      margin-bottom: 15px;
    }
    .subsection-title {
      font-weight: bold;
      margin-bottom: 8px;
      text-indent: 0;
    }
    .subsection-content {
      text-indent: 2em;
      text-align: justify;
      margin-bottom: 5px;
    }
    .paragraph {
      text-indent: 2em;
      text-align: justify;
      margin-bottom: 5px;
    }
    .list-item {
      margin-bottom: 5px;
      text-indent: 2em;
    }
    .highlight {
      font-weight: bold;
    }
    
    /* 表格样式 */
    .simple-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
      table-layout: fixed;
    }
    .simple-table th,
    .simple-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      text-align: left;
      word-wrap: break-word;
    }
    .simple-table th {
      background: #f5f5f5;
      font-weight: bold;
    }
    /* 表格列宽优化 */
    .simple-table th:nth-child(1),
    .simple-table td:nth-child(1) { width: 12%; }
    .simple-table th:nth-child(2),
    .simple-table td:nth-child(2) { width: 22%; }
    .simple-table th:nth-child(3),
    .simple-table td:nth-child(3) { width: 10%; }
    .simple-table th:nth-child(4),
    .simple-table td:nth-child(4) { width: 12%; }
    .simple-table th:nth-child(5),
    .simple-table td:nth-child(5) { width: 12%; }
    .simple-table th:nth-child(6),
    .simple-table td:nth-child(6) { width: 12%; }
    
    /* 防止跨页断开 - 关键样式 */
    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .subsection {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section {
      page-break-inside: auto;
      break-inside: auto;
    }
    .section-title {
      page-break-after: avoid;
      break-after: avoid;
    }
    .subsection-title {
      page-break-after: avoid;
      break-after: avoid;
    }
    .paragraph {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .simple-table {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signature-area {
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-before: always;
    }
    
    /* 签章区域 */
    .signature-area {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-before: always;
    }
    .signature-box {
      width: 280px;
    }
    .signature-title {
      font-weight: bold;
      margin-bottom: 50px;
    }
    .signature-line {
      margin-bottom: 25px;
    }
    
    /* 信息行样式（合同主体等） */
    .info-row {
      margin-bottom: 12px;
      line-height: 2.2;
      white-space: nowrap;
    }
    
    /* 附件列表 */
    .annex-section {
      margin-top: 30px;
    }
    .annex-title {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .annex-item {
      text-indent: 2em;
      margin-bottom: 5px;
    }
    
    /* 页脚 */
    .page-footer {
      text-align: center;
      font-size: 10pt;
      color: #666;
      margin-top: 30px;
    }
  `;

  // 解析条款内容并转换为HTML（包含表格识别）
  const parseClauseContent = (clause: TemplateClause): string => {
    const { title, content } = clause;
    
    // 第一条：合同主体 - 特殊格式（带下划线填空，下划线填满一行）
    if (title.includes('合同主体')) {
      return `
      <div class="subsection">
        <div class="info-row">甲方(服务方):_________________________________</div>
        <div class="info-row">&nbsp;&nbsp;企业名称:_________________________________</div>
        <div class="info-row">&nbsp;&nbsp;统一社会信用代码:_________________________</div>
      </div>
      <div class="subsection">
        <div class="info-row">乙方(入驻方):_________________________________</div>
        <div class="info-row">&nbsp;&nbsp;企业名称:_________________________________</div>
        <div class="info-row">&nbsp;&nbsp;统一社会信用代码:_________________________</div>
      </div>`;
    }
    
    // 第二条：服务内容与标的 - 包含多个表格
    if (title.includes('服务内容与标的')) {
      return `
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">2.1 场地服务</div>
        <div class="paragraph">(一)甲方同意将位于Π立方企服中心内的的场地无偿提供给乙方使用，用途仅限于办公。乙方不得擅自扩大使用范围或改变用途，否则甲方有权终止免费条款并要求赔偿。</div>
        <div class="paragraph">(二)甲方应配合乙方出具工商注册所需的场地证明文件(如房产证复印件、租赁合同等)。合同终止或解除后，乙方须在30自然日内将注册地址从甲方场地迁出，并完成工商变更登记。若乙方逾期未迁出，每逾期一日按50元/日支付违约金；逾期超过90日的，乙方应按1200元/年的标准向甲方支付违约金，直至完成迁出手续为止。若因乙方未迁出导致甲方被行政处罚或第三方索赔的，乙方应全额赔偿甲方损失。</div>
      </div>
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">2.2 基础办公服务</div>
        <div class="paragraph">(一)甲方为乙方免费提供以下基础服务:</div>
        <table class="simple-table">
          <tr>
            <th>服务项目</th>
            <th>水、电、暖</th>
            <th>物业服务</th>
            <th>网络服务</th>
          </tr>
          <tr>
            <td>服务内容</td>
            <td>基础物业</td>
            <td>保洁、保安、公共设施维护</td>
            <td>宽带、Wi-Fi</td>
          </tr>
        </table>
        <div class="paragraph">(二)若乙方租赁或使用甲方名下的独栋办公室，则上述服务不再免费提供，乙方需自行承担相关费用</div>
      </div>
      <div class="subsection no-break">
        <div class="subsection-title" style="text-indent: 0;">2.3 孵化加速管理服务</div>
        <table class="simple-table">
          <tr>
            <th>类别</th>
            <th>乙方选择项目(✔)</th>
            <th>数量</th>
            <th>计价单位</th>
            <th>单价(元)</th>
            <th>押金(元)</th>
          </tr>
          <tr>
            <td>固定工位</td>
            <td>□开放工位</td>
            <td></td>
            <td>个/年</td>
            <td>1200</td>
            <td>1200</td>
          </tr>
          <tr>
            <td>独立办公室</td>
            <td>□无窗 □有窗</td>
            <td></td>
            <td>间/年</td>
            <td>3000/3600</td>
            <td>1200</td>
          </tr>
          <tr>
            <td>独栋办公室</td>
            <td>□独栋</td>
            <td></td>
            <td>栋/年</td>
            <td>3600</td>
            <td>5000</td>
          </tr>
        </table>
        <div class="paragraph" style="margin-top: 10px;">★4、独栋办公室租金按《独栋办公室协议》（附件三）执行</div>
      </div>`;
    }
    
    // 第三条：合同周期与费用 - 包含费用表格
    if (title.includes('合同周期与费用')) {
      return `
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">3.1 服务期限</div>
        <div class="paragraph">起始日: ____年____月____日</div>
        <div class="paragraph">终止日: ____年____月____日 (共计____年)</div>
      </div>
      <div class="subsection no-break">
        <div class="subsection-title" style="text-indent: 0;">3.2 费用结算(人民币)</div>
        <table class="simple-table">
          <tr>
            <th>项目</th>
            <th>金额(元)</th>
            <th>支付时间</th>
          </tr>
          <tr>
            <td>首年服务费</td>
            <td>¥____</td>
            <td>签约后5个工作日内</td>
          </tr>
          <tr>
            <td>押金</td>
            <td>¥____</td>
            <td>同服务费支付</td>
          </tr>
          <tr>
            <td>次年续费</td>
            <td>¥____</td>
            <td>到期前30日</td>
          </tr>
        </table>
        <div class="paragraph">注:押金于合同终止后30日内无息退还(扣除违约赔偿金)</div>
        <div class="paragraph">特别约定: 合同签订后，乙方已支付的服务费用不再返还。</div>
      </div>`;
    }
    
    // 第四条：双方权利义务
    if (title.includes('双方权利义务')) {
      return `
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">4.1 甲方承诺</div>
        <div class="paragraph">(一)保障基础设施:提供千兆网络/24小时安保(标准见附件一)</div>
        <div class="paragraph">(二)维护服务品质:客服响应时效按《入驻告知书》第4章执行</div>
      </div>
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">4.2 乙方义务</div>
        <div class="paragraph">(一)合规使用场地:遵守《空间使用与管理规范》(附件二)</div>
        <div class="paragraph">(二)安全主体责任:签署《安全责任承诺书》(附件四)</div>
        <div class="paragraph">(三)每季度提交经营简报(含营收、雇员情况)</div>
      </div>`;
    }
    
    // 第五条：违约责任 - 包含违约金表格
    if (title.includes('违约责任')) {
      return `
      <div class="subsection no-break">
        <div class="subsection-title" style="text-indent: 0;">5.1 违约金计算</div>
        <table class="simple-table">
          <tr>
            <th>违约情形</th>
            <th>违约金标准</th>
          </tr>
          <tr>
            <td>乙方逾期付款</td>
            <td>应付未付金额×0.05%/日</td>
          </tr>
          <tr>
            <td>乙方擅自转租</td>
            <td>当年服务费总额的30%</td>
          </tr>
          <tr>
            <td>甲方服务中断超72小时</td>
            <td>按中断天数200%退还日服务费</td>
          </tr>
        </table>
      </div>
      <div class="subsection no-break">
        <div class="subsection-title" style="text-indent: 0;">5.2 合同解除条件</div>
        <div class="paragraph">(一)乙方欠费超30日</div>
        <div class="paragraph">(二)乙方从事违法经营经书面警告未整改</div>
        <div class="paragraph">(三)甲方丧失场地运营权(提前90日通知)</div>
      </div>`;
    }
    
    // 第六条：法律适用与争议解决
    if (title.includes('法律适用与争议解决')) {
      return `
      <div class="paragraph">适用法律:《中华人民共和国民法典》《商业房屋租赁管理办法》</div>
      <div class="paragraph">争议解决:提交松原市仲裁委员会仲裁(仲裁费由败诉方承担)</div>`;
    }
    
    // 第七条：其他
    if (title.includes('其他')) {
      return `<div class="paragraph">本合同一式贰份(甲乙双方各执壹份)</div>`;
    }
    
    // 第八条：合同附件
    if (title.includes('合同附件')) {
      return `
      <div class="paragraph">下列附件与本合同具有同等法律效力:</div>
      <div class="paragraph">附件一:《Π立方服务标准清单》</div>
      <div class="paragraph">附件二:《空间使用与管理规范》</div>
      <div class="paragraph">附件三:《独栋办公室补充条款》</div>
      <div class="paragraph">附件四:《安全责任承诺书》</div>`;
    }
    
    // 默认：将换行转换为<br/>
    return `<div class="section-content">${content.replace(/\n/g, '<br/>')}</div>`;
  };

  // 如果有条款数据，动态生成条款内容
  const clausesHtml = hasClauses 
    ? clauses.map(clause => `
      <div class="section">
        <div class="section-title">${clause.title}</div>
        ${parseClauseContent(clause)}
      </div>
    `).join('')
    : '';

  // 根据是否有条款数据决定使用哪种正文内容
  const bodyContent = hasClauses 
    ? clausesHtml  // 使用数据库条款
    : getFullTemplateContent(); // 使用完整的硬编码模板

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${sharedStyles}
  </style>
</head>
<body>
  <!-- 封面 -->
  <div class="cover-page">
    <div class="cover-title-wrapper">
      <div class="cover-title">加速器/孵化器入驻协议</div>
    </div>
    <div class="cover-info">
      <div class="cover-row">&nbsp;&nbsp;入驻企业:_________________________________________________</div>
      <div class="cover-row">&nbsp;&nbsp;合同编号:_________________________________________________</div>
      <div class="cover-row">&nbsp;&nbsp;签订日期:_________________________________________________</div>
    </div>
  </div>
  
  <!-- 正文 -->
  <div class="content-page">
    <div class="main-title">${template.name || 'Π立方企业服务中心企业加速孵化合同'}</div>
    
    ${bodyContent}
    
    <!-- 签章区域 -->
    <div class="signature-area">
      <div class="signature-box">
        <div class="signature-title">甲方签章处</div>
        <div class="signature-line">法定代表人签字:__________</div>
        <div class="signature-line">日期:____年____月____日</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">乙方签章处</div>
        <div class="signature-line">法定代表人签字:__________</div>
        <div class="signature-line">日期:____年____月____日</div>
      </div>
    </div>
    
    <div class="page-footer">第 1 页</div>
  </div>
</body>
</html>
`;
}

/**
 * 获取完整的合同模板内容 - 1:1还原原始PDF
 */
function getFullTemplateContent(): string {
  return `
    <div class="section">
      <div class="section-title">第一条 合同主体</div>
      <div class="subsection">
        <div class="info-row">&nbsp;&nbsp;甲方(服务方):____________________________________________________________________________________</div>
        <div class="info-row">&nbsp;&nbsp;企业名称:________________________________________________________________________________________</div>
        <div class="info-row">&nbsp;&nbsp;统一社会信用代码:________________________________________________________________________________</div>
      </div>
      <div class="subsection">
        <div class="info-row">&nbsp;&nbsp;乙方(入驻方):____________________________________________________________________________________</div>
        <div class="info-row">&nbsp;&nbsp;企业名称:________________________________________________________________________________________</div>
        <div class="info-row">&nbsp;&nbsp;统一社会信用代码:________________________________________________________________________________</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">第二条 服务内容与标的</div>
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">2.1 场地服务</div>
        <div class="paragraph">(一)甲方同意将位于Π立方企服中心内的的场地无偿提供给乙方使用，用途仅限于办公。乙方不得擅自扩大使用范围或改变用途，否则甲方有权终止免费条款并要求赔偿。</div>
        <div class="paragraph">(二)甲方应配合乙方出具工商注册所需的场地证明文件(如房产证复印件、租赁合同等)。合同终止或解除后，乙方须在30自然日内将注册地址从甲方场地迁出，并完成工商变更登记。若乙方逾期未迁出，每逾期一日按50元/日支付违约金；逾期超过90日的，乙方应按1200元/年的标准向甲方支付违约金，直至完成迁出手续为止。若因乙方未迁出导致甲方被行政处罚或第三方索赔的，乙方应全额赔偿甲方损失。</div>
      </div>
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">2.2 基础办公服务</div>
        <div class="paragraph">(一)甲方为乙方免费提供以下基础服务:</div>
        <table class="simple-table">
          <tr>
            <th>服务项目</th>
            <th>水、电、暖</th>
            <th>物业服务</th>
            <th>网络服务</th>
          </tr>
          <tr>
            <td>服务内容</td>
            <td>基础物业</td>
            <td>保洁、保安、公共设施维护</td>
            <td>宽带、Wi-Fi</td>
          </tr>
        </table>
        <div class="paragraph">(二)若乙方租赁或使用甲方名下的独栋办公室，则上述服务不再免费提供，乙方需自行承担相关费用</div>
      </div>
      <div class="subsection no-break">
        <div class="subsection-title" style="text-indent: 0;">2.3 孵化加速管理服务</div>
        <table class="simple-table">
          <tr>
            <th>类别</th>
            <th>乙方选择项目(✔)</th>
            <th>数量</th>
            <th>计价单位</th>
            <th>单价(元)</th>
            <th>押金(元)</th>
          </tr>
          <tr>
            <td>固定工位</td>
            <td>□开放工位</td>
            <td></td>
            <td>个/年</td>
            <td>1200</td>
            <td>1200</td>
          </tr>
          <tr>
            <td>独立办公室</td>
            <td>□无窗 □有窗</td>
            <td></td>
            <td>间/年</td>
            <td>3000/3600</td>
            <td>1200</td>
          </tr>
          <tr>
            <td>独栋办公室</td>
            <td>□独栋</td>
            <td></td>
            <td>栋/年</td>
            <td>3600</td>
            <td>5000</td>
          </tr>
        </table>
        <div class="paragraph" style="margin-top: 10px;">★4、独栋办公室租金按《独栋办公室协议》（附件三）执行</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">第三条 合同周期与费用</div>
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">3.1 服务期限</div>
        <div class="paragraph">起始日: ____年____月____日</div>
        <div class="paragraph">终止日: ____年____月____日 (共计____年)</div>
      </div>
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">3.2 费用结算(人民币)</div>
        <table class="simple-table">
          <tr>
            <th>项目</th>
            <th>金额(元)</th>
            <th>支付时间</th>
          </tr>
          <tr>
            <td>首年服务费</td>
            <td>¥____</td>
            <td>签约后5个工作日内</td>
          </tr>
          <tr>
            <td>押金</td>
            <td>¥____</td>
            <td>同服务费支付</td>
          </tr>
          <tr>
            <td>次年续费</td>
            <td>¥____</td>
            <td>到期前30日</td>
          </tr>
        </table>
        <div class="paragraph">注:押金于合同终止后30日内无息退还(扣除违约赔偿金)</div>
        <div class="paragraph">特别约定: 合同签订后，乙方已支付的服务费用不再返还。</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">第四条 双方权利义务</div>
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">4.1 甲方承诺</div>
        <div class="paragraph">(一)保障基础设施:提供千兆网络/24小时安保(标准见附件一)</div>
        <div class="paragraph">(二)维护服务品质:客服响应时效按《入驻告知书》第4章执行</div>
      </div>
      <div class="subsection">
        <div class="subsection-title" style="text-indent: 0;">4.2 乙方义务</div>
        <div class="paragraph">(一)合规使用场地:遵守《空间使用与管理规范》(附件二)</div>
        <div class="paragraph">(二)安全主体责任:签署《安全责任承诺书》(附件四)</div>
        <div class="paragraph">(三)每季度提交经营简报(含营收、雇员情况)</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">第五条 违约责任</div>
      <div class="subsection no-break">
        <div class="subsection-title" style="text-indent: 0;">5.1 违约金计算</div>
        <table class="simple-table">
          <tr>
            <th>违约情形</th>
            <th>违约金标准</th>
          </tr>
          <tr>
            <td>乙方逾期付款</td>
            <td>应付未付金额×0.05%/日</td>
          </tr>
          <tr>
            <td>乙方擅自转租</td>
            <td>当年服务费总额的30%</td>
          </tr>
          <tr>
            <td>甲方服务中断超72小时</td>
            <td>按中断天数200%退还日服务费</td>
          </tr>
        </table>
      </div>
      <div class="subsection no-break">
        <div class="subsection-title" style="text-indent: 0;">5.2 合同解除条件</div>
        <div class="paragraph">(一)乙方欠费超30日</div>
        <div class="paragraph">(二)乙方从事违法经营经书面警告未整改</div>
        <div class="paragraph">(三)甲方丧失场地运营权(提前90日通知)</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">第六条 法律适用与争议解决</div>
      <div class="paragraph">适用法律:《中华人民共和国民法典》《商业房屋租赁管理办法》</div>
      <div class="paragraph">争议解决:提交松原市仲裁委员会仲裁(仲裁费由败诉方承担)</div>
    </div>
    
    <div class="section">
      <div class="section-title">第七条 其他</div>
      <div class="paragraph">本合同一式贰份(甲乙双方各执壹份)</div>
    </div>
    
    <div class="section">
      <div class="section-title">第八条 合同附件</div>
      <div class="paragraph">下列附件与本合同具有同等法律效力:</div>
      <div class="paragraph">附件一:《Π立方服务标准清单》</div>
      <div class="paragraph">附件二:《空间使用与管理规范》</div>
      <div class="paragraph">附件三:《独栋办公室补充条款》</div>
      <div class="paragraph">附件四:《安全责任承诺书》</div>
    </div>
  `;
}

/**
 * 导出合同模板为 PDF - 智能分页避免内容截断
 */
export async function exportContractTemplateToPdf(
  template: ContractTemplateData,
  options: PdfExportOptions = {}
): Promise<void> {
  const { includeAttachments = false, selectedAttachments = [] } = options;
  const style = template.styleConfig;
  const format = style?.pageSize?.toLowerCase() === 'a5' ? 'a5' 
    : style?.pageSize?.toLowerCase() === 'letter' ? 'letter' 
    : 'a4';
  const orientation = style?.orientation === 'landscape' ? 'l' : 'p';

  // 创建 iframe 来完全隔离样式
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "800px";
  iframe.style.height = "6000px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("无法创建 iframe 文档");
  }

  // 写入 HTML 内容到 iframe
  iframeDoc.open();
  iframeDoc.write(createContractTemplateHtml(template, options));
  iframeDoc.close();

  // 等待内容渲染
  await new Promise(resolve => setTimeout(resolve, 500));

  const container = iframeDoc.body;

  try {
    // 使用 html2canvas 生成整个内容的图片
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 800,
    });

    // 页面尺寸配置
    const pageSizes: Record<string, { width: number; height: number }> = {
      a4: { width: 210, height: 297 },
      a5: { width: 148, height: 210 },
      letter: { width: 215.9, height: 279.4 },
    };
    
    const pageSize = pageSizes[format] || pageSizes.a4;
    const pageWidth = orientation === 'l' ? pageSize.height : pageSize.width;
    const pageHeight = orientation === 'l' ? pageSize.width : pageSize.height;
    
    const marginTop = 15;
    const marginBottom = 15;
    const marginLeft = 15;
    const contentWidth = pageWidth - marginLeft * 2;
    const contentHeight = pageHeight - marginTop - marginBottom;

    // 计算图片尺寸
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: orientation as "portrait" | "landscape",
      unit: "mm",
      format: format,
    });

    const imgData = canvas.toDataURL("image/png");
    
    // 获取所有需要保护的元素位置（仅保护no-break和表格）
    const protectedElements = iframeDoc.querySelectorAll('.no-break, .simple-table');
    const protectedRegions: Array<{start: number; end: number}> = [];
    
    protectedElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const iframeRect = iframe.getBoundingClientRect();
      // 计算元素在canvas上的Y坐标（考虑scale=2）
      const startY = (rect.top - iframeRect.top) * 2;
      const endY = startY + rect.height * 2;
      protectedRegions.push({ start: startY, end: endY });
    });

    // 每页能放的内容高度（像素）
    const pageContentHeightPx = contentHeight * (canvas.width / contentWidth);
    
    // 计算所有分页点
    const breakPoints: number[] = [0];
    let currentY = 0;
    
    while (currentY < canvas.height) {
      let nextBreak = currentY + pageContentHeightPx;
      
      if (nextBreak >= canvas.height) {
        breakPoints.push(canvas.height);
        break;
      }
      
      // 检查这个分页点是否会切断任何保护区域
      for (const region of protectedRegions) {
        if (nextBreak > region.start && nextBreak < region.end) {
          // 将分页点调整到保护区域之前
          const adjustedBreak = region.start - 20;
          // 如果调整后的位置有效（比当前位置前进），使用调整后的位置
          if (adjustedBreak > currentY) {
            nextBreak = adjustedBreak;
          } else {
            // 否则，调整到保护区域之后
            nextBreak = region.end + 20;
          }
          break;
        }
      }
      
      breakPoints.push(Math.min(nextBreak, canvas.height));
      currentY = nextBreak;
    }

    // 根据分页点生成PDF页面
    for (let i = 0; i < breakPoints.length - 1; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const startY = breakPoints[i];
      const endY = breakPoints[i + 1];
      const sourceHeight = endY - startY;

      if (i === 0 && canvas.height <= pageContentHeightPx) {
        // 内容不超过一页，直接添加
        pdf.addImage(imgData, "PNG", marginLeft, marginTop, imgWidth, imgHeight);
      } else {
        // 裁剪图片
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0, startY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          const pageImgData = pageCanvas.toDataURL("image/png");
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
          pdf.addImage(pageImgData, "PNG", marginLeft, marginTop, imgWidth, pageImgHeight);
        }
      }
    }

    // 下载 PDF
    pdf.save(`${template.name || '合同模板'}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
