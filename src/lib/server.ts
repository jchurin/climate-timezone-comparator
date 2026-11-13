import "server-only";
import { cacheLife } from "next/cache";
import { getCityById } from "./api";

/** City metadata rarely changes, so cache lookups for a day. */
export async function getCity(id: number) {
  "use cache";
  cacheLife("days");
  return getCityById(id);
}
