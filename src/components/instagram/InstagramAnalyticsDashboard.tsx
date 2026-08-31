import {
  Users,
  UserPlus,
  Grid3x3,
  Heart,
  MessageCircle,
  TrendingUp,
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
import { useAnalyticsView } from "../../hooks/useAnalyticsView";
import {
  captionPreview,
  formatMetric,
  formatPostDate,
  formatRelativeTime,
  type InstagramAnalytics,
  type InstagramPostAnalytics,
} from "../../lib/instagramAnalyticsApi";
import { SourceError, SourceLoading } from "../dametime/DametimeAnalyticsStates";

const CHART_GREEN = "#22c55e";

const tooltipStyle = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: 8,
  fontSize: 12,
};

function KpiGrid({ analytics }: { analytics: InstagramAnalytics }) {
  const cards = [
    { label: "Followers", value: formatMetric(analytics.kpis.followers, true), icon: Users },
    { label: "Following", value: formatMetric(analytics.kpis.following, true), icon: UserPlus },
    { label: "Total Posts", value: formatMetric(analytics.kpis.totalPosts, true), icon: Grid3x3 },
    { label: "Avg. Likes", value: formatMetric(analytics.kpis.avgLikes, true), icon: Heart },
    { label: "Avg. Comments", value: formatMetric(analytics.kpis.avgComments, true), icon: MessageCircle },
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

function EngagementLineChart({ analytics }: { analytics: InstagramAnalytics }) {
  const { palette } = useTheme();
  const chartData = [...analytics.recentPosts]
    .sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt))
    .map((post) => ({
      label: new Date(post.takenAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      likes: post.likes,
      comments: post.comments,
    }));

  return (
    <Card title="Post Engagement Over Time" className="h-[280px]">
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
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              formatter={(value) => <span className="text-dt-muted">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="likes"
              name="Likes"
              stroke={palette.accent}
              strokeWidth={2}
              dot={{ fill: palette.accent, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="comments"
              name="Comments"
              stroke={CHART_GREEN}
              strokeWidth={2}
              dot={{ fill: CHART_GREEN, r: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TopPostsBarChart({ analytics }: { analytics: InstagramAnalytics }) {
  const { palette } = useTheme();
  const chartData = analytics.topPosts.slice(0, 6).map((post) => ({
    label: new Date(post.takenAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    likes: post.likes,
    comments: post.comments,
  }));

  return (
    <Card title="Top Posts by Engagement" className="h-[280px]">
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
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              formatter={(value) => <span className="text-dt-muted">{value}</span>}
            />
            <Bar dataKey="likes" name="Likes" fill={palette.accent} radius={[4, 4, 0, 0]} />
            <Bar dataKey="comments" name="Comments" fill={CHART_GREEN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function EngagementSummary({ analytics }: { analytics: InstagramAnalytics }) {
  const totalLikes = analytics.recentPosts.reduce((sum, post) => sum + post.likes, 0);
  const totalComments = analytics.recentPosts.reduce((sum, post) => sum + post.comments, 0);
  const topPost = analytics.topPosts[0];

  const rows = [
    { label: "Sampled posts", value: String(analytics.recentPosts.length) },
    { label: "Total likes (sample)", value: formatMetric(totalLikes) },
    { label: "Total comments (sample)", value: formatMetric(totalComments) },
    { label: "Avg. likes / post", value: formatMetric(analytics.kpis.avgLikes) },
    { label: "Avg. comments / post", value: formatMetric(analytics.kpis.avgComments) },
    { label: "Engagement rate", value: `${analytics.kpis.engagementRate}%` },
  ];

  return (
    <Card title="Engagement Summary" className="h-[280px]">
      <div className="px-4 py-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-dt-border/60 py-2.5 text-sm last:border-0"
          >
            <span className="text-dt-muted">{row.label}</span>
            <span className="font-medium text-white">{row.value}</span>
          </div>
        ))}
        {topPost && (
          <p className="mt-3 text-xs text-dt-muted">
            Top post:{" "}
            <span className="text-white">{formatMetric(topPost.likes)} likes</span>
            {" · "}
            {formatPostDate(topPost.takenAt)}
          </p>
        )}
      </div>
    </Card>
  );
}

function TopPostsTable({ posts }: { posts: InstagramPostAnalytics[] }) {
  return (
    <Card title="Top Performing Posts">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-dt-border text-xs text-dt-muted">
              <th className="px-4 pb-2 pt-1">#</th>
              <th className="pb-2">Caption</th>
              <th className="pb-2">Likes</th>
              <th className="pb-2">Comments</th>
              <th className="pb-2">Posted</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, index) => (
              <tr key={post.id} className="border-b border-dt-border/50 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs font-bold text-dt-red">{index + 1}</td>
                <td className="max-w-[240px] py-3">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-1 font-medium text-white hover:text-dt-red"
                  >
                    {captionPreview(post.caption, 55)}
                  </a>
                </td>
                <td className="py-3">{formatMetric(post.likes)}</td>
                <td className="py-3 text-dt-green">{formatMetric(post.comments)}</td>
                <td className="py-3 text-dt-muted">{formatRelativeTime(post.takenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function InstagramAnalyticsView({ analytics }: { analytics: InstagramAnalytics }) {
  return (
    <div className="space-y-3 pb-4">
      <KpiGrid analytics={analytics} />

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 lg:col-span-6">
          <EngagementLineChart analytics={analytics} />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <TopPostsBarChart analytics={analytics} />
        </div>
      </div>

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 lg:col-span-8">
          <TopPostsTable posts={analytics.topPosts} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <EngagementSummary analytics={analytics} />
        </div>
      </div>
    </div>
  );
}

export function InstagramAnalyticsDashboard() {
  const { isInstagram, instagram } = useAnalyticsView();

  if (!isInstagram) return null;
  if (instagram.loading) return <SourceLoading message="Loading Instagram analytics…" />;
  if (instagram.error) {
    return <SourceError title="Could not load Instagram analytics" message={instagram.error} />;
  }
  if (!instagram.analytics) {
    return <SourceError title="Could not load Instagram analytics" message="No data available." />;
  }

  return <InstagramAnalyticsView analytics={instagram.analytics} />;
}
