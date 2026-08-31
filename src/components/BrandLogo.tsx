type BrandLogoProps = {
  compact?: boolean;
  variant?: "default" | "sidebar";
};

export function BrandLogo({ compact = false, variant = "default" }: BrandLogoProps) {
  if (variant === "sidebar") {
    return (
      <div className="flex h-[72px] w-full items-center justify-center bg-transparent px-4 py-3">
        <img
          src="/players-os-logo.png"
          alt="Players OS"
          className="h-full w-full object-contain object-center"
        />
      </div>
    );
  }

  if (compact) {
    return (
      <img
        src="/players-os-logo.png"
        alt="Players OS"
        className="h-8 w-auto max-w-[160px] object-contain object-left"
      />
    );
  }

  return (
    <img
      src="/players-os-logo.png"
      alt="Players OS"
      className="h-11 w-auto max-w-[200px] object-contain object-left"
    />
  );
}
