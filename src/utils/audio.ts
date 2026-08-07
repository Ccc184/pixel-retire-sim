// ============================================================
// 像素退休模拟器 · 音频引擎（Web Audio API / 程序化音效）
// ------------------------------------------------------------
// 设计目标：
// 1. 零外部音频资源，全部用 Web Audio 振荡器实时合成，体积零增加、离线可用。
// 2. 音效：点击、翻页、购买、成就、危机、里程碑、盲盒揭晓、退休、结局号角等。
// 3. 静音控制：全局 masterGain，一条命令静音/恢复。
//
// 注意：
// - AudioContext 需在用户手势（点击 start）后创建/恢复，规避浏览器自动播放策略。
// - 背景音乐（BGM）已停用：用户反馈"又吵又难听"，故关闭音乐调度器，仅保留音效。
//   startMusic/stopMusic/isMusicPlaying 保留导出以兼容调用点，均为空操作。
// ============================================================

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return null;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** 供首帧用户手势后调用：解锁音频 */
export function ensureAudio(): void {
  getCtx();
}

/** 全局静音/恢复 */
export function setAudioMuted(m: boolean): void {
  muted = m;
  if (masterGain) masterGain.gain.setTargetAtTime(m ? 0 : 1, audioCtx!.currentTime, 0.02);
}
export function isAudioMuted(): boolean {
  return muted;
}
export function toggleAudioMuted(): boolean {
  setAudioMuted(!muted);
  return muted;
}

// ---- 单音符播放（用于 SFX） ----
function tone(opts: {
  freq: number; type?: OscillatorType; v?: number; dur?: number;
  freqEnd?: number; delay?: number; detune?: number;
}): void {
  const ctx = getCtx();
  if (!ctx || !masterGain) return;
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(masterGain);
  osc.type = opts.type ?? 'square';
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t0 + (opts.dur ?? 0.2));
  if (opts.detune) osc.detune.value = opts.detune;
  const vol = (opts.v ?? 0.12) * (muted ? 0 : 1);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + (opts.dur ?? 0.2));
  osc.start(t0);
  osc.stop(t0 + (opts.dur ?? 0.2) + 0.02);
}

// ============================================================
// 一部基础音效（保留原有）
// ============================================================
export function playClick(): void {
  tone({ freq: 800, freqEnd: 200, dur: 0.1, v: 0.15 });
}
export function playDing(): void {
  tone({ freq: 1200, freqEnd: 800, dur: 0.4, v: 0.2, type: 'sine' });
}
export function playBuzz(): void {
  tone({ freq: 150, freqEnd: 80, dur: 0.3, v: 0.1, type: 'sawtooth' });
}
export function playTurn(): void {
  const ctx = getCtx();
  if (!ctx || !masterGain) return;
  const bufferSize = Math.floor(ctx.sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * (muted ? 0 : 0.15);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(masterGain);
  src.start(ctx.currentTime);
}
export function playConfirm(): void {
  tone({ freq: 440, dur: 0.1, v: 0.12 }); tone({ freq: 660, dur: 0.1, v: 0.12, delay: 0.1 });
}
export function playSelect(): void {
  tone({ freq: 600, dur: 0.05, v: 0.1 }); tone({ freq: 900, dur: 0.05, v: 0.1, delay: 0.05 });
}
export function playAchievement(): void {
  [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.15, v: 0.1, delay: i * 0.08 }));
}
export function playBigGain(): void {
  tone({ freq: 400, freqEnd: 1200, dur: 0.4, v: 0.12 });
}
export function playBigLoss(): void {
  tone({ freq: 400, freqEnd: 80, dur: 0.5, v: 0.12, type: 'sawtooth' });
}

// ============================================================
// 新增场景音效
// ============================================================
/** 盲盒揭晓：神秘上滑 + 落定和弦 */
export function playBlindboxReveal(): void {
  tone({ freq: 300, freqEnd: 900, dur: 0.35, v: 0.1, type: 'triangle' });
  tone({ freq: 600, dur: 0.12, v: 0.08, delay: 0.32, type: 'square' });
  tone({ freq: 900, dur: 0.2, v: 0.1, delay: 0.42, type: 'square' });
  tone({ freq: 1200, dur: 0.3, v: 0.1, delay: 0.52, type: 'square' });
}

