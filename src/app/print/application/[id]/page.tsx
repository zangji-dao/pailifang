"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface Application {
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

export default function PrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;
  const autoPrint = searchParams.get("auto") === "1";

  useEffect(() => {
    // 获取申请数据
    fetch(`/api/applications/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApplication(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (application && autoPrint) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [application, autoPrint]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">申请不存在</div>
      </div>
    );
  }

  const personnel = Array.isArray(application.personnel) ? application.personnel : [];
  const shareholders = Array.isArray(application.shareholders) ? application.shareholders : [];
  const enterpriseNameBackups = application.enterpriseNameBackups || [];

  return (
    <>
      {/* 打印样式 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            top: 0;
            width: 100%;
            max-width: 800px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* 预览容器 */}
      <div className="min-h-screen bg-gray-100 py-8 flex justify-center">
        <div className="print-area p-10 bg-white w-[800px] shadow-lg">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">企业入驻申请表</h1>
            <div className="text-sm text-gray-500">Π立方企业服务中心</div>
          </div>

        {/* 基本信息 */}
        <div className="mb-6">
          <div className="text-base font-bold border-b-2 border-black pb-1 mb-4">一、基本信息</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">申请编号：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.applicationNo}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">申请日期：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">
                {application.applicationDate
                  ? new Date(application.applicationDate).toLocaleDateString("zh-CN")
                  : "-"}
              </span>
            </div>
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">企业名称：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.enterpriseName}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">申请类型：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">
                {applicationTypeMap[application.applicationType || ""] || "-"}
              </span>
            </div>
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">注册资本：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">
                {application.registeredCapital || "-"} {application.currencyType || "万元"}
              </span>
            </div>
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">纳税人类型：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">
                {taxTypeMap[application.taxType || ""] || "-"}
              </span>
            </div>
          </div>
          {enterpriseNameBackups.length > 0 && (
            <div className="flex mt-2">
              <span className="w-28 flex-shrink-0 font-bold">备选名称：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">{enterpriseNameBackups.join("、")}</span>
            </div>
          )}
        </div>

        {/* 地址信息 */}
        <div className="mb-6">
          <div className="text-base font-bold border-b-2 border-black pb-1 mb-4">二、地址信息</div>
          <div className="flex mb-2">
            <span className="w-28 flex-shrink-0 font-bold">原注册地址：</span>
            <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.originalRegisteredAddress || "-"}</span>
          </div>
          <div className="flex mb-2">
            <span className="w-28 flex-shrink-0 font-bold">通讯地址：</span>
            <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.mailingAddress || "-"}</span>
          </div>
          <div className="flex">
            <span className="w-28 flex-shrink-0 font-bold">经营地址：</span>
            <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.businessAddress || "-"}</span>
          </div>
        </div>

        {/* 人员信息 */}
        <div className="mb-6">
          <div className="text-base font-bold border-b-2 border-black pb-1 mb-4">三、人员信息</div>
          {personnel.length > 0 ? (
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr>
                  <th className="border border-black p-2 text-left bg-gray-100 w-[100px]">姓名</th>
                  <th className="border border-black p-2 text-left bg-gray-100 w-[120px]">职务</th>
                  <th className="border border-black p-2 text-left bg-gray-100 w-[130px]">手机号</th>
                  <th className="border border-black p-2 text-left bg-gray-100">邮箱</th>
                </tr>
              </thead>
              <tbody>
                {personnel.map((p: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-black p-2">{p.name || "-"}</td>
                    <td className="border border-black p-2">
                      {(p.roles || []).map((r: string) => roleMap[r] || r).join("、") || "-"}
                    </td>
                    <td className="border border-black p-2">{p.phone || "-"}</td>
                    <td className="border border-black p-2">{p.email || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">暂无人员信息</p>
          )}
        </div>

        {/* 股东信息 */}
        <div className="mb-6">
          <div className="text-base font-bold border-b-2 border-black pb-1 mb-4">四、股东信息</div>
          {shareholders.length > 0 ? (
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr>
                  <th className="border border-black p-2 text-left bg-gray-100 w-[80px]">类型</th>
                  <th className="border border-black p-2 text-left bg-gray-100 w-[120px]">姓名/名称</th>
                  <th className="border border-black p-2 text-left bg-gray-100 w-[100px]">投资额(万元)</th>
                  <th className="border border-black p-2 text-left bg-gray-100 w-[130px]">手机号</th>
                  <th className="border border-black p-2 text-left bg-gray-100">备注</th>
                </tr>
              </thead>
              <tbody>
                {shareholders.map((s: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-black p-2">{shareholderTypeMap[s.type] || "-"}</td>
                    <td className="border border-black p-2">{s.name || "-"}</td>
                    <td className="border border-black p-2">{s.investment || "-"}</td>
                    <td className="border border-black p-2">{s.phone || "-"}</td>
                    <td className="border border-black p-2">{s.type === "enterprise" ? "企业股东" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">暂无股东信息</p>
          )}
        </div>

        {/* 经营信息 */}
        <div className="mb-6">
          <div className="text-base font-bold border-b-2 border-black pb-1 mb-4">五、经营信息</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">预计年营收：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">
                {application.expectedAnnualRevenue
                  ? `${application.expectedAnnualRevenue} 万元`
                  : "-"}
              </span>
            </div>
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">预计年纳税：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">
                {application.expectedAnnualTax
                  ? `${application.expectedAnnualTax} 万元`
                  : "-"}
              </span>
            </div>
          </div>
          {application.businessScope && (
            <div className="flex mt-2">
              <span className="w-28 flex-shrink-0 font-bold">经营范围：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.businessScope}</span>
            </div>
          )}
        </div>

        {/* 其他信息 */}
        <div className="mb-6">
          <div className="text-base font-bold border-b-2 border-black pb-1 mb-4">六、其他信息</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">园区联系人：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.ewtContactName || "-"}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">园区联系电话：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.ewtContactPhone || "-"}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">中介机构：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.intermediaryDepartment || "-"}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-28 flex-shrink-0 font-bold">中介联系人：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">
                {[application.intermediaryName, application.intermediaryPhone]
                  .filter(Boolean)
                  .join(" / ") || "-"}
              </span>
            </div>
          </div>
          {application.remarks && (
            <div className="flex mt-2">
              <span className="w-28 flex-shrink-0 font-bold">备注：</span>
              <span className="flex-1 border-b border-black min-h-[20px] pl-1">{application.remarks}</span>
            </div>
          )}
        </div>

        {/* 签名区域 */}
        <div className="mt-12 flex justify-between">
          <div className="w-[220px] text-center">
            <div className="border-b border-black h-[80px] mb-2"></div>
            <div className="font-bold mb-4">申请人签字（盖章）</div>
            <div className="text-xs text-gray-500">日期：____年____月____日</div>
          </div>
          <div className="w-[220px] text-center">
            <div className="border-b border-black h-[80px] mb-2"></div>
            <div className="font-bold mb-4">审核人签字</div>
            <div className="text-xs text-gray-500">日期：____年____月____日</div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-10 text-right text-xs text-gray-500">
          <div>申请编号：{application.applicationNo}</div>
          <div>打印时间：{new Date().toLocaleString("zh-CN")}</div>
        </div>
        </div>
      </div>
    </>
  );
}
