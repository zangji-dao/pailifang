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

// 职务映射
const roleMap: Record<string, string> = {
  legalPerson: "法定代表人",
  supervisor: "监事",
  finance: "财务负责人",
  contact: "企业联系人",
  agent: "经办人",
};

// 股东类型映射
const shareholderTypeMap: Record<string, string> = {
  natural: "自然人",
  enterprise: "企业",
};

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
      <td style="width: 140px; padding: 6px 0; font-weight: bold; vertical-align: top;">${label}</td>
      <td style="padding: 6px 0; vertical-align: top;">
        <div style="padding-bottom: 4px;">${value || "-"}</div>
        <div style="border-bottom: 1px solid #000; height: 1px;"></div>
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
    <div style="font-family: SimSun, 宋体, serif; font-size: 14px; line-height: 1.8; color: #000; background: #fff; padding: 40px; width: 800px;">
      <!-- 标题 -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0;">企业入驻申请表</h1>
        <div style="font-size: 14px; color: #666;">Π立方企业服务中心</div>
      </div>

      <!-- 基本信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">一、基本信息</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 0;">
              <table style="width: 100%;">
                ${createInfoRow("申请编号：", application.applicationNo)}
                ${createInfoRow("企业名称：", application.enterpriseName)}
                ${createInfoRow("注册资本：", `${application.registeredCapital || "-"} ${application.currencyType || "万元"}`)}
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
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">二、地址信息</div>
        <table style="width: 100%; border-collapse: collapse;">
          ${createInfoRow("原注册地址：", application.originalRegisteredAddress)}
          ${createInfoRow("通讯地址：", application.mailingAddress)}
          ${createInfoRow("经营地址：", application.businessAddress)}
        </table>
      </div>

      <!-- 人员信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">三、人员信息</div>
        ${personnel.length > 0 ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #000; padding: 8px 10px; text-align: left; width: 100px;">姓名</th>
              <th style="border: 1px solid #000; padding: 8px 10px; text-align: left; width: 120px;">职务</th>
              <th style="border: 1px solid #000; padding: 8px 10px; text-align: left; width: 130px;">手机号</th>
              <th style="border: 1px solid #000; padding: 8px 10px; text-align: left;">邮箱</th>
            </tr>
          </thead>
          <tbody>
            ${personnel.map((p: any) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px 10px;">${p.name || "-"}</td>
                <td style="border: 1px solid #000; padding: 8px 10px;">${(p.roles || []).map((r: string) => roleMap[r] || r).join("、") || "-"}</td>
                <td style="border: 1px solid #000; padding: 8px 10px;">${p.phone || "-"}</td>
                <td style="border: 1px solid #000; padding: 8px 10px;">${p.email || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ` : '<p style="color: #999; margin: 0;">暂无人员信息</p>'}
      </div>

      <!-- 股东信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">四、股东信息</div>
        ${shareholders.length > 0 ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #000; padding: 8px 10px; text-align: left; width: 80px;">类型</th>
              <th style="border: 1px solid #000; padding: 8px 10px; text-align: left; width: 120px;">姓名/名称</th>
              <th style="border: 1px solid #000; padding: 8px 10px; text-align: left; width: 100px;">投资额(万元)</th>
              <th style="border: 1px solid #000; padding: 8px 10px; text-align: left; width: 130px;">手机号</th>
              <th style="border: 1px solid #000; padding: 8px 10px; text-align: left;">备注</th>
            </tr>
          </thead>
          <tbody>
            ${shareholders.map((s: any) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px 10px;">${shareholderTypeMap[s.type] || "-"}</td>
                <td style="border: 1px solid #000; padding: 8px 10px;">${s.name || "-"}</td>
                <td style="border: 1px solid #000; padding: 8px 10px;">${s.investment || "-"}</td>
                <td style="border: 1px solid #000; padding: 8px 10px;">${s.phone || "-"}</td>
                <td style="border: 1px solid #000; padding: 8px 10px;">${s.type === "enterprise" ? "企业股东" : ""}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ` : '<p style="color: #999; margin: 0;">暂无股东信息</p>'}
      </div>

      <!-- 经营信息 -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">五、经营信息</div>
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
        <div style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">六、其他信息</div>
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
      <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div style="width: 200px; text-align: center;">
          <div style="border-bottom: 1px solid #000; height: 60px; margin-bottom: 5px;"></div>
          <div style="font-weight: bold;">申请人签字（盖章）</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">日期：____年____月____日</div>
        </div>
        <div style="width: 200px; text-align: center;">
          <div style="border-bottom: 1px solid #000; height: 60px; margin-bottom: 5px;"></div>
          <div style="font-weight: bold;">审核人签字</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">日期：____年____月____日</div>
        </div>
      </div>

      <!-- 页脚 -->
      <div style="margin-top: 40px; text-align: right; font-size: 12px; color: #666;">
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
  // 创建隐藏的容器
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.background = "#fff";
  container.innerHTML = createApplicationHtml(application);
  document.body.appendChild(container);

  try {
    // 使用 html2canvas 生成图片
    const canvas = await html2canvas(container, {
      scale: 2, // 提高清晰度
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      // 处理 oklch 颜色格式不兼容问题
      onclone: (clonedDoc) => {
        const clonedContainer = clonedDoc.body.querySelector('div[style*="position: fixed"]');
        if (clonedContainer) {
          // 递归处理所有元素的颜色
          const elements = clonedContainer.querySelectorAll('*');
          elements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            const style = clonedDoc.defaultView?.getComputedStyle(htmlEl);
            if (style) {
              // 强制使用标准颜色格式
              const color = style.color;
              const bgColor = style.backgroundColor;
              const borderColor = style.borderColor;
              
              // 如果检测到 oklch，替换为黑色/白色
              if (color && color.includes('oklch')) {
                htmlEl.style.color = '#000000';
              }
              if (bgColor && bgColor.includes('oklch')) {
                htmlEl.style.backgroundColor = '#ffffff';
              }
              if (borderColor && borderColor.includes('oklch')) {
                htmlEl.style.borderColor = '#000000';
              }
            }
          });
        }
      },
    });

    // 创建 PDF
    const imgWidth = 210; // A4 宽度 (mm)
    const pageHeight = 297; // A4 高度 (mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // 如果内容超过一页，需要分页
    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL("image/png");

    // 添加第一页
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 如果有多页，继续添加
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 下载 PDF
    pdf.save(`入驻申请表-${application.enterpriseName}-${application.applicationNo}.pdf`);
  } finally {
    // 清理容器
    document.body.removeChild(container);
  }
}
