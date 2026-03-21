import { notFound } from "next/navigation";
import { getSupabaseClient } from "@/storage/database/supabase-client";

interface Params {
  params: Promise<{ id: string }>;
}

// 获取申请数据
async function getApplication(id: string) {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from("pi_settlement_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function PrintPage({ params }: Params) {
  const { id } = await params;
  const application = await getApplication(id);

  if (!application) {
    notFound();
  }

  // 解析 JSON 字段（Supabase 返回的是 snake_case，JSON 字段已自动解析）
  const personnel = Array.isArray(application.personnel) ? application.personnel : [];
  const shareholders = Array.isArray(application.shareholders) ? application.shareholders : [];
  const enterpriseNameBackups = application.enterprise_name_backups || [];

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

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <title>入驻申请表 - {application.enterprise_name}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: "SimSun", "宋体", serif;
            font-size: 14px;
            line-height: 1.6;
            color: #000;
            background: #fff;
            padding: 40px;
          }
          
          .page {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .header .subtitle {
            font-size: 14px;
            color: #666;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 5px;
          }
          
          .info-label {
            width: 140px;
            flex-shrink: 0;
            font-weight: bold;
          }
          
          .info-value {
            flex: 1;
            border-bottom: 1px solid #000;
            min-height: 20px;
            padding-left: 5px;
          }
          
          .section {
            margin-bottom: 25px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 30px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          table th, table td {
            border: 1px solid #000;
            padding: 8px 10px;
            text-align: left;
          }
          
          table th {
            background: #f5f5f5;
            font-weight: bold;
          }
          
          .signature-area {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            width: 200px;
            text-align: center;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            height: 60px;
            margin-bottom: 5px;
          }
          
          .footer {
            margin-top: 40px;
            text-align: right;
            font-size: 12px;
            color: #666;
          }
          
          @media print {
            body {
              padding: 20px;
            }
          }
        ` }} />
      </head>
      <body>
        <div className="page">
          {/* 标题 */}
          <div className="header">
            <h1>企业入驻申请表</h1>
            <div className="subtitle">Π立方企业服务中心</div>
          </div>

          {/* 基本信息 */}
          <div className="section">
            <div className="section-title">一、基本信息</div>
            <div className="grid-2">
              <div className="info-row">
                <span className="info-label">申请编号：</span>
                <span className="info-value">{application.application_no}</span>
              </div>
              <div className="info-row">
                <span className="info-label">申请日期：</span>
                <span className="info-value">
                  {application.application_date 
                    ? new Date(application.application_date).toLocaleDateString("zh-CN")
                    : "-"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">企业名称：</span>
                <span className="info-value">{application.enterprise_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">申请类型：</span>
                <span className="info-value">
                  {applicationTypeMap[application.application_type || ""] || "-"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">注册资本：</span>
                <span className="info-value">
                  {application.registered_capital || "-"} {application.currency_type || "万元"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">纳税人类型：</span>
                <span className="info-value">
                  {taxTypeMap[application.tax_type || ""] || "-"}
                </span>
              </div>
            </div>
            {enterpriseNameBackups.length > 0 && (
              <div className="info-row" style={{ marginTop: "10px" }}>
                <span className="info-label">备选名称：</span>
                <span className="info-value">{enterpriseNameBackups.join("、")}</span>
              </div>
            )}
          </div>

          {/* 地址信息 */}
          <div className="section">
            <div className="section-title">二、地址信息</div>
            <div className="info-row" style={{ marginBottom: "10px" }}>
              <span className="info-label">原注册地址：</span>
              <span className="info-value">{application.original_registered_address || "-"}</span>
            </div>
            <div className="info-row" style={{ marginBottom: "10px" }}>
              <span className="info-label">通讯地址：</span>
              <span className="info-value">{application.mailing_address || "-"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">经营地址：</span>
              <span className="info-value">{application.business_address || "-"}</span>
            </div>
          </div>

          {/* 人员信息 */}
          <div className="section">
            <div className="section-title">三、人员信息</div>
            {personnel.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "100px" }}>姓名</th>
                    <th style={{ width: "120px" }}>职务</th>
                    <th style={{ width: "130px" }}>手机号</th>
                    <th>邮箱</th>
                  </tr>
                </thead>
                <tbody>
                  {personnel.map((p: any, index: number) => (
                    <tr key={index}>
                      <td>{p.name || "-"}</td>
                      <td>
                        {(p.roles || []).map((r: string) => roleMap[r] || r).join("、") || "-"}
                      </td>
                      <td>{p.phone || "-"}</td>
                      <td>{p.email || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "#999" }}>暂无人员信息</p>
            )}
          </div>

          {/* 股东信息 */}
          <div className="section">
            <div className="section-title">四、股东信息</div>
            {shareholders.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>类型</th>
                    <th style={{ width: "120px" }}>姓名/名称</th>
                    <th style={{ width: "100px" }}>投资额(万元)</th>
                    <th style={{ width: "130px" }}>手机号</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {shareholders.map((s: any, index: number) => (
                    <tr key={index}>
                      <td>{shareholderTypeMap[s.type] || "-"}</td>
                      <td>{s.name || "-"}</td>
                      <td>{s.investment || "-"}</td>
                      <td>{s.phone || "-"}</td>
                      <td>{s.type === "enterprise" ? "企业股东" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "#999" }}>暂无股东信息</p>
            )}
          </div>

          {/* 经营信息 */}
          <div className="section">
            <div className="section-title">五、经营信息</div>
            <div className="grid-2">
              <div className="info-row">
                <span className="info-label">预计年营收：</span>
                <span className="info-value">
                  {application.expected_annual_revenue 
                    ? `${application.expected_annual_revenue} 万元`
                    : "-"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">预计年纳税：</span>
                <span className="info-value">
                  {application.expected_annual_tax 
                    ? `${application.expected_annual_tax} 万元`
                    : "-"}
                </span>
              </div>
            </div>
            {application.business_scope && (
              <div className="info-row" style={{ marginTop: "10px" }}>
                <span className="info-label">经营范围：</span>
                <span className="info-value">{application.business_scope}</span>
              </div>
            )}
          </div>

          {/* 其他信息 */}
          <div className="section">
            <div className="section-title">六、其他信息</div>
            <div className="grid-2">
              <div className="info-row">
                <span className="info-label">介绍人姓名：</span>
                <span className="info-value">{application.introducer_name || "-"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">介绍人电话：</span>
                <span className="info-value">{application.introducer_phone || "-"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">园区联系人：</span>
                <span className="info-value">{application.ewt_contact_name || "-"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">园区联系电话：</span>
                <span className="info-value">{application.ewt_contact_phone || "-"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">中介机构：</span>
                <span className="info-value">{application.intermediary_department || "-"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">中介联系人：</span>
                <span className="info-value">
                  {[application.intermediary_name, application.intermediary_phone]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </span>
              </div>
            </div>
            {application.remarks && (
              <div className="info-row" style={{ marginTop: "10px" }}>
                <span className="info-label">备注：</span>
                <span className="info-value">{application.remarks}</span>
              </div>
            )}
          </div>

          {/* 签名区域 */}
          <div className="signature-area">
            <div className="signature-box">
              <div className="signature-line"></div>
              <div>申请人签字（盖章）</div>
              <div style={{ fontSize: "12px", color: "#666" }}>日期：____年____月____日</div>
            </div>
            <div className="signature-box">
              <div className="signature-line"></div>
              <div>审核人签字</div>
              <div style={{ fontSize: "12px", color: "#666" }}>日期：____年____月____日</div>
            </div>
          </div>

          {/* 页脚 */}
          <div className="footer">
            <div>申请编号：{application.application_no}</div>
            <div>打印时间：{new Date().toLocaleString("zh-CN")}</div>
          </div>
        </div>

        {/* 自动打印脚本 */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.onload = function() {
            if (window.location.search.includes('auto=1')) {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          };
        ` }} />
      </body>
    </html>
  );
}
