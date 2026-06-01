export type MicrophoneCheck = {
  stream: MediaStream;
  level: number;
};

export async function ensureMicrophoneAccess(): Promise<MicrophoneCheck> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support microphone capture.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  const level = await sampleMicrophoneLevel(stream);
  return { stream, level };
}

function sampleMicrophoneLevel(stream: MediaStream): Promise<number> {
  return new Promise((resolve) => {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      resolve(0);
      return;
    }

    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    window.setTimeout(() => {
      analyser.getByteTimeDomainData(data);
      const sum = data.reduce((total, value) => total + Math.abs(value - 128), 0);
      source.disconnect();
      void context.close();
      resolve(Math.min(1, sum / data.length / 24));
    }, 450);
  });
}
