import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

export type DtSelectOption = {
  value: string;
  label: string;
  style?: CSSProperties;
};

type DtSelectProps = {
  value: string;
  options: DtSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
};

export function DtSelect({
  value,
  options,
  onChange,
  className = "",
  disabled = false,
  placeholder = "Select…",
  "aria-label": ariaLabel,
}: DtSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`dt-select-root relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`dt-select-trigger flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? "dt-select-trigger--open" : ""
        }`}
      >
        <span className="min-w-0 truncate" style={selected?.style}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-white/45 transition ${open ? "rotate-180 text-white/70" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="dt-select-menu absolute left-0 right-0 z-[80] mt-1.5 max-h-64 overflow-y-auto rounded-xl border p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.65)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={`dt-select-option flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    isSelected ? "dt-select-option--selected" : ""
                  }`}
                  style={option.style}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected ? <Check size={14} className="shrink-0 text-white" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

type DtSelectFieldProps = {
  label: ReactNode;
  value: string;
  options: DtSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function DtSelectField({
  label,
  value,
  options,
  onChange,
  className = "",
  disabled,
}: DtSelectFieldProps) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">{label}</span>
      <DtSelect value={value} options={options} onChange={onChange} disabled={disabled} />
    </label>
  );
}
