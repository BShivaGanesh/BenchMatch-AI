import React from "react";
import KpiCard from "../components/ui/KpiCard";
import type { KpiCardProps } from "../components/ui/KpiCard";
import Table from "../components/ui/Table";
import type { TableColumn } from "../components/ui/Table";
import type { MatchHistoryItem } from "../types";
import ProgressBar from "../components/ui/ProgressBar";
import { Users, Activity, Zap, Clock } from "lucide-react";
import BenchSizeTrendChart from "../components/charts/BenchSizeTrendChart";

const kpiMetrics: KpiCardProps[] = [
  {
    title: "Total Employees on Bench",
    value: 42,
    change: -10.5,
    icon: Users,
    color: "text-[#00283c]",
    bgColor: "bg-blue-50",
    description: "Currently available for deployment",
    target: 30,
    period: "Last 7 days",
  },
  {
    title: "Avg. Bench Time (Days)",
    value: 18,
    change: -11.3,
    icon: Clock,
    color: "text-[#00D6F2]",
    bgColor: "bg-cyan-50",
    description: "Average days on bench across employees",
    target: 14,
    period: "Rolling 30 days",
  },
  {
    title: "Total Placements (Last 30 Days)",
    value: 27,
    change: 28.6,
    icon: Activity,
    color: "text-[#56e13b]",
    bgColor: "bg-emerald-50",
    description: "Bench to client project conversions",
    target: 40,
    period: "Last 30 days",
  },
  {
    title: "Highest Demand Skill",
    value: "React + Node",
    change: 0,
    icon: Zap,
    color: "text-[#FFD700]",
    bgColor: "bg-yellow-50",
    description: "Most requested in active client requirements",
    period: "Current month",
  },
];

const recentMatches: MatchHistoryItem[] = [
  {
    id: "1",
    requirementId: "REQ-10234",
    dateSubmitted: "2025-12-10",
    status: "Matched",
    topCandidateFitScore: 93,
  },
  {
    id: "2",
    requirementId: "REQ-10219",
    dateSubmitted: "2025-12-09",
    status: "In Progress",
    topCandidateFitScore: 81,
  },
  {
    id: "3",
    requirementId: "REQ-10187",
    dateSubmitted: "2025-12-07",
    status: "Matched",
    topCandidateFitScore: 88,
  },
  {
    id: "4",
    requirementId: "REQ-10175",
    dateSubmitted: "2025-12-06",
    status: "Matched",
    topCandidateFitScore: 76,
  },
  {
    id: "5",
    requirementId: "REQ-10152",
    dateSubmitted: "2025-12-04",
    status: "In Progress",
    topCandidateFitScore: 69,
  },
];


// 7 data points for bench size over time
const benchTrend: number[] = [56, 52, 49, 47, 45, 40, 42];

const DashboardPage: React.FC = () => {
  const matchColumns: TableColumn<MatchHistoryItem>[] = [
    {
      key: "requirementId",
      header: "Requirement",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-900">
            {row.requirementId}
          </span>
          <span className="text-[11px] text-slate-500">
            Submitted {row.dateSubmitted}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={
            row.status === "Matched"
              ? "rounded-full bg-[color:var(--evergreen-green)]/15 px-2 py-0.5 text-[11px] font-medium text-[color:var(--evergreen-green)]"
              : "rounded-full bg-[color:var(--highlight-yellow)]/15 px-2 py-0.5 text-[11px] font-medium text-[color:var(--highlight-yellow)]"
          }
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "topCandidateFitScore",
      header: "Top Fit Score",
      align: "right",
      render: (row) => (
        <div className="flex justify-end">
          <ProgressBar value={row.topCandidateFitScore} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top strip */}
      <section className="grid gap-4 lg:grid-cols-[2fr,1.3fr]">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--ig-blue)]">
            Evergreen Bench Overview
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Monitor bench supply, placement velocity, and emerging skill gaps in
            real time.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              Bench health: Stable
            </span>
            <span className="rounded-full bg-yellow-50 px-3 py-1 font-medium text-yellow-700">
              Hot skill: React + Node
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              Last refresh: 2 min ago
            </span>
          </div>
        </div>

        <BenchSizeTrendChart data={benchTrend} />
      </section>

      {/* KPI cards */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Bench & Placement KPIs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiMetrics.map((metric) => (
            <KpiCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      {/* Lower content: table + upgraded skill gaps */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent match history */}
        <section className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Recent Match History
              </h2>
              <p className="text-xs text-slate-500">
                Last 5 requirements ranked by Evergreen AI
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
              Match rate (30d): 82%
            </span>
          </div>
          <Table columns={matchColumns} data={recentMatches} />
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
