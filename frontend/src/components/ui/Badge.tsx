import React from "react";
import clsx from "clsx";

type BadgeVariant = "bench" | "partial" | "notBench";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

  const map: Record<BadgeVariant, string> = {
  bench:
    "bg-[#00D6F2]/15 text-[#00D6F2]",
  partial:
    "bg-[#FFD700]/15 text-[#FFD700]",
  notBench: 
    "bg-[#DB005A]/15 text-[#DB005A]",
};

  return <span className={clsx(base, map[variant])}>{children}</span>;
};

export default Badge;
