export function Hero() {
  return (
    <header className="relative overflow-hidden">
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center md:pt-28 md:pb-16">
        <div className="fade-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium tracking-wide uppercase text-muted-foreground ring-1 ring-black/[0.05]">
            <span className="size-1.5 rounded-full bg-primary" />
            Constitutional health risk profile
          </p>
          <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-foreground md:text-6xl">
            Where the body
            <br />
            is most exposed
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Share your birth details. We&rsquo;ll read your KP/Vedic chart, map
            constitutional vulnerability across eight body systems, and surface peak
            windows, surgery and recovery timing, and a screening calendar grounded in
            the Vimshottari dasha.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground/80">
            Not a medical diagnosis. A screening prompt clinicians and wellness coaches
            can pair with actual tests.
          </p>
        </div>
      </div>
    </header>
  );
}
