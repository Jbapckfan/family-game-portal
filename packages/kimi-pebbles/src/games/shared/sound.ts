/* Tiny WebAudio synth for game feedback — no audio assets needed. */

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

function ac(): AudioContext | null {
  if (!enabled) return null
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.06) {
  const c = ac()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = c.currentTime + start
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export const sfx = {
  tap() {
    tone(520, 0, 0.07, 'triangle', 0.05)
  },
  remove() {
    tone(340, 0, 0.06, 'triangle', 0.04)
  },
  error() {
    tone(160, 0, 0.16, 'sawtooth', 0.045)
    tone(120, 0.05, 0.18, 'sawtooth', 0.04)
  },
  levelUp() {
    tone(440, 0, 0.1, 'triangle', 0.055)
    tone(554, 0.09, 0.1, 'triangle', 0.055)
    tone(659, 0.18, 0.16, 'triangle', 0.06)
  },
  win() {
    const notes = [523, 659, 784, 1047, 880, 1175]
    notes.forEach((n, i) => tone(n, i * 0.09, 0.18, 'triangle', 0.055))
  },
  hint() {
    tone(880, 0, 0.09, 'sine', 0.05)
    tone(1175, 0.08, 0.12, 'sine', 0.05)
  },
}
