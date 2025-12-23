import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Loader,
} from "lucide-react"; // make sure lucide-react is installed

export interface KpiCardProps {
  title: string;
  value: string | number;
  change: number; // % change vs previous period
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;   // e.g. "text-[#00283c]"
  bgColor: string; // e.g. "bg-blue-50"
  description: string;
  target?: number;
  period: string;
  isLoading?: boolean;
  loaderColor?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  bgColor,
  description,
  target,
  period,
  isLoading = false,
  loaderColor = "text-[color:var(--light-watermark)]",
}) => {
  const isPositive = change >= 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  const numericValue =
    typeof value === "number" ? value : Number(value.toString().replace(/,/g, "")) || 0;
  const progressPercentage = target
    ? Math.min((numericValue / target) * 100, 100)
    : 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:border-slate-200 hover:shadow-xl">
      {/* Background icon pattern */}
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 opacity-5">
        <Icon className="h-full w-full" />
      </div>

      {/* Header */}
      <div className="relative z-10 mb-3 flex items-start justify-between">
        <div className={`rounded-xl ${bgColor} p-2.5 transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="rounded-full bg-slate-100 px-2 py-1">
              <Loader className={`h-3 w-3 animate-spin ${loaderColor}`} />
            </div>
          ) : (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                isPositive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Value + text */}
      <div className="relative z-10 mb-3 space-y-1.5">
        <h3 className="text-2xl font-bold text-[color:var(--ig-blue)] transition-colors group-hover:text-[#003d54]">
          {isLoading ? (
            <span className="text-slate-300">---</span>
          ) : typeof value === "number" ? (
            value.toLocaleString()
          ) : (
            value
          )}
        </h3>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      {/* Progress to target (optional) */}
      {target && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-slate-500">Progress to target</span>
            <span className="text-xs font-medium text-slate-700">
              {isLoading ? "..." : `${progressPercentage.toFixed(1)}%`}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${color.replace(
                "text-",
                "bg-"
              )}`}
              style={{ width: isLoading ? "0%" : `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Period info */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{period}</span>
        <span className={isPositive ? "text-emerald-600" : "text-red-600"}>
          vs previous period
        </span>
      </div>
    </div>
  );
};

export default KpiCard;
