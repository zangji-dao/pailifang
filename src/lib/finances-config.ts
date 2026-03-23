// 资金类型配置
export const financeTypeConfig = {
  service_fee: { label: "服务费", color: "text-blue-600", bg: "bg-blue-50" },
  deposit: { label: "押金", color: "text-amber-600", bg: "bg-amber-50" },
  utility: { label: "水电费", color: "text-cyan-600", bg: "bg-cyan-50" },
  network: { label: "网络费", color: "text-violet-600", bg: "bg-violet-50" },
  heating: { label: "取暖费", color: "text-orange-600", bg: "bg-orange-50" },
  prepayment: { label: "预存款", color: "text-emerald-600", bg: "bg-emerald-50" },
} as const;

// 押金类型配置
export const depositTypeConfig = {
  rental: { label: "租赁押金", color: "text-amber-600" },
  utility: { label: "水电押金", color: "text-cyan-600" },
  other: { label: "其他押金", color: "text-slate-600" },
} as const;

// 状态配置
export const statusConfig = {
  pending: { label: "待收取", color: "text-slate-600", bg: "bg-slate-100" },
  paid: { label: "已收取", color: "text-emerald-600", bg: "bg-emerald-50" },
  partial_refund: { label: "部分返还", color: "text-orange-600", bg: "bg-orange-50" },
  refunded: { label: "已返还", color: "text-rose-600", bg: "bg-rose-50" },
} as const;

// 支付方式配置
export const paymentMethodConfig = {
  cash: { label: "现金" },
  bank_transfer: { label: "银行转账" },
  wechat: { label: "微信" },
  alipay: { label: "支付宝" },
  other: { label: "其他" },
} as const;
