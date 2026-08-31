import { Lock, Star, Crown } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-4 grid grid-cols-1 gap-3 border-t border-dt-border px-2 py-5 md:grid-cols-3 md:gap-4">
      <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-white md:justify-start md:text-[11px]">
        <Lock size={14} className="text-dt-red" />
        SECURE. PRIVATE. COMPLIANT.
      </div>
      <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-white md:text-[11px]">
        <Star size={14} className="text-dt-red" />
        OWNED BY ATHLETES.
      </div>
      <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-white md:justify-end md:text-[11px]">
        REAL FANS. REAL DATA. REAL VALUE.
        <Crown size={14} className="text-dt-red" />
      </div>
    </footer>
  );
}
