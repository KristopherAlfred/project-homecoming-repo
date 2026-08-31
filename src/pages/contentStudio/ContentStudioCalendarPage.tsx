import { useNavigate } from "@/lib/router-compat";
import { Plus } from "lucide-react";
import { PageShell, StatCard } from "../../components/PageShell";
import { StudioCalendar } from "../../components/contentStudio/StudioCalendar";
import { useContentStudio } from "../../lib/contentStudio/store";
import { useStudioAccounts } from "../../lib/contentStudio/accounts";

export function ContentStudioCalendarPage() {
  const navigate = useNavigate();
  const { content, drafts } = useContentStudio();
  const { connectedKeys } = useStudioAccounts();

  const scheduled = content.filter((c) => c.status === "scheduled");
  const published = content.filter((c) => c.status === "published");

  return (
    <PageShell
      actions={
        <button
          type="button"
          onClick={() => navigate("/studio/create")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-dt-red px-3.5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
        >
          <Plus size={14} /> Create content
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scheduled" value={String(scheduled.length)} hint="Queued across destinations" />
        <StatCard label="Drafts" value={String(drafts.length)} hint="Waiting on approval or media" />
        <StatCard label="Published" value={String(published.length)} hint="From this workspace" />
        <StatCard
          label="Connected destinations"
          value={String(connectedKeys.length)}
          hint="Fan App plus your connectors"
        />
      </div>

      <StudioCalendar
        onCreate={(iso) => navigate(`/studio/create?at=${encodeURIComponent(iso)}`)}
        onSelect={(record) => navigate(`/studio/create?id=${record.id}`)}
      />
    </PageShell>
  );
}
