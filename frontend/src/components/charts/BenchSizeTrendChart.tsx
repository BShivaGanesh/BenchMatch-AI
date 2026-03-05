import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface BenchSizeTrendChartProps {
  data: number[];
  labels: string[];
  current: number;
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
  isLoading?: boolean;
}

const BenchSizeTrendChart: React.FC<BenchSizeTrendChartProps> = ({
  data,
  labels,
  current,
  startDate,
  endDate,
  onDateRangeChange,
  isLoading = false,
}) => {
  const formattedData = labels.map((label: string, index: number) => ({
    day: label,
    value: data[index] ?? 0,
  }));

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 600,
              color: "#00283c",
            }}
          >
            Bench Size Trend
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              color: "#6b7280",
              fontSize: "12px",
            }}
          >
            Bench size movement · {startDate} to {endDate}
          </p>
        </div>

        {/* Right side: date range picker + current badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Date range inputs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f1f5f9",
              borderRadius: "12px",
              padding: "5px 12px",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <input
              type="date"
              value={startDate}
              max={endDate}
              disabled={isLoading}
              onChange={(e) => onDateRangeChange(e.target.value, endDate)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "12px",
                fontWeight: 500,
                color: "#00283c",
                cursor: isLoading ? "wait" : "pointer",
                outline: "none",
              }}
            />
            <span style={{ color: "#6b7280", fontSize: "13px", userSelect: "none" }}>→</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={new Date().toISOString().split("T")[0]}
              disabled={isLoading}
              onChange={(e) => onDateRangeChange(startDate, e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "12px",
                fontWeight: 500,
                color: "#00283c",
                cursor: isLoading ? "wait" : "pointer",
                outline: "none",
              }}
            />
          </div>

          {/* Current count badge */}
          <div
            style={{
              background: "#FFD700",
              color: "#00283c",
              padding: "5px 12px",
              borderRadius: "20px",
              fontWeight: 600,
              fontSize: "13px",
              whiteSpace: "nowrap",
            }}
          >
            Current: {current}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="benchGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D6F2" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00D6F2" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#e5e7eb"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 12 }} />

            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              }}
              labelStyle={{ color: "#00283c", fontWeight: 600 }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#00D6F2"
              strokeWidth={3}
              fill="url(#benchGradient)"
              dot={{
                r: 4,
                stroke: "#00D6F2",
                strokeWidth: 2,
                fill: "#ffffff",
              }}
              activeDot={{
                r: 6,
                fill: "#db005a",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BenchSizeTrendChart;
