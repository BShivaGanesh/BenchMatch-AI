import React from "react";

interface BenchSizeTrendChartProps {
  data: number[];
  labels?: string[]; // optional day labels, e.g. ["Mon", ...]
}

const BenchSizeTrendChart: React.FC<BenchSizeTrendChartProps> = ({
  data,
  labels,
}) => {
  if (!data || data.length < 2) return null;

  const first = data[0];
  const last = data[data.length - 1];

  const rawChange = ((last - first) / (first || 1)) * 100;
  const isPositive = last < first;
  const changeAbs = Math.abs(rawChange);
  const changeColor = isPositive
    ? "text-[color:var(--evergreen-green)]"
    : "text-[color:var(--alert-red)]";
  const pillBg = isPositive
    ? "bg-[color:var(--evergreen-green)]/10"
    : "bg-[color:var(--alert-red)]/10";

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const normalized = (value - minVal) / range;
    const y = 40 - normalized * 26 - 8;
    return { x, y };
  });

  const areaPath = [
    "M 0 40",
    ...points.map((p, i) => `${i === 0 ? "L" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`),
    "L 100 40 Z",
  ].join(" ");

  const linePoints = points
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[color:var(--ig-blue)]">
            Bench Size Trend
          </h2>
          <p className="text-[11px] text-slate-500">
            Last {data.length} days · lower bench is better
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">Current bench</p>
          <p className="text-xl font-semibold text-[color:var(--ig-blue)]">
            {last}
          </p>
          <div
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${pillBg} ${changeColor}`}
          >
            <span>{isPositive ? "↓" : "↑"}</span>
            <span>{changeAbs.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-500">
              vs start
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 h-40 w-full">
        <svg viewBox="0 0 100 40" className="h-full w-full">
          {/* grid */}
          <g stroke="#e2e8f0" strokeWidth="0.25">
            {[10, 20, 30].map((y) => (
              <line key={y} x1="0" x2="100" y1={y} y2={y} />
            ))}
          </g>
          <defs>
            <linearGradient id="benchTrendArea" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isPositive ? "#56e13b" : "#db005a"}
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor={isPositive ? "#56e13b" : "#db005a"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#benchTrendArea)" stroke="none" />
          <polyline
            fill="none"
            stroke={isPositive ? "#56e13b" : "#db005a"}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={linePoints}
          />
        </svg>
      </div>

      {labels && labels.length === data.length && (
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default BenchSizeTrendChart;
