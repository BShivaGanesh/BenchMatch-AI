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
      "bg-[color:var(--evergreen-green)]/15 text-[color:var(--evergreen-green)]",
    partial:
      "bg-[color:var(--highlight-yellow)]/15 text-[color:var(--highlight-yellow)]",
    notBench: "bg-slate-100 text-slate-600",
  };

  return <span className={clsx(base, map[variant])}>{children}</span>;
};

export default Badge;
