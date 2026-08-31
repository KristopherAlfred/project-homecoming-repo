import { useTheme } from "../theme/ThemeContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "./ui/Card";
import { useOverviewMetrics } from "../contexts/OverviewMetricsContext";

function formatAxis(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function TrafficChart() {
  const { palette } = useTheme();
  const { metrics } = useOverviewMetrics();
  const data = metrics?.followersOverTime ?? [];

  if (data.length === 0) {
    return (
      <Card title="Followers Over Time" className="h-[280px]">
        <div className="flex h-[230px] items-center justify-center px-6 text-center text-[12px] text-dt-muted">
          No connected platforms yet — connect a platform to start tracking follower history.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Followers Over Time" className="h-[280px]">
      <div className="h-[230px] px-2 pb-2 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#ffffff" strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#ffffff", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#ffffff", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxis}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#fff" }}
              formatter={(value: number) => [value.toLocaleString(), "Followers"]}
            />
            <Line
              type="monotone"
              dataKey="followers"
              stroke={palette.accent}
              strokeWidth={2}
              dot={{ fill: palette.accent, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
