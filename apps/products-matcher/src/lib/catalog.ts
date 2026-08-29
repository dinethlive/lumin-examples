import catalogData from "@/data/catalog.json";
import type { Product } from "./types";

export const catalog: Product[] = catalogData as Product[];

const catalogById = new Map(catalog.map((p) => [p.id, p]));

export function getProduct(id: string): Product | undefined {
  return catalogById.get(id);
}
