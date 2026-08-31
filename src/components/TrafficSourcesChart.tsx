import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "./ui/Card";
import { useOverviewMetrics } from "../contexts/OverviewMetricsContext";
import { useTheme } from "../theme/ThemeContext";

export function TrafficSourcesChart() {
  const { palette } = useTheme();
  const { metrics } = useOverviewMetrics();
  const platformShares = metrics?.platformShares ?? [];

  if (platformShares.length === 0) {
    return (
      <Card title="Followers by Platform" className="h-[280px]">
        <div className="flex h-[230px] items-center justify-center px-5 text-center text-[12px] text-dt-muted">
          No connected platforms yet
        </div>
      </Card>
    );
  }

  return (
    <Card title="Followers by Platform" className="h-[280px]">
      <div className="flex h-[230px] flex-col px-3 pb-3 pt-1">
        <ResponsiveContainer width="100%" height={118}>
          <PieChart>
            <Pie
              data={platformShares}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={54}
              paddingAngle={2}
              dataKey="value"
            >
              {platformShares.map((entry, i) => (
                <Cell key={entry.name} fill={palette.trafficShades[i % palette.trafficShades.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, item) => [
                `${value}% · ${(item?.payload?.followers ?? 0).toLocaleString()}`,
                "Share",
              ]}
              contentStyle={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <ul className="mt-2 flex-1 space-y-1.5 overflow-y-auto">
          {platformShares.map((s, i) => (
            <li
              key={s.name}
              className="flex items-center justify-between gap-3 text-[11px]"
            >
              <span className="flex min-w-0 items-center gap-2 text-[#a3a3a3]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: palette.trafficShades[i % palette.trafficShades.length] }}
                />
                <span className="truncate">{s.name}</span>
              </span>
              <span className="shrink-0 font-medium text-white">{s.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
