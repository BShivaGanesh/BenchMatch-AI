import React from "react";
import type { SkillGapItem } from "../../types";

interface SkillGapBarChartProps {
  data: SkillGapItem[];
}

const SkillGapBarChart: React.FC<SkillGapBarChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxGap = Math.max(...data.map((d) => d.missingCount));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Top Skill Gaps (Bench)
          </h2>
          <p className="text-[11px] text-slate-500">
            Highest unmet demand across current bench inventory.
          </p>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-medium text-[color:var(--alert-red)]">
          Priority: High
        </span>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const width = (item.missingCount / maxGap) * 100;
          const rank = index + 1;
          return (
            <div key={item.skill} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                    {rank}
                  </span>
                  <span className="font-medium text-slate-800">
                    {item.skill}
                  </span>
                </div>
                <span className="text-slate-500">
                  {item.missingCount} employees
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-[color:var(--alert-red)]"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] font-semibold text-slate-700">
                  {item.missingCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="pt-2 text-[11px] text-slate-500">
        Focus sourcing and upskilling on the top 3 gaps to reduce average bench
        time.
      </p>
    </div>
  );
};

export default SkillGapBarChart;
