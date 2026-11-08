import { useContext } from "react";
import { GeofenceContext } from "../context/geofenceContextObject";

export function useGeofence() {
  const ctx = useContext(GeofenceContext);
  if (!ctx) throw new Error("useGeofence harus dipakai di dalam <GeofenceProvider>.");
  return ctx;
}
