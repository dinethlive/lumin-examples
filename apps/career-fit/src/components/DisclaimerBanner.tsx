export function DisclaimerBanner({ text }: { text: string }) {
  return (
    <aside className="rounded-xl bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
      <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-700">
        Not a hiring or screening input
      </p>
      <p>{text}</p>
    </aside>
  );
}
