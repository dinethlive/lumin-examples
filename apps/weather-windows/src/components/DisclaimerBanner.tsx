export function DisclaimerBanner({ text }: { text: string }) {
  return (
    <aside className="fade-up mt-10 rounded-2xl bg-muted/50 p-5 text-xs leading-relaxed text-muted-foreground ring-1 ring-black/[0.04]">
      <p className="mb-1 text-[10px] font-medium tracking-[0.18em] uppercase text-primary">
        How to read this
      </p>
      <p>{text}</p>
    </aside>
  );
}
