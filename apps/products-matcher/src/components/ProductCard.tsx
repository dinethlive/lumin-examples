import type { Product } from "@/lib/types";

const CATEGORY_LABEL: Record<Product["category"], string> = {
  flowers: "Flowers",
  cakes: "Cakes",
  chocolates: "Chocolates",
  jewelry: "Jewelry & Watches",
  electronics: "Electronics",
  hampers: "Hampers",
  home: "Home & Lifestyle",
  fashion: "Fashion",
  toys: "Toys",
  food: "Food & Tea",
};

export function ProductCard({
  product,
  reason,
  index,
}: {
  product: Product;
  reason: string;
  index: number;
}) {
  return (
    <article
      className="fade-up group relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-black/[0.06] transition shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06),0_16px_32px_-16px_rgba(0,0,0,0.16)]"
      style={{ animationDelay: `${100 + index * 80}ms`, opacity: 0 }}
    >
      <div
        className="relative h-44 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${product.hue}15 0%, ${product.hue}40 50%, ${product.hue}25 100%)`,
        }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${product.hue}55, transparent 60%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-foreground/60">
            {CATEGORY_LABEL[product.category]}
          </p>
        </div>
        <div
          className="absolute right-3 top-3 size-12 rounded-full opacity-60 mix-blend-multiply"
          style={{ background: product.hue }}
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg leading-snug tracking-tight text-foreground">
          {product.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.traits.map((trait) => (
            <span
              key={trait}
              className="inline-flex items-center rounded-full bg-muted/70 px-2 py-0.5 text-[9px] font-medium tracking-wide uppercase text-muted-foreground"
            >
              {trait}
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-foreground">
          <p className="mb-1 text-[10px] font-medium tracking-[0.16em] uppercase text-primary">
            Why this for you
          </p>
          {reason}
        </div>

        <div className="mt-auto flex items-end justify-between pt-5">
          <p className="text-sm font-medium text-foreground">
            LKR {product.price_lkr.toLocaleString()}
          </p>
        </div>
      </div>
    </article>
  );
}
