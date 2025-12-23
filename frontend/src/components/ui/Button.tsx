import React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className,
  children,
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[color:var(--evergreen-green)] text-slate-900 hover:bg-emerald-400 focus-visible:ring-[color:var(--evergreen-green)]",
    secondary:
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-300",
    ghost:
      "text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-200",
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
};

export default Button;
