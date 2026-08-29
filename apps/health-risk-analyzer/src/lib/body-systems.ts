import data from "@/data/body-systems.json";
import type { BodySystem, SystemId } from "./types";

export const bodySystems: BodySystem[] = data as BodySystem[];

const systemsById = new Map(bodySystems.map((s) => [s.id, s]));

export function getBodySystem(id: SystemId): BodySystem | undefined {
  return systemsById.get(id);
}
