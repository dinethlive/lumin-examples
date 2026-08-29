export function DisclaimerNote({ text }: { text: string }) {
  return (
    <p className="rounded-xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-black/[0.06]">
      {text}
    </p>
  );
}
