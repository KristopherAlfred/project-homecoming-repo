import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "../ui/Card";
import { useTheme } from "../../theme/ThemeContext";
import {
  captionPreview,
  formatMetric,
  formatPostDate,
  type TikTokAnalytics,
  type TikTokVideoAnalytics,
} from "../../lib/tiktokAnalyticsApi";

const CHART_GREEN = "#22c55e";

const tooltipStyle = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: 8,
  fontSize: 12,
};

function KpiGrid({ analytics }: { analytics: TikTokAnalytics }) {
  const cards = [
    { label: "Followers", value: formatMetric(analytics.kpis.followers, true), icon: Users },
    { label: "Total Likes", value: formatMetric(analytics.kpis.totalLikes, true), icon: Heart },
    { label: "Videos", value: formatMetric(analytics.kpis.totalVideos, true), icon: Video },
    { label: "Avg. Views", value: formatMetric(analytics.kpis.avgViews, true), icon: Eye },
    { label: "Avg. Likes", value: formatMetric(analytics.kpis.avgLikes, true), icon: MessageCircle },
    { label: "Engagement", value: `${analytics.kpis.engagementRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="dt-surface relative min-w-0 overflow-hidden rounded-lg border border-dt-border bg-dt-card p-3 xl:p-4"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-black to-black/95" />
            <p className="relative text-[10px] font-medium uppercase tracking-wide text-white xl:text-[11px]">
              {card.label}
            </p>
            <p className="relative mt-1.5 text-xl font-bold text-white xl:mt-2 xl:text-2xl">{card.value}</p>
            <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 sm:block">
              <Icon size={20} strokeWidth={1.75} className="text-dt-red" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ViewsLineChart({ analytics }: { analytics: TikTokAnalytics }) {
  const { palette } = useTheme();
  const chartData = [...analytics.recentVideos]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((video) => ({
      label: new Date(video.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: video.views,
      likes: video.likes,
    }));

  return (
    <Card title="Views Over Time" className="h-[280px]">
      <div className="h-[230px] px-2 pb-2 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="#ffffff" strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#ffffff", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#ffffff", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
            />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
            <Line
              type="monotone"
              dataKey="views"
              name="Views"
              stroke={palette.accent}
              strokeWidth={2}
              dot={{ fill: palette.accent, r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="likes"
              name="Likes"
              stroke={CHART_GREEN}
              strokeWidth={2}
              dot={{ fill: CHART_GREEN, r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TopVideosBarChart({ analytics }: { analytics: TikTokAnalytics }) {
  const { palette } = useTheme();
  const chartData = analytics.topVideos.slice(0, 6).map((video, index) => ({
    label: `#${index + 1}`,
    views: video.views,
    likes: video.likes,
  }));

  return (
    <Card title="Top Videos by Views" className="h-[280px]">
      <div className="h-[230px] px-2 pb-2 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid stroke="#ffffff" strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#ffffff", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#ffffff", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
            />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
            <Bar dataKey="views" name="Views" fill={palette.accent} radius={[4, 4, 0, 0]} />
            <Bar dataKey="likes" name="Likes" fill={CHART_GREEN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function ProfileSummary({ analytics }: { analytics: TikTokAnalytics }) {
  const rows = [
    { label: "Creator", value: analytics.profile.nickname },
    { label: "Handle", value: analytics.profile.handle },
    { label: "Followers", value: analytics.profile.followersLabel },
    { label: "Profile likes", value: formatMetric(analytics.profile.likes, true) },
    { label: "Videos", value: formatMetric(analytics.profile.videoCount) },
    { label: "Engagement rate", value: `${analytics.kpis.engagementRate}%` },
  ];

  return (
    <Card title="Profile Summary" className="h-[280px]">
      <div className="px-4 py-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-dt-border/60 py-2.5 text-sm last:border-0"
          >
            <span className="text-dt-muted">{row.label}</span>
            <span className="max-w-[55%] truncate text-right font-medium text-white">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TopVideosTable({ videos }: { videos: TikTokVideoAnalytics[] }) {
  return (
    <Card title="Top Performing Videos">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-dt-border text-xs text-dt-muted">
              <th className="px-4 pb-2 pt-1">#</th>
              <th className="pb-2">Video</th>
              <th className="pb-2">Views</th>
              <th className="pb-2">Likes</th>
              <th className="pb-2">Comments</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video, index) => (
              <tr key={video.id} className="border-b border-dt-border/50 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs font-bold text-dt-red">{index + 1}</td>
                <td className="max-w-[280px] py-3">
                  <a
                    href={video.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-1 font-medium text-white hover:text-dt-red"
                  >
                    {captionPreview(video.caption, 55)}
                  </a>
                </td>
                <td className="py-3">{formatMetric(video.views)}</td>
                <td className="py-3 text-dt-green">{formatMetric(video.likes)}</td>
                <td className="py-3">{formatMetric(video.comments)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function RecentVideosTable({ videos }: { videos: TikTokVideoAnalytics[] }) {
  return (
    <Card title="Recent Videos">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-dt-border text-xs text-dt-muted">
              <th className="px-4 pb-2 pt-1">Video</th>
              <th className="pb-2">Views</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-b border-dt-border/50 hover:bg-white/[0.02]">
                <td className="max-w-[320px] px-4 py-3">
                  <a
                    href={video.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 line-clamp-1 font-medium text-white hover:text-dt-red"
                  >
                    <Share2 size={12} className="shrink-0 text-dt-red" />
                    {captionPreview(video.caption, 60)}
                  </a>
                </td>
                <td className="py-3 text-dt-green">{formatMetric(video.views)}</td>
                <td className="py-3 text-dt-muted">{formatPostDate(video.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function TikTokAnalyticsView({ analytics }: { analytics: TikTokAnalytics }) {
  return (
    <div className="space-y-3 pb-4">
      <KpiGrid analytics={analytics} />

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 lg:col-span-6">
          <ViewsLineChart analytics={analytics} />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <TopVideosBarChart analytics={analytics} />
        </div>
      </div>

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 lg:col-span-8">
          <TopVideosTable videos={analytics.topVideos} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <ProfileSummary analytics={analytics} />
        </div>
      </div>

      <RecentVideosTable videos={analytics.recentVideos} />
    </div>
  );
}
