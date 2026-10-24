export function DisclaimerBanner({
  text,
  toolText,
  saptaNadiText,
}: {
  text: string;
  /** The weather tools' own disclaimer, relayed word for word. */
  toolText?: string;
  /** The Sapta Nadi block's own disclaimer, relayed word for word. */
  saptaNadiText?: string;
}) {
  return (
    <aside className="fade-up mt-10 space-y-2 rounded-2xl bg-muted/50 p-5 text-xs leading-relaxed text-muted-foreground ring-1 ring-black/[0.04]">
      <p className="mb-1 text-[10px] font-medium tracking-[0.18em] uppercase text-primary">
        How to read this
      </p>
      <p>{text}</p>
      {toolText && <p>{toolText}</p>}
      {saptaNadiText && <p>{saptaNadiText}</p>}
    </aside>
  );
}