/** 退休按钮脉冲：温暖上扬，象征"自由" */
export function playRetirePulse(): void {
  [523, 659, 784, 1047, 1319].forEach((f, i) =>
    tone({ freq: f, dur: 0.25, v: 0.09, delay: i * 0.09, type: 'triangle' }));
}

/** 结局号角：庄严，区分成功/失败 */
export function playEnding(success: boolean): void {
  if (success) {
    const chord = [523, 659, 784, 1047];
    chord.forEach((f, i) => tone({ freq: f, dur: 0.8, v: 0.1, delay: i * 0.06, type: 'triangle' }));
    tone({ freq: 1319, dur: 1.2, v: 0.08, delay: 0.3, type: 'triangle' });
  } else {
    [392, 370, 349, 330].forEach((f, i) => tone({ freq: f, dur: 0.6, v: 0.1, delay: i * 0.12, type: 'sawtooth' }));
  }
}

/** 危机警报：急促双音 */
export function playCrisis(): void {
  for (let i = 0; i < 4; i++)
    tone({ freq: i % 2 ? 500 : 420, dur: 0.12, v: 0.12, delay: i * 0.16, type: 'square' });
}

/** 里程碑：静穆上升两音 */
export function playMilestone(): void {
  tone({ freq: 392, dur: 0.3, v: 0.1, type: 'triangle' });
  tone({ freq: 523, dur: 0.5, v: 0.1, delay: 0.15, type: 'triangle' });
}

/** 突破/大事件：明亮分解和弦 */
export function playBreakthrough(): void {
  [659, 784, 988, 1319].forEach((f, i) => tone({ freq: f, dur: 0.18, v: 0.1, delay: i * 0.06 }));
}

// ============================================================
// 补足音效
// ============================================================
/** 选项悬停：极轻的细碎tick */
export function playHover(): void {
  tone({ freq: 1400, freqEnd: 1800, dur: 0.04, v: 0.04, type: 'sine' });
}

/** 城市迁徙：呼啸过渡（噪声下滑 + 上滑） */
export function playCityTravel(): void {
  const ctx = getCtx();
  if (!ctx || !masterGain) return;
  const dur = 0.5;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const p = i / d.length;
    d[i] = (Math.random() * 2 - 1) * (1 - p) * (muted ? 0 : 0.12) * (0.5 + 0.5 * Math.sin(Math.PI * p));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + dur);
  filter.Q.value = 1.5;
  src.connect(filter); filter.connect(masterGain);
  src.start(ctx.currentTime);
  tone({ freq: 300, freqEnd: 900, dur: 0.4, v: 0.06, delay: 0.05, type: 'triangle' });
}

/** 结婚：温暖大调和弦（喜庆） */
export function playWedding(): void {
  [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.5, v: 0.09, delay: i * 0.05, type: 'triangle' }));
  tone({ freq: 1319, dur: 0.8, v: 0.07, delay: 0.25, type: 'triangle' });
}

/** 生子：可爱上行琶音 */
export function playBaby(): void {
  [523, 587, 659, 784, 988].forEach((f, i) => tone({ freq: f, dur: 0.16, v: 0.09, delay: i * 0.09, type: 'triangle' }));
}

/** 失业：低沉下行，略带压抑 */
export function playUnemployed(): void {
  [330, 311, 294, 262].forEach((f, i) => tone({ freq: f, dur: 0.35, v: 0.1, delay: i * 0.12, type: 'sawtooth' }));
}

/** 再就业：希望上行 */
export function playReemployed(): void {
  [262, 330, 392, 523].forEach((f, i) => tone({ freq: f, dur: 0.2, v: 0.09, delay: i * 0.08, type: 'triangle' }));
}

/** 副业启动：积极上扬号角 */
export function playSideHustle(): void {
  [392, 494, 587, 784].forEach((f, i) => tone({ freq: f, dur: 0.18, v: 0.09, delay: i * 0.07, type: 'square' }));
}

// ============================================================
// 音乐系统（BGM 已停用：用户反馈又吵又难听，关闭背景音乐，仅保留音效）
// startMusic/stopMusic/isMusicPlaying 保留导出以兼容调用点，均为空操作。
// ============================================================
export function startMusic(_songId: string): void {}
export function stopMusic(): void {}
export function isMusicPlaying(_songId: string): boolean { return false; }