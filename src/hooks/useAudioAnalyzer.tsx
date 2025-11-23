import { useEffect, useRef, useState } from 'react';

interface AudioAnalysis {
  energy: number; // 0-1
  bpm: number;
  frequency: number;
  isHighEnergy: boolean;
}

export function useAudioAnalyzer(audioElement: HTMLAudioElement | null) {
  const [analysis, setAnalysis] = useState<AudioAnalysis>({
    energy: 0,
    bpm: 120,
    frequency: 0,
    isHighEnergy: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    try {
      // Create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Create analyzer
      if (!analyzerRef.current) {
        analyzerRef.current = audioContext.createAnalyser();
        analyzerRef.current.fftSize = 256;
      }

      const analyzer = analyzerRef.current;

      // Create source if not exists
      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyzer);
        analyzer.connect(audioContext.destination);
      }

      // Analyze audio
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyze = () => {
        analyzer.getByteFrequencyData(dataArray);

        // Calculate energy (average of all frequencies)
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        const energy = average / 255;

        // Estimate BPM (simplified - would need more sophisticated detection)
        const lowFreq = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
        const estimatedBPM = Math.round(60 + (lowFreq / 255) * 120);

        // Determine if high energy (threshold at 0.5)
        const isHighEnergy = energy > 0.5;

        // Get dominant frequency
        const maxIndex = dataArray.indexOf(Math.max(...Array.from(dataArray)));
        const frequency = (maxIndex / bufferLength) * (audioContext.sampleRate / 2);

        setAnalysis({
          energy,
          bpm: estimatedBPM,
          frequency,
          isHighEnergy
        });

        animationFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();

    } catch (error) {
      console.error('Error setting up audio analyzer:', error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioElement]);

  return analysis;
}
