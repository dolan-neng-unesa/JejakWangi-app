/** Tolak promise kalau melewati `ms` — mencegah Firestore offline menggantung halaman. */
export function withTimeout(promise, ms = 4000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
