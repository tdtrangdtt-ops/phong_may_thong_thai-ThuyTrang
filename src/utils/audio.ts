// Web Audio API Synthesizer for high-fidelity interactive sound effects

let audioCtx: AudioContext | null = null;
let fanNode: OscillatorNode | null = null;
let fanGainNode: GainNode | null = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Play standard BIOS Beep (high short tít sound)
export function playBIOSBeep() {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, ctx.currentTime); // 1000Hz tít

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

// 2. Play Click sound (for mouse or buttons)
export function playMouseClick() {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(2000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.warn(e);
  }
}

// 3. Play Keyboard Tap sound
export function playKeyboardTap() {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.warn(e);
  }
}

// 4. Start Computer Case Fan Whir (low hum, runs when case is on)
export function startComputerHum() {
  try {
    const ctx = initAudio();
    if (fanNode) return; // Already running

    fanNode = ctx.createOscillator();
    fanGainNode = ctx.createGain();

    fanNode.type = "sawtooth";
    fanNode.frequency.setValueAtTime(60, ctx.currentTime); // Low hum (60Hz)

    // Low-pass filter to make it sound muffled like a fan
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(150, ctx.currentTime);

    // Subtle volume hum
    fanGainNode.gain.setValueAtTime(0.0, ctx.currentTime);
    fanGainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.0); // fade in

    fanNode.connect(filter);
    filter.connect(fanGainNode);
    fanGainNode.connect(ctx.destination);

    fanNode.start();
  } catch (e) {
    console.warn(e);
  }
}

// Stop Computer Hum
export function stopComputerHum() {
  try {
    if (fanNode && fanGainNode && audioCtx) {
      const currentGain = fanGainNode.gain.value;
      fanGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      fanGainNode.gain.setValueAtTime(currentGain, audioCtx.currentTime);
      fanGainNode.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.5); // fade out

      const oldNode = fanNode;
      setTimeout(() => {
        try {
          oldNode.stop();
          oldNode.disconnect();
        } catch (e) {}
      }, 600);

      fanNode = null;
      fanGainNode = null;
    }
  } catch (e) {
    console.warn(e);
  }
}

// 5. Success Jingle (gorgeous happy scale)
export function playSuccessJingle() {
  try {
    const ctx = initAudio();
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const durations = [0.1, 0.1, 0.1, 0.3];
    let time = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durations[i]);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + durations[i]);

      time += 0.08;
    });
  } catch (e) {
    console.warn(e);
  }
}

// 6. Failure / Sad buzz sound
export function playFailureBuzzer() {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn(e);
  }
}

// 7. Spark Short Circuit Zap ("sẹt sẹt" static sound)
export function playSparkShortCircuit() {
  try {
    const ctx = initAudio();
    const bufferSize = ctx.sampleRate * 0.35; // 0.35 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise for spark static
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    // Rapid crackle amplitude modulation
    for (let t = 0; t < 0.35; t += 0.05) {
      gain.gain.setValueAtTime(Math.random() * 0.25, ctx.currentTime + t);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseNode.start();
    noiseNode.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn(e);
  }
}

// Map string sound names to play triggers
export function playSoundByName(name: string) {
  const n = name.toLowerCase();
  if (n.includes("success") || n.includes("jingle") || n.includes("win")) {
    playSuccessJingle();
  } else if (n.includes("beep") || n.includes("bios") || n.includes("tit")) {
    playBIOSBeep();
  } else if (n.includes("click") || n.includes("tick")) {
    playMouseClick();
  } else if (n.includes("tap") || n.includes("key") || n.includes("press")) {
    playKeyboardTap();
  } else if (n.includes("error") || n.includes("fail") || n.includes("squeak") || n.includes("buzzer")) {
    playFailureBuzzer();
  } else if (n.includes("spark") || n.includes("short") || n.includes("zap") || n.includes("electric")) {
    playSparkShortCircuit();
  } else if (n.includes("whir") || n.includes("hum") || n.includes("fan")) {
    startComputerHum();
  }
}
