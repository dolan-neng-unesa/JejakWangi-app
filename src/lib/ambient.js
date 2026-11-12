// Suara ambient tenang untuk menemani perjalanan (alur: "sound efek yang tenang").
// Dibangkitkan lewat Web Audio API (pad lembut + gelombang pelan), jadi tidak butuh berkas audio.
// Bila zona geofence punya audio sendiri (tabel soundscapes), halaman bisa memakainya lebih dulu.

export function createAmbient() {
  let ctx = null;
  let master = null;
  let nodes = [];

  function start() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    // Akord La mayor-9 yang dibawakan lambat: tiga sinus detune halus + LFO volume.
    [220, 277.18, 329.63, 493.88].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07 + i * 0.03;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain).connect(g.gain);
      osc.connect(g).connect(master);
      osc.start();
      lfo.start();
      nodes.push(osc, lfo);
    });
    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);
    return true;
  }

  function stop() {
    if (!ctx) return;
    const c = ctx;
    try {
      master.gain.cancelScheduledValues(c.currentTime);
      master.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
    } catch {
      // abaikan
    }
    setTimeout(() => {
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          // sudah berhenti
        }
      });
      c.close().catch(() => {});
    }, 900);
    ctx = null;
    master = null;
    nodes = [];
  }

  return { start, stop, get playing() { return ctx != null; } };
}
