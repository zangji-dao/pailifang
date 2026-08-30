import type { SVGProps } from "react";

interface BrandMarkProps extends SVGProps<SVGSVGElement> {
  label?: string;
}

export function BrandMark({ className, label = "Π立方品牌标志", ...props }: BrandMarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={label} {...props}>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#0F172A" stroke="#263248" strokeWidth="1.5" />
      <path d="M32 8 53 20v24L32 56 11 44V20L32 8Z" fill="none" stroke="#D6B46A" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M32 8v8M11 20l7 4M53 20l-7 4M32 56v-8" fill="none" stroke="#F1D38A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18.5 24.5C19.4 20.2 22.7 18 27.4 18h22.1l-1.2 6.5h-6.1l-2.4 17.1c-.5 3.4.2 5 2.2 5 1.9 0 3.4-1 4.7-3l3.4 2.6c-2 4.2-5.2 6.3-9.5 6.3-5.8 0-8.7-3.6-7.8-10l2.6-18h-7.8l-4 27h-7.2l4-27h-1.9Z" fill="#F8FAFC" />
    </svg>
  );
}
