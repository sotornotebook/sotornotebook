// Ambient alley soundscape, synthesised with WebAudio so there is nothing to
// download: a soft drone, oud-like plucks in maqam Hijaz, and distant crickets.
// To use a recorded track instead, put it at /public/audio/ambient.mp3 and set
// AMBIENT_URL below.
const AMBIENT_URL: string | null = null;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | null = null;
let el: HTMLAudioElement | null = null;

// D Hijaz: D Eb F# G A Bb C D (Hz)
const HIJAZ = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66];

function pluck(c: AudioContext, out: AudioNode, freq: number, when: number, vel = 1) {
  const o1 = c.createOscillator();
  const o2 = c.createOscillator();
  o1.type = 'sawtooth';
  o2.type = 'triangle';
  o1.frequency.value = freq;
  o2.frequency.value = freq * 2.003;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(2400, when);
  f.frequency.exponentialRampToValueAtTime(500, when + 0.6);
  f.Q.value = 2;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(0.16 * vel, when + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
  o1.connect(f);
  o2.connect(f);
  f.connect(g).connect(out);
  o1.start(when);
  o2.start(when);
  o1.stop(when + 1.5);
  o2.stop(when + 1.5);
}

function startSynth() {
  ctx = ctx ?? new AudioContext();
  const c = ctx;
  void c.resume();
  master = c.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.5, c.currentTime + 2);
  const verb = c.createDelay();
  verb.delayTime.value = 0.23;
  const fb = c.createGain();
  fb.gain.value = 0.28;
  verb.connect(fb).connect(verb);
  verb.connect(master);
  master.connect(c.destination);

  // drone
  for (const [f, v] of [[73.42, 0.05], [110, 0.02]] as const) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = v;
    o.connect(g).connect(master);
    o.start();
  }

  // crickets: a high tone gated by a fast LFO, swelling slowly
  const cr = c.createOscillator();
  cr.frequency.value = 4300;
  const crGate = c.createGain();
  crGate.gain.value = 0;
  const lfo = c.createOscillator();
  lfo.type = 'square';
  lfo.frequency.value = 28;
  const lfoAmt = c.createGain();
  lfoAmt.gain.value = 0.006;
  lfo.connect(lfoAmt).connect(crGate.gain);
  cr.connect(crGate).connect(master);
  cr.start();
  lfo.start();

  // phrases of plucks
  let step = 3;
  const loop = () => {
    if (!ctx || !master) return;
    const now = c.currentTime + 0.05;
    const n = 2 + Math.floor(Math.random() * 4);
    let t = now;
    for (let i = 0; i < n; i++) {
      step = Math.max(0, Math.min(HIJAZ.length - 1, step + Math.round((Math.random() - 0.5) * 3)));
      pluck(c, master, HIJAZ[step], t, 0.6 + Math.random() * 0.4);
      pluck(c, verb, HIJAZ[step], t, 0.25);
      t += 0.22 + Math.random() * 0.35;
    }
    timer = window.setTimeout(loop, (t - now) * 1000 + 1200 + Math.random() * 2200);
  };
  loop();
}

export function setAmbient(on: boolean) {
  if (AMBIENT_URL) {
    el = el ?? Object.assign(new Audio(AMBIENT_URL), { loop: true, volume: 0.5 });
    if (on) void el.play().catch(() => {});
    else el.pause();
    return;
  }
  if (on) {
    if (!master) startSynth();
  } else if (ctx && master) {
    const m = master;
    m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    if (timer) clearTimeout(timer);
    timer = null;
    master = null;
    const c = ctx;
    ctx = null;
    setTimeout(() => void c.close(), 500);
  }
}
