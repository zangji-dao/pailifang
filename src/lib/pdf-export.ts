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
 * 获取附件内容的HTML - 完整还原PDF原文
 */
function getAttachmentContent(attachmentId: string): string {
  const attachments: Record<string, string> = {
    'att-1': `
      <div class="section force-break-before">
        <div class="section-title" style="text-align: center; font-size: 16pt;">附件一：Π立方企业服务中心服务标准清单</div>
        <div class="subsection">
          <div class="subsection-title">一、基础环境服务标准</div>
          <table class="simple-table">
            <tr><th>服务类别</th><th>具体标准</th><th>检测方式</th><th>未达标的补偿措施</th></tr>
            <tr><td>电力供应</td><td>≥99.9%可用率（月度）</td><td>电表云端记录</td><td>按中断时长200%退还日费</td></tr>
            <tr><td>网络服务</td><td>共享千兆光纤</td><td>第三方测速软件验证</td><td>超24小时未修复免当月网费</td></tr>
          </table>
        </div>
        <div class="subsection">
          <div class="subsection-title">二、运营服务标准</div>
          <table class="simple-table">
            <tr><th>服务项目</th><th>服务承诺</th><th>响应时效</th></tr>
            <tr><td>日常保洁</td><td>公共区域每日1次清洁</td><td>8:00-17:00</td></tr>
            <tr><td>安保监控</td><td>24小时电子巡更</td><td>巡更记录实时可查</td></tr>
            <tr><td>维修响应</td><td>灯具/门锁等基础维修</td><td>接单后2小时内完成</td></tr>
            <tr><td>客服咨询</td><td>业务咨询/投诉受理</td><td>电话15秒接听</td></tr>
          </table>
        </div>
        <div class="subsection">
          <div class="subsection-title">三、免费服务范围</div>
          <div class="paragraph">已包含在基础服务费中的项目（独栋办公室除外）</div>
          <table class="simple-table">
            <tr><th>类别</th><th>服务内容</th><th>限制条件</th></tr>
            <tr><td>空间配套</td><td>- 基础办公家具（1桌1椅/工位）</td><td>独栋与独立办公室不包含</td></tr>
            <tr><td>会议资源</td><td>- 共享会议室</td><td>须提前预约</td></tr>
          </table>
        </div>
        <div class="subsection">
          <div class="subsection-title">四、服务监督机制</div>
          <div class="paragraph">服务内容由园区管委会监督。</div>
          <div class="paragraph">联系电话：__________</div>
        </div>
      </div>
    `,
    'att-2': `
      <div class="section force-break-before">
        <div class="section-title" style="text-align: center; font-size: 16pt;">附件二：Π立方企业服务中心空间使用与管理规范</div>
        <div class="paragraph" style="text-align: center;">（2025年执行版）</div>
        <div class="subsection">
          <div class="subsection-title">第一章 总则</div>
          <div class="paragraph">第一条 适用范围</div>
          <div class="paragraph">本规范适用于所有入驻Π立方企业服务中心（下称"企服中心"）的企业及人员（含访客）。</div>
          <div class="paragraph">第二条 核心原则</div>
          <div class="paragraph">安全第一：严守消防、电力、网络安全红线</div>
          <div class="paragraph">资源节约：水电网络等公共资源按需使用</div>
          <div class="paragraph">秩序共建：维护安静、整洁、高效的办公环境</div>
        </div>
        <div class="subsection">
          <div class="subsection-title">第二章 企业入驻与退出流程</div>
          <div class="paragraph">第一节 企业入驻全流程标准化指南</div>
          <div class="paragraph">第三条 入驻流程</div>
          <div class="paragraph">第一步：签署入驻企服中心申请表</div>
          <div class="paragraph">材料清单：《入驻申请表》（法定代表人/个人签字并加盖公章）</div>
          <div class="paragraph">审核要点：产业匹配度、资质合规性，评估企业行业属性是否符合定位，外资企业需额外提交商务局核准文件</div>
          <div class="paragraph">时效：初审通常需1-2个工作日。</div>
          <div class="paragraph">第二步：预缴管理服务费</div>
          <table class="simple-table">
            <tr><th>类别</th><th>乙方选择项目（✔）</th><th>数量</th><th>计价单位</th><th>单价（元）</th><th>押金（元）</th></tr>
            <tr><td>固定工位</td><td>□开放工位</td><td></td><td>个/年</td><td>1200</td><td>1200</td></tr>
            <tr><td>独立办公室</td><td>□无窗 □有窗</td><td></td><td>间/年</td><td>3000/3600</td><td>1200</td></tr>
            <tr><td>独栋办公室</td><td>□独栋</td><td></td><td>栋/年</td><td>3600</td><td>5000</td></tr>
          </table>
          <div class="paragraph">支付节点：审核通过后3个工作日内完成缴费，否则视为放弃资格。</div>
          <div class="paragraph">第三步：获取地址证明</div>
          <div class="paragraph">用途：用于工商注册地址变更或新设登记。</div>
          <div class="paragraph">操作规范：企服中心运营部门出具《场地使用证明》（加盖公章）</div>
          <div class="paragraph">第四步：完成工商注册</div>
          <div class="paragraph">需准备材料：名称核准通知书、公司章程、场地使用证明</div>
          <div class="paragraph">第五步：签署入驻合同</div>
          <div class="paragraph">合同类型：企业管理服务合同：加速服务/孵化服务</div>
          <div class="paragraph">第六步：交接水电暖（独栋企业专属）</div>
          <div class="paragraph">操作步骤：（一）企服中心提供《设施交接清单》（记录水电表初始值、设备状态）；（二）双方签字确认后移交钥匙；</div>
          <div class="paragraph">第七步：企服中心商务对接</div>
          <div class="paragraph">（一）信息备案：1）登记企业联络员（姓名、职务、联系方式）；2）上传企业基本信息至企服中心信息管理系统（如统一社会信用代码、经营范围）。</div>
          <div class="paragraph">（二）数字化接入：加入企服中心企业微信/商务群（接收政策通知、活动邀请、预约会议室）</div>
          <div class="paragraph">第八步：正式入驻</div>
          <div class="paragraph">开业备案：向企服中心提交《开业备案表》及员工花名册。</div>
        </div>
        <div class="subsection">
          <div class="paragraph">第二节 企业退出企服中心的标准化流程</div>
          <div class="paragraph">第四条：退出流程</div>
          <div class="paragraph">第一步：退出申请与受理阶段</div>
          <div class="paragraph">（一）向企服中心提交《退出申请书》（需法定代表人签字并加盖公章），说明退出原因（如经营调整、合约到期等）。附企业营业执照复印件、租赁合同终止协议等证明材料。</div>
          <div class="paragraph">（二）企服中心审核：企服中心会在3个工作日内完成初审，确认退出类型（主动退出/强制清退）并书面通知企业后续流程。</div>
          <div class="paragraph">（三）退出类型判定:</div>
          <table class="simple-table">
            <tr><th>类型</th><th>内容</th></tr>
            <tr><td>主动退出</td><td>合约到期或企业战略调整，需提前30日申请。</td></tr>
            <tr><td>强制清退</td><td>因环保不达标、重大安全隐患或长期欠费，企服中心出具《清退通知书》并限期整改（整改期≤15日）。</td></tr>
          </table>
          <div class="paragraph">第二步：费用清算与资产处置</div>
          <div class="paragraph">（一）费用结清证明开具</div>
          <div class="paragraph">1）企服中心责任：核算企业应付费用，生成《费用结清清单》并盖章确认</div>
          <table class="simple-table">
            <tr><th>费用项目</th><th>结算方式</th></tr>
            <tr><td>水电暖费</td><td>按分户表读数结算（独栋企业需现场抄表）</td></tr>
            <tr><td>罚金</td><td>合同违约金、环保/安全处罚金（需附处罚文书）</td></tr>
            <tr><td>管理服务费</td><td>截至退出日的物业费、公共维护费等</td></tr>
            <tr><td>办公物品赔偿</td><td>损坏或未归还的资产（如桌椅、门禁设备）按采购价折算</td></tr>
          </table>
          <div class="paragraph">2）企业责任：在5个工作日内结清所有费用，逾期按每日0.5%计滞纳金。</div>
          <div class="paragraph">资产交接与处置：双方签署《资产交接确认单》</div>
          <div class="paragraph">《资产交接确认单》：企业留存资产（可搬离设备）、企服中心回收资产（如定制货架、固定装修）、废弃物品处理方案（需符合环保规定）</div>
          <div class="paragraph">第三步、权限注销与行政变更</div>
          <table class="simple-table">
            <tr><th>项目</th><th>内容</th></tr>
            <tr><td>门禁权限注销</td><td>企业提交《门禁权限注销申请表》至企服中心办公室；管理员在系统内注销权限卡（需同步删除人脸识别信息）；实体门禁卡回收或远程失效处理（丢失卡需挂失备案）。</td></tr>
            <tr><td>工商登记变更/注销</td><td>地址变更：企业需在30日内完成工商地址变更登记，企服中心配合提供《场地使用终止证明》。公司注销：简易注销（无债务）通过"企业注销一网通办"平台办理，15日内办结；普通注销（有债务）需公告45日并完成清算审计。</td></tr>
          </table>
          <div class="paragraph">第四步：押金退还与正式退出</div>
          <div class="paragraph">条件审核：确认无未结费用、资产无缺损、无未决纠纷；</div>
          <div class="paragraph">退还操作：企服中心在10个工作日内原路退回押金至企业账户（需提供付款凭证）；押金抵扣欠费的，需出具《押金抵扣说明》并双方签字确认。</div>
          <div class="paragraph">正式退出确认：1）签署《企服中心退出确认书》，注明退出日期及双方责任终止；2）企服中心移除企业名录，公告退出信息（如官网、企业群）。</div>
        </div>
        <div class="subsection">
          <div class="subsection-title">第三章 空间使用规则</div>
          <div class="paragraph">第一节 基础区域</div>
          <div class="paragraph">第五条 工位与办公室</div>
          <table class="simple-table">
            <tr><th>条款</th><th>要求</th></tr>
            <tr><td>私密性</td><td>独立办公室玻璃墙禁止贴膜/遮挡（安保需要）</td></tr>
            <tr><td>改造限制</td><td>严禁改动电路/网络端口，如需增容需书面申请</td></tr>
            <tr><td>物品存放</td><td>过夜物品不得阻塞消防通道，贵重物品自行保管</td></tr>
            <tr><td>场地使用</td><td>严禁将办公室用于麻将、娱乐等非工作相关场地使用</td></tr>
            <tr><td>场地使用</td><td>严禁将办公室或者工位转租给第三方使用</td></tr>
          </table>
          <div class="paragraph">第六条 公共区域</div>
          <table class="simple-table">
            <tr><th>区域</th><th>使用规则</th></tr>
            <tr><td>会议室</td><td>- 须与客服预约（最长提前7天）- 超时未使用自动释放，迟到超15分钟取消资格</td></tr>
            <tr><td>茶水间</td><td>- 食物残渣当日清理 - 私人食品不可过夜存放</td></tr>
            <tr><td>吸烟区</td><td>- 仅限指定区域，违规者首次警告，二次罚款200元</td></tr>
          </table>
        </div>
      </div>
    `,
    'att-3': `
      <div class="section force-break-before">
        <div class="section-title" style="text-align: center; font-size: 16pt;">附件四：独栋办公室补充条款</div>
        <div style="margin: 20px 0; line-height: 2.5;">
          <div style="white-space: nowrap;">甲方（服务方）：<span style="display: inline-block; width: 500px; border-bottom: 1px solid #000;">&nbsp;</span></div>
          <div style="white-space: nowrap;">企业名称：<span style="display: inline-block; width: 530px; border-bottom: 1px solid #000;">&nbsp;</span></div>
          <div style="white-space: nowrap;">统一社会信用代码：<span style="display: inline-block; width: 470px; border-bottom: 1px solid #000;">&nbsp;</span></div>
        </div>
        <div style="margin: 20px 0; line-height: 2.5;">
          <div style="white-space: nowrap;">乙方（入驻方）：<span style="display: inline-block; width: 500px; border-bottom: 1px solid #000;">&nbsp;</span></div>
          <div style="white-space: nowrap;">企业名称：<span style="display: inline-block; width: 530px; border-bottom: 1px solid #000;">&nbsp;</span></div>
          <div style="white-space: nowrap;">统一社会信用代码：<span style="display: inline-block; width: 470px; border-bottom: 1px solid #000;">&nbsp;</span></div>
        </div>
        <div style="height: 200px;"></div>
        <div class="subsection">
          <div class="subsection-title">一、基础服务条款</div>
          <div class="paragraph">第一条 服务范围</div>
          <div class="paragraph">甲方为乙方提供独栋办公场地及配套服务，包括：</div>
          <div class="paragraph">1）公共区域维护、安防监控及垃圾清运服务</div>
          <div class="paragraph">2）场地基础设施（水、电、网络）接入支持</div>
          <div class="paragraph">3）企业政策咨询与基础行政支持</div>
          <div class="paragraph">第二条 场地使用规范</div>
          <div class="paragraph">1）乙方不得擅自进行外立面改造，未经批准施工需支付¥20,000元恢复押金</div>
          <div class="paragraph">2）严禁转租/分租场地，违约将触发合同解除+押金没收+追偿30%年服务费</div>
          <div class="paragraph">第三条 能源管理</div>
          <div class="paragraph">水、电、网络费用由乙方直接向供应方缴纳，计量表号需于入驻时备案登记</div>
        </div>
        <div class="subsection">
          <div class="subsection-title">三、财务条款</div>
          <div class="paragraph">第四条 费用体系</div>
          <div class="paragraph">1) 基础管理费：¥3,600/年（固定必缴，达标可退）</div>
          <div class="paragraph">2) 保洁费：¥7,200/年（可选）需书面确认启用，每日专属区域保洁</div>
          <div class="paragraph">3) 对赌管理费（仅税收未达标时触发）：乙方承诺年度全口径税收≥¥500万元（以税务完税凭证为准），若未完成按照下表标准缴纳对赌管理费：</div>
        </div>
        <div class="subsection">
          <div class="paragraph" style="text-align: center; font-weight: bold;">税收完成额补偿金计算规则表</div>
          <table class="simple-table">
            <tr><th>税收完成额（T）</th><th>对赌管理费计算方式</th></tr>
            <tr><td>T≥800万元</td><td>退基础管理费3600元/年</td></tr>
            <tr><td>T≥500万元</td><td>0</td></tr>
            <tr><td>400万≤T<500万元</td><td>(500万-T)×1.5%</td></tr>
            <tr><td>300万≤T<400万元</td><td>(500万-T)×2%</td></tr>
            <tr><td>T<300万元</td><td>¥50,000元（固定）</td></tr>
          </table>
          <div class="paragraph">执行流程：</div>
          <div class="paragraph">1）次年3月31日前提交审计报告</div>
          <div class="paragraph">2）补偿金于报告确认后15日内支付</div>
          <div class="paragraph">3）欠缴按日加收0.05%滞纳金</div>
        </div>
        <div class="subsection">
          <div class="subsection-title">第七条 押金管理</div>
          <div class="paragraph">1）金额：签约时缴纳¥5,000元押金</div>
          <div class="paragraph">2）退还：合同终止后30个工作日内无息退还</div>
          <div class="paragraph">3）扣除项：场地修复费、欠缴费用（需乙方签署退场确认单）</div>
        </div>
        <div class="subsection">
          <div class="subsection-title">四、附则</div>
          <div class="paragraph">第五条 协议效力</div>
          <div class="paragraph">1）本协议与主合同冲突时，以本协议为准</div>
          <div class="paragraph">2）未约定事项按《Π立方企业服务中心空间使用与管理规范》（附件二）执行</div>
        </div>
        <div class="signature-area" style="margin-top: 30px;">
          <div class="signature-box">
            <div class="signature-title">甲方签章：__________</div>
            <div class="signature-line">签约日期：____年____月____日</div>
          </div>
          <div class="signature-box">
            <div class="signature-title">乙方签章：__________</div>
            <div class="signature-line">签约日期：____年____月____日</div>
          </div>
        </div>
      </div>
    `,
    'att-4': `
      <div class="section force-break-before">
        <div class="section-title" style="text-align: center; font-size: 16pt;">附件五：Π立方企业服务中心安全责任承诺书</div>
        <div class="subsection">
          <div class="subsection-title">一、乙方承诺事项</div>
          <div class="paragraph">（一）主体责任承担</div>
          <div class="paragraph">对乙方所有人员（含正式员工、实习生、访客）在企服中心内的安全行为负全责。若发生安全事故，立即启动应急预案并10分钟内通报甲方安保部（电话：__________）。</div>
          <div class="paragraph">（二）安全规范执行</div>
          <table class="simple-table">
            <tr><th>类别</th><th>具体承诺内容</th></tr>
            <tr><td>消防安全</td><td>- 严禁遮挡消防设施/通道<br/>- 每月自查电气线路（留存记录备查）<br/>- 大功率设备（＞500W）报备使用</td></tr>
            <tr><td>网络安全</td><td>- 不私接网络设备<br/>- 不进行黑客攻击/挖矿/传播病毒<br/>- 涉密数据存储符合《网络安全法》</td></tr>
            <tr><td>操作安全</td><td>- 危化品零存放（实验样品需单独申报）</td></tr>
          </table>
          <div class="paragraph">（三）人员安全管理</div>
          <div class="paragraph">✓ 新员工入职24小时内完成甲方《安全培训视频》学习并签署回执。</div>
          <div class="paragraph">✓ 访客进入前告知甲方《空间管理规范》重点条款（附签字确认单）。</div>
        </div>
        <div class="subsection">
          <div class="subsection-title">二、事故处理机制</div>
          <div class="paragraph">（一）责任认定原则</div>
          <table class="simple-table">
            <tr><th>情形</th><th>责任主体</th></tr>
            <tr><td>因乙方设备/操作导致事故</td><td>乙方承担全部赔偿及法律责任</td></tr>
            <tr><td>甲方公共设施缺陷导致事故</td><td>甲方按实际损失赔偿（最高≤乙方当年支付服务费总额）</td></tr>
            <tr><td>第三方原因导致事故</td><td>由直接责任方承担，甲乙双方配合追责</td></tr>
          </table>
          <div class="paragraph">（二）赔偿标准</div>
          <div class="paragraph">✓ 造成甲方财产损失：按修复成本+20%服务中断补偿金赔付</div>
          <div class="paragraph">✓ 造成人员伤亡：由责任方依法承担医疗/抚恤费用</div>
        </div>
        <div class="subsection">
          <div class="subsection-title">三、承诺效力</div>
          <div class="paragraph">本承诺书作为《场地租赁与服务合同》附件，具有同等法律效力。违约方需承担守约方维权产生的律师费、鉴定费、差旅费。</div>
        </div>
        <div style="margin-top: 50px;">
          <div class="paragraph">企业法定代表人（或授权代表）：__________</div>
          <div class="paragraph">签字日期：______年______月______日</div>
        </div>
      </div>
    `
  };
  
  return attachments[attachmentId] || '';
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
      width: 180mm;
      height: 257mm;
      padding: 20mm;
      background: #fff;
      position: relative;
      box-sizing: border-box;
    }
    .cover-title-wrapper {
      text-align: center;
      padding-top: 40mm;
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
      width: calc(100% - 40mm);
      position: absolute;
      bottom: 30mm;
      left: 20mm;
    }
    .cover-row {
      display: flex;
      margin-bottom: 20px;
      line-height: 2;
    }
    .cover-label {
      flex-shrink: 0;
    }
    .cover-underline {
      flex: 1;
      border-bottom: 1px solid #000;
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
    .subsection.avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .force-break-before {
      page-break-before: always;
      break-before: page;
    }
    .subsection-title {
      font-weight: bold;
      margin-bottom: 8px;
      text-indent: 0;
      page-break-after: avoid;
      break-after: avoid;
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
    
    /* 防止跨页断开 - 只保护表格和no-break */
    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .simple-table {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signature-area {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
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
    
    /* 附件列表样式 */
    .attachment-section {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid #000;
    }
    .attachment-list {
      margin-top: 20px;
    }
    .attachment-item {
      margin-bottom: 15px;
      text-indent: 2em;
      line-height: 2;
    }
    
    /* 信息行样式（合同主体等） */
    .info-row {
      display: flex;
      margin-bottom: 12px;
      line-height: 2.2;
    }
    .info-label {
      flex-shrink: 0;
    }
    .info-underline {
      flex: 1;
      border-bottom: 1px solid #000;
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
  `;

  // 解析条款内容并转换为HTML（包含表格识别）
  const parseClauseContent = (clause: TemplateClause): string => {
    const { title, content } = clause;
    
    // 第一条：合同主体 - 特殊格式（带下划线填空，下划线填满一行）
    if (title.includes('合同主体')) {
      return `
      <div class="subsection">
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;甲方(服务方):</span><span class="info-underline"></span></div>
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;企业名称:</span><span class="info-underline"></span></div>
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;统一社会信用代码:</span><span class="info-underline"></span></div>
      </div>
      <div class="subsection">
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;乙方(入驻方):</span><span class="info-underline"></span></div>
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;企业名称:</span><span class="info-underline"></span></div>
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;统一社会信用代码:</span><span class="info-underline"></span></div>
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
      <div class="subsection avoid-break">
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
      <div class="subsection no-break force-break-before">
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
      <div class="cover-row"><span class="cover-label">&nbsp;&nbsp;入驻企业:</span><span class="cover-underline"></span></div>
      <div class="cover-row"><span class="cover-label">&nbsp;&nbsp;合同编号:</span><span class="cover-underline"></span></div>
      <div class="cover-row"><span class="cover-label">&nbsp;&nbsp;签订日期:</span><span class="cover-underline"></span></div>
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
    
    <!-- 附件内容 -->
    ${includeAttachments && selectedAttachments.length > 0 ? 
      selectedAttachments
        .sort((a, b) => {
          const attA = template.attachments?.find(t => t.id === a);
          const attB = template.attachments?.find(t => t.id === b);
          return (attA?.order || 0) - (attB?.order || 0);
        })
        .map(id => getAttachmentContent(id))
        .join('') 
      : ''}
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
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;甲方(服务方):</span><span class="info-underline"></span></div>
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;企业名称:</span><span class="info-underline"></span></div>
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;统一社会信用代码:</span><span class="info-underline"></span></div>
      </div>
      <div class="subsection">
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;乙方(入驻方):</span><span class="info-underline"></span></div>
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;企业名称:</span><span class="info-underline"></span></div>
        <div class="info-row"><span class="info-label">&nbsp;&nbsp;统一社会信用代码:</span><span class="info-underline"></span></div>
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
      <div class="subsection avoid-break">
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
  iframe.style.width = "794px"; // 210mm ≈ 794px at 96dpi
  iframe.style.height = "3000px";
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
    // 获取封面元素，用于确定分页点
    const coverElement = iframeDoc.querySelector('.cover-page') as HTMLElement;
    const coverHeight = coverElement ? coverElement.offsetHeight * 2 : 0; // scale=2
    
    // 在html2canvas之前获取avoid-break元素的位置
    const avoidBreakElements = iframeDoc.querySelectorAll('.avoid-break');
    const containerRect = container.getBoundingClientRect();
    const avoidBreakRanges: { start: number; end: number }[] = [];
    
    avoidBreakElements.forEach((el) => {
      const element = el as HTMLElement;
      const rect = element.getBoundingClientRect();
      // 计算元素在canvas中的位置（考虑scale=2）
      const startY = (rect.top - containerRect.top) * 2;
      const endY = (rect.bottom - containerRect.top) * 2;
      console.log('Avoid-break element:', startY, '-', endY, 'Height:', endY - startY);
      avoidBreakRanges.push({ start: startY, end: endY });
    });
    
    // 获取强制分页元素的位置
    const forceBreakElements = iframeDoc.querySelectorAll('.force-break-before');
    const forceBreakPoints: number[] = [];
    
    forceBreakElements.forEach((el) => {
      const element = el as HTMLElement;
      const rect = element.getBoundingClientRect();
      // 计算元素在canvas中的位置（考虑scale=2）
      const startY = (rect.top - containerRect.top) * 2;
      console.log('Force-break element at:', startY);
      forceBreakPoints.push(startY);
    });
    
    // 使用 html2canvas 生成整个内容的图片
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
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
    
    // 每页能放的内容高度（像素）
    const pageContentHeightPx = contentHeight * (canvas.width / contentWidth);
    
    console.log('Canvas height:', canvas.height, 'Page content height:', pageContentHeightPx);
    console.log('Avoid break ranges:', avoidBreakRanges);
    
    // 计算分页点：第一页是封面，后续按固定高度分页（但避开avoid-break元素）
    const breakPoints: number[] = [0];
    
    // 如果有封面，第一页为封面高度
    if (coverHeight > 0 && coverHeight < pageContentHeightPx * 1.5) {
      breakPoints.push(coverHeight);
      console.log('Cover height break point:', coverHeight);
    }
    
    // 后续页面按固定高度分页，但调整分页点以避免截断avoid-break元素，并在强制分页点处分页
    let currentY = breakPoints[breakPoints.length - 1];
    while (currentY < canvas.height) {
      let nextBreak = currentY + pageContentHeightPx;
      if (nextBreak >= canvas.height) {
        breakPoints.push(canvas.height);
        break;
      }
      
      // 检查当前页面范围内是否有强制分页点
      for (const forcePoint of forceBreakPoints) {
        if (forcePoint > currentY && forcePoint < nextBreak) {
          console.log('Force break at:', forcePoint);
          nextBreak = forcePoint;
          break;
        }
      }
      
      // 检查当前页面范围内是否有avoid-break元素会被截断
      for (const range of avoidBreakRanges) {
        // 元素开始于当前页，但结束于当前页之后 -> 会被截断
        if (range.start >= currentY && range.start < nextBreak && range.end > nextBreak) {
          console.log('Element will be truncated at:', nextBreak, 'Element range:', range.start, '-', range.end);
          // 在元素开始处分页，把整个元素推到下一页
          nextBreak = range.start;
          console.log('Adjusted break point to:', nextBreak);
          break;
        }
      }
      
      // 确保不会倒退（至少前进1像素）
      if (nextBreak <= currentY) {
        nextBreak = currentY + 100; // 最小前进距离
      }
      
      breakPoints.push(nextBreak);
      console.log('Added break point:', nextBreak);
      currentY = nextBreak;
    }
    
    console.log('All break points:', breakPoints);
    
    // 根据分页点生成PDF页面
    for (let i = 0; i < breakPoints.length - 1; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const startY = breakPoints[i];
      const endY = breakPoints[i + 1];
      const sourceHeight = endY - startY;

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

    // 下载 PDF
    pdf.save(`${template.name || '合同模板'}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
