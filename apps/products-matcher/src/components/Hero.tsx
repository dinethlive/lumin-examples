export function Hero() {
  return (
    <header className="relative overflow-hidden">
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center md:pt-28 md:pb-16">
        <div className="fade-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium tracking-wide uppercase text-muted-foreground ring-1 ring-black/[0.05]">
            <span className="size-1.5 rounded-full bg-primary" />
            Personal product matcher
          </p>
          <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-foreground md:text-6xl">
            Find products that
            <br />
            fit who you are
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Share your birth details. We&rsquo;ll read your KP/Vedic chart, surface your
            consumer personality, and pick five things from our shop that suit your
            nature, from flowers and fashion to electronics and gifts.
          </p>
        </div>
      </div>
    </header>
  );
}
