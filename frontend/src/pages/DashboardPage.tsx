import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api/benchApi";
import KpiCard from "../components/ui/KpiCard";
import type { KpiCardProps } from "../components/ui/KpiCard";
import Table from "../components/ui/Table";
import type { TableColumn } from "../components/ui/Table";
import { Users, Activity, Zap, Clock, Search, Filter } from "lucide-react";
import BenchSizeTrendChart from "../components/charts/BenchSizeTrendChart";

// Initial KPI state (will be replaced with real data)
const initialKpis = {
  total_bench_employees: 0,
  avg_bench_days: 0,
  placements_last_30_days: 0,
  highest_demand_skill: "Loading...",
};

const initialBenchTrend = {
  trend: [56, 52, 49, 47, 45, 40, 42],
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  current: 42,
};

export const DashboardPage: React.FC = () => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState(initialKpis);
  const [benchTrendData, setBenchTrendData] = useState(initialBenchTrend);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchRole, setSearchRole] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "candidates">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.allSettled([fetchKpis(), fetchBenchTrend(), fetchRequirements()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const fetchKpis = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/kpis`);
      const json = await res.json();
      if (json.status === "success" && json.data) {
        setKpiData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch KPI analytics:", error);
    }
  };

  const fetchBenchTrend = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/bench-trend`);
      const json = await res.json();
      if (json.status === "success" && json.data) {
        setBenchTrendData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch bench trend:", error);
    }
  };

  const fetchRequirements = async () => {
    try {
      const res = await fetch(`${API_BASE}/requirements`);
      const json = await res.json();
      setRequirements(json.data || []);
    } catch (error) {
      console.error("Failed to fetch requirements:", error);
    }
  };

  // Build KPI metrics from fetched data
  const kpiMetrics: KpiCardProps[] = [
    {
      title: "Total Employees on Bench",
      value: kpiData.total_bench_employees,
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
      value: kpiData.avg_bench_days,
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
      value: kpiData.placements_last_30_days,
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
      value: kpiData.highest_demand_skill,
      change: 0,
      icon: Zap,
      color: "text-[#FFD700]",
      bgColor: "bg-yellow-50",
      description: "Most requested in active client requirements",
      period: "Current month",
    },
  ];

  const requirementColumns: TableColumn<any>[] = [
    {
      key: "requirement_id",
      header: "Requirement",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-900">
            {row.requirement_id}
          </span>
          <span className="text-[11px] text-slate-500">{row.client_name}</span>
        </div>
      ),
    },
    {
      key: "role_title",
      header: "Role",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-slate-900">{row.role_title}</span>
          <span className="text-[11px] text-slate-500">
            Submitted {row.submitted_date}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: any) => (
        <span
          className={
            row.status === "Open"
              ? "rounded-full bg-[color:var(--highlight-yellow)]/15 px-2 py-0.5 text-[11px] font-medium text-[color:var(--highlight-yellow)]"
              : row.status === "In Progress"
                ? "rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700"
                : "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
          }
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "matched_candidates",
      header: "Bench Candidates",
      align: "right",
      render: (row: any) => <span>{row.matched_candidates || 0}</span>,
    },
  ];

  const filteredAndSortedRequirements = React.useMemo(() => {
    let data = [...requirements];

    if (statusFilter !== "All") {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (searchRole.trim()) {
      data = data.filter((r) =>
        r.role_title?.toLowerCase().includes(searchRole.toLowerCase())
      );
    }

    data.sort((a, b) => {
      if (sortBy === "date") {
        const d1 = new Date(a.submitted_date).getTime();
        const d2 = new Date(b.submitted_date).getTime();
        return sortOrder === "asc" ? d1 - d2 : d2 - d1;
      }

      if (sortBy === "candidates") {
        const c1 = a.matched_candidates || 0;
        const c2 = b.matched_candidates || 0;
        return sortOrder === "asc" ? c1 - c2 : c2 - c1;
      }

      return 0;
    });

    return data;
  }, [requirements, statusFilter, searchRole, sortBy, sortOrder]);

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

        <BenchSizeTrendChart data={benchTrendData.trend} labels={benchTrendData.labels} />
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

      {/* Requirements Table */}
      <section className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Requirement History
            </h2>
            <p className="text-xs text-slate-500">
              Click any requirement to view shortlisted candidates
            </p>
          </div>
          <span className="rounded-full bg-[color:var(--ig-blue)]/10 px-3 py-1 text-xs font-medium text-[color:var(--ig-blue)]">
            {filteredAndSortedRequirements.length} of {requirements.length}
          </span>
        </div>

        {/* Filters & Search Bar */}
        {!isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Box */}
              <div className="relative flex-1 lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by role title..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-[color:var(--light-watermark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--light-watermark)]"
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                />
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">Status:</span>
                {["All", "In Progress", "Matched"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? "bg-[color:var(--ig-blue)] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Sort:</span>
                <select
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[color:var(--light-watermark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--light-watermark)]"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split("-");
                    setSortBy(by as any);
                    setSortOrder(order as any);
                  }}
                >
                  <option value="date-desc">Latest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="candidates-desc">Most Candidates</option>
                  <option value="candidates-asc">Least Candidates</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="circle-loader">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
              <div className="mb-1 text-sm font-semibold text-[color:var(--ig-blue)]">
                Loading Requirements History...
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-slide-in">
            <Table
              columns={requirementColumns}
              data={filteredAndSortedRequirements}
              onRowClick={(row) => {
                navigate(`/shortlist/${row.requirement_id}`);
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
