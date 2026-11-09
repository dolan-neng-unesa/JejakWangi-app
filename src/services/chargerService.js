import { delay } from "./config";
import { apiRequest, isLaravelAvailable } from "./laravelClient";
import { chargers } from "../data/mockChargers";

/** Charger station surya: Laravel API → data mock (pola sama dengan contentService). */
export async function getChargers() {
  if (isLaravelAvailable()) {
    try {
      const res = await apiRequest("/chargers");
      return res?.data ?? [];
    } catch {
      // jatuh ke mock
    }
  }
  await delay();
  return chargers;
}

export async function getCharger(id) {
  if (isLaravelAvailable()) {
    try {
      const res = await apiRequest(`/chargers/${encodeURIComponent(id)}`);
      return res?.data ?? null;
    } catch (err) {
      if (err?.status === 404) return null;
    }
  }
  await delay();
  return chargers.find((c) => c.id === Number(id)) ?? null;
}
