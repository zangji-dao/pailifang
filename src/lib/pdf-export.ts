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

export interface ContractTemplateData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  styleConfig: TemplateStyleConfig;
  clauses: TemplateClause[];
  isDefault: boolean;
  isActive: boolean;
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
 * 创建合同模板 HTML 内容
 */
function createContractTemplateHtml(template: ContractTemplateData): string {
  const style = template.styleConfig;
  const clauses = template.clauses || [];

  return `
    <div style="
      font-family: ${style?.font?.family || 'SimSun, 宋体, serif'};
      font-size: ${style?.font?.size || 12}pt;
      line-height: ${style?.font?.lineHeight || 1.8};
      color: ${style?.colors?.text || '#333333'};
      background: #ffffff;
      padding: ${style?.margins?.top || 25}mm ${style?.margins?.right || 20}mm ${style?.margins?.bottom || 25}mm ${style?.margins?.left || 20}mm;
      width: ${style?.orientation === 'landscape' ? '297mm' : '210mm'};
      min-height: ${style?.orientation === 'landscape' ? '210mm' : '297mm'};
    ">
      <!-- 页眉 -->
      ${style?.layout?.showLogo ? `
        <div style="
          height: ${style.layout.headerHeight || 60}px;
          text-align: ${style.layout.logoPosition || 'center'};
          background-color: ${style.colors?.headerBg || '#f5f5f5'};
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: #999999;">[Logo 占位]</span>
        </div>
      ` : ''}

      <!-- 标题 -->
      <h1 style="
        text-align: center;
        margin-bottom: 32px;
        font-family: ${style?.titleFont?.family || 'SimHei, 黑体'};
        font-size: ${style?.titleFont?.size || 18}pt;
        font-weight: ${style?.titleFont?.weight || 'bold'};
        color: ${style?.colors?.primary || '#1a1a1a'};
      ">${template.name || '合同模板'}</h1>

      <!-- 条款内容 -->
      <div style="space-y: 16px;">
        ${clauses.map((clause, index) => `
          <div style="
            margin-bottom: ${style?.clauseStyle?.spacing || 12}px;
            padding-left: ${style?.clauseStyle?.indent || 24}px;
          ">
            <h3 style="
              font-weight: bold;
              margin-bottom: 8px;
              color: ${style?.colors?.primary || '#1a1a1a'};
            ">${index + 1}. ${clause.title}</h3>
            <p style="white-space: pre-line; margin: 0;">${clause.content}</p>
          </div>
        `).join('')}
      </div>

      <!-- 页脚 -->
      ${style?.layout?.showPageNumber ? `
        <div style="
          margin-top: 32px;
          height: ${style.layout.footerHeight || 40}px;
          text-align: ${style.layout.pageNumberPosition || 'center'};
          border-top: 1px solid #e5e5e5;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: #666666; font-size: 10pt;">第 1 页</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 导出合同模板为 PDF
 */
export async function exportContractTemplateToPdf(template: ContractTemplateData): Promise<void> {
  const style = template.styleConfig;
  const orientation = style?.orientation === 'landscape' ? 'l' : 'p';
  const format = style?.pageSize?.toLowerCase() === 'a5' ? 'a5' 
    : style?.pageSize?.toLowerCase() === 'letter' ? 'letter' 
    : 'a4';

  // 创建 iframe 来完全隔离样式
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = style?.orientation === 'landscape' ? "1100px" : "800px";
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
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      ${createContractTemplateHtml(template)}
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
      backgroundColor: "#ffffff",
    });

    // 根据纸张大小设置尺寸
    const pageSizes: Record<string, { width: number; height: number }> = {
      a4: { width: 210, height: 297 },
      a5: { width: 148, height: 210 },
      letter: { width: 215.9, height: 279.4 },
    };
    
    const pageSize = pageSizes[format] || pageSizes.a4;
    const pageWidth = orientation === 'l' ? pageSize.height : pageSize.width;
    const pageHeight = orientation === 'l' ? pageSize.width : pageSize.height;
    
    const marginTop = style?.margins?.top || 25;
    const marginLeft = style?.margins?.left || 20;
    const contentWidth = pageWidth - marginLeft * 2;
    const contentHeight = pageHeight - marginTop - (style?.margins?.bottom || 25);

    // 计算图片尺寸
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: orientation as "portrait" | "landscape",
      unit: "mm",
      format: format,
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

      const sourceY = (currentY / imgHeight) * canvas.height;
      const sourceHeight = Math.min(
        (usableHeight / imgHeight) * canvas.height,
        canvas.height - sourceY
      );

      if (pageNum === 0 && imgHeight <= usableHeight) {
        pdf.addImage(imgData, "PNG", marginLeft, marginTop, imgWidth, imgHeight);
      } else {
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
    pdf.save(`${template.name || '合同模板'}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
