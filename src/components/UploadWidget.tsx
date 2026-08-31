import { useAthlete } from "../contexts/AthleteContext";
import { Link } from "@/lib/router-compat";
import { Sparkles, Newspaper } from "lucide-react";
import { Card } from "./ui/Card";

export function UploadWidget() {
  const { fanAppName } = useAthlete();
  return (
    <Card className="flex h-full w-full flex-col">
      <div className="dt-surface-inset m-4 flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-dt-border/80 px-6 py-8 text-center">
        <div className="mb-4 rounded-full border border-dt-red/30 bg-dt-red/10 p-4 text-dt-red">
          <Sparkles size={36} strokeWidth={1.25} />
        </div>
        <p className="mb-1 text-sm font-medium text-white">Publish to {fanAppName}</p>
        <p className="mb-5 text-xs text-dt-muted">
          Build the home experience or write a newsletter fans see in the app.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/experience"
            className="flex items-center gap-2 rounded-md bg-dt-red px-4 py-2 text-sm font-semibold text-white hover:bg-dt-red-hover"
          >
            <Sparkles size={14} />
            Experience
          </Link>
          <Link
            to="/content/news"
            className="flex items-center gap-2 rounded-md border border-dt-border px-4 py-2 text-sm font-semibold text-white hover:border-dt-red/40"
          >
            <Newspaper size={14} />
            News
          </Link>
        </div>
      </div>
    </Card>
  );
}
