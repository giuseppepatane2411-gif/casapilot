type Props = {
  className?: string;
  compact?: boolean;
  tagline?: boolean;
};

export default function GuimmiaWordmark({
  className = "",
  compact = false,
  tagline = false,
}: Props) {
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span
        className={`${compact ? "text-xl" : "text-2xl"} font-black tracking-[-0.055em]`}
        style={{
          fontFamily:
            'ui-rounded, "Arial Rounded MT Bold", "Avenir Next Rounded", "Nunito", system-ui, sans-serif',
        }}
      >
        <span className="text-slate-950">Guimm</span>
        <span className="text-blue-600">ia</span>
      </span>
      {tagline ? (
        <span className="mt-1 text-[11px] font-semibold tracking-[-0.01em] text-slate-500">
          La tua guida immobiliare intelligente
        </span>
      ) : null}
    </span>
  );
}
