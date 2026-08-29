export function Hero() {
  return (
    <header className="relative overflow-hidden">
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center md:pt-28 md:pb-16">
        <div className="fade-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium tracking-wide uppercase text-muted-foreground ring-1 ring-black/[0.05]">
            <span className="size-1.5 rounded-full bg-primary" />
            KP astrometeorology
          </p>
          <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-foreground md:text-6xl">
            Find the calm
            <br />
            windows ahead
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Pick a place and a date range. We&rsquo;ll read the KP weather signature for
            each fortnightly lunation window and score it for temperature, rain, and
            wind, so you can see which stretches lean settled and which look unsettled.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground/80">
            An astrological weather lens, not a meteorological forecast. Pair it with
            conventional forecasts before you commit a plan.
          </p>
        </div>
      </div>
    </header>
  );
}
