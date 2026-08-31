import { useSearchParams, useNavigate } from "@/lib/router-compat";
import { PageShell } from "../../components/PageShell";
import { ContentComposer } from "../../components/contentStudio/ContentComposer";
import { blankContent, useContentStudio, useWorkspaceId } from "../../lib/contentStudio/store";

export function CreateContentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const { content } = useContentStudio();

  const id = params.get("id");
  const at = params.get("at");
  const existing = id ? content.find((c) => c.id === id) : undefined;
  const initial = existing ?? blankContent(workspaceId, at ?? null);

  return (
    <PageShell>
      <ContentComposer
        key={initial.id}
        initial={initial}
        onDone={() => navigate("/studio/schedule")}
      />
    </PageShell>
  );
}
