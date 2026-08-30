interface SiteComplianceFooterProps {
  className?: string;
  variant?: "light" | "dark";
}

const ICP_RECORD_NUMBER = "吉ICP备2026003342号-1";
const ICP_RECORD_URL = "https://beian.miit.gov.cn/";

export function SiteComplianceFooter({
  className = "",
  variant = "light",
}: SiteComplianceFooterProps) {
  const tone = variant === "dark"
    ? "text-white/45 [&_a]:text-amber-200/80 [&_a:hover]:text-amber-100"
    : "text-slate-400 [&_a]:text-slate-500 [&_a:hover]:text-slate-900";

  return (
    <footer
      aria-label="网站备案信息"
      className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] leading-5 sm:text-xs ${tone} ${className}`}
    >
      <span>© 2026 吉林省天之企业管理咨询有限公司</span>
      <span aria-hidden="true">·</span>
      <a
        href={ICP_RECORD_URL}
        target="_blank"
        rel="noreferrer"
        className="transition-colors"
      >
        {ICP_RECORD_NUMBER}
      </a>
      <span aria-hidden="true">·</span>
      <span>互联网信息服务备案</span>
    </footer>
  );
}
