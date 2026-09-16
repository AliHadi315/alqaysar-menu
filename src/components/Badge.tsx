export function Badge({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "muted" | "red" }) {
  const tones = {
    gold: "bg-gold-soft text-ink",
    muted: "bg-line text-ink-soft",
    red: "bg-red-100 text-red-800",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}
