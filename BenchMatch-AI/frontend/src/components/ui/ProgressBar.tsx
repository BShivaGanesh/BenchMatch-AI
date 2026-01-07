import React from "react";

interface ProgressBarProps {
  value: number; // 0-100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const safe = Math.max(0, Math.min(100, value));

  const color =
    safe >= 75
      ? "bg-[color:var(--evergreen-green)]"
      : safe >= 50
      ? "bg-[color:var(--highlight-yellow)]"
      : "bg-[color:var(--alert-red)]";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${safe}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-800">{safe}%</span>
    </div>
  );
};

export default ProgressBar;
