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
  formatMetric,
  formatPostDate,
  textPreview,
  type TwitterAnalytics,
  type TwitterPostAnalytics,
} from "../../lib/twitterAnalyticsApi";
import { SourceError, SourceLoading } from "../dametime/DametimeAnalyticsStates";

const CHART_GREEN = "#22c55e";

const tooltipStyle = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: 8,
  fontSize: 12,
};

function postEngagement(post: TwitterPostAnalytics) {
  return post.likes + post.replies + post.reposts;
}

function KpiGrid({ analytics }: { analytics: TwitterAnalytics }) {
  const cards = [
    { label: "Followers", value: formatMetric(analytics.kpis.followers, true), icon: Users },
    { label: "Following", value: formatMetric(analytics.kpis.following, true), icon: UserPlus },
    { label: "Sampled Posts", value: formatMetric(analytics.kpis.sampledPosts, true), icon: Grid3x3 },
    { label: "Avg. Likes", value: formatMetric(analytics.kpis.avgLikes, true), icon: Heart },
    { label: "Avg. Replies", value: formatMetric(analytics.kpis.avgReplies, true), icon: MessageCircle },
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

function EngagementLineChart({ analytics }: { analytics: TwitterAnalytics }) {
  const { palette } = useTheme();
  const chartData = [...analytics.recentPosts]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((post) => ({
      label: new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      likes: post.likes,
      replies: post.replies,
      reposts: post.reposts,
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
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
            <Line
              type="monotone"
              dataKey="likes"
              name="Likes"
              stroke={palette.accent}
              strokeWidth={2}
              dot={{ fill: palette.accent, r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="replies"
              name="Replies"
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

function TopPostsBarChart({ analytics }: { analytics: TwitterAnalytics }) {
  const { palette } = useTheme();
  const chartData = analytics.topPosts.slice(0, 6).map((post, index) => ({
    label: `#${index + 1}`,
    likes: post.likes,
    reposts: post.reposts,
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
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
            <Bar dataKey="likes" name="Likes" fill={palette.accent} radius={[4, 4, 0, 0]} />
            <Bar dataKey="reposts" name="Reposts" fill={CHART_GREEN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function ProfileSummary({ analytics }: { analytics: TwitterAnalytics }) {
  const rows = [
    { label: "Profile", value: analytics.profile.name },
    { label: "Handle", value: analytics.profile.handle },
    { label: "Followers", value: analytics.profile.followersLabel },
    { label: "Following", value: formatMetric(analytics.profile.following) },
    { label: "Total posts", value: formatMetric(analytics.profile.totalPosts) },
    { label: "Avg. reposts", value: formatMetric(analytics.kpis.avgReposts) },
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

function TopPostsTable({ posts }: { posts: TwitterPostAnalytics[] }) {
  return (
    <Card title="Top Performing Posts">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-dt-border text-xs text-dt-muted">
              <th className="px-4 pb-2 pt-1">#</th>
              <th className="pb-2">Post</th>
              <th className="pb-2">Likes</th>
              <th className="pb-2">Replies</th>
              <th className="pb-2">Reposts</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, index) => (
              <tr key={post.id} className="border-b border-dt-border/50 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs font-bold text-dt-red">{index + 1}</td>
                <td className="max-w-[280px] py-3">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-1 font-medium text-white hover:text-dt-red"
                  >
                    {textPreview(post.text, 55)}
                  </a>
                </td>
                <td className="py-3">{formatMetric(post.likes)}</td>
                <td className="py-3 text-dt-green">{formatMetric(post.replies)}</td>
                <td className="py-3">{formatMetric(post.reposts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function RecentPostsTable({ posts }: { posts: TwitterPostAnalytics[] }) {
  return (
    <Card title="Recent Posts">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-dt-border text-xs text-dt-muted">
              <th className="px-4 pb-2 pt-1">Post</th>
              <th className="pb-2">Engagement</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-dt-border/50 hover:bg-white/[0.02]">
                <td className="max-w-[320px] px-4 py-3">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-1 font-medium text-white hover:text-dt-red"
                  >
                    {textPreview(post.text, 60)}
                  </a>
                </td>
                <td className="py-3 text-dt-green">{formatMetric(postEngagement(post))}</td>
                <td className="py-3 text-dt-muted">{formatPostDate(post.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function TwitterAnalyticsView({ analytics }: { analytics: TwitterAnalytics }) {
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
          <ProfileSummary analytics={analytics} />
        </div>
      </div>

      <RecentPostsTable posts={analytics.recentPosts} />
    </div>
  );
}

export function TwitterAnalyticsDashboard() {
  const { isTwitter, twitter } = useAnalyticsView();

  if (!isTwitter) return null;
  if (twitter.loading) return <SourceLoading message="Loading X analytics…" />;
  if (twitter.error) {
    return <SourceError title="Could not load X analytics" message={twitter.error} />;
  }
  if (!twitter.analytics) {
    return <SourceError title="Could not load X analytics" message="No data available." />;
  }

  return <TwitterAnalyticsView analytics={twitter.analytics} />;
}
