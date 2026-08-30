interface SiteComplianceFooterProps {
  className?: string;
  variant?: "light" | "dark";
}

const ICP_RECORD_NUMBER = "吉ICP备2026003342号-1";
const ICP_RECORD_URL = "https://beian.miit.gov.cn/";
const PUBLIC_SECURITY_RECORD_NUMBER = "吉公网安备22070002000179号";
const PUBLIC_SECURITY_RECORD_URL = "https://beian.mps.gov.cn/#/query/webSearch?code=22070002000179";

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
      <a
        href={PUBLIC_SECURITY_RECORD_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 transition-colors"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3 5.5 5.8v5.4c0 4.3 2.7 7.7 6.5 9.8 3.8-2.1 6.5-5.5 6.5-9.8V5.8L12 3Z" />
          <path d="m9.4 12 1.7 1.7 3.6-3.8" />
        </svg>
        {PUBLIC_SECURITY_RECORD_NUMBER}
      </a>
    </footer>
  );
}
