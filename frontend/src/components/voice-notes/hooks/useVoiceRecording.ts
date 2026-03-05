/**
 * useVoiceRecording Hook
 * Handles audio recording with MediaRecorder, waveform data generation,
 * and pause/resume functionality
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseVoiceRecordingOptions {
  onAudioData?: (data: Float32Array) => void;
  maxDuration?: number; // seconds
  audioConstraints?: MediaTrackConstraints;
  sampleRate?: number;
}

export interface UseVoiceRecordingReturn {
  // State
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: Error | null;
  hasPermission: boolean | null;

  // Waveform data
  waveformData: Float32Array;
  volumeLevel: number;

  // Actions
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
  requestPermission: () => Promise<boolean>;
}

const SAMPLE_SIZE = 128;

export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const { maxDuration, audioConstraints, onAudioData } = options;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [waveformData, setWaveformData] = useState<Float32Array>(
    new Float32Array(SAMPLE_SIZE)
  );
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Auto-stop when max duration reached
  useEffect(() => {
    if (maxDuration && duration >= maxDuration && isRecording && !isPaused) {
      stopRecording();
    }
  }, [duration, maxDuration, isRecording, isPaused]);

  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints || {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      setHasPermission(false);
      const message = err instanceof Error ? err.message : 'Permission denied';
      setError(new Error(`Microphone permission denied: ${message}`));
      return false;
    }
  }, [audioConstraints]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !isRecording || isPaused) return;

    const dataArray = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    // Downsample to SAMPLE_SIZE
    const downsampled = new Float32Array(SAMPLE_SIZE);
    const blockSize = Math.floor(dataArray.length / SAMPLE_SIZE);

    for (let i = 0; i < SAMPLE_SIZE; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(dataArray[i * blockSize + j]);
      }
      downsampled[i] = sum / blockSize;
    }

    setWaveformData(downsampled);

    // Calculate volume level (RMS)
    let rms = 0;
    for (let i = 0; i < dataArray.length; i++) {
      rms += dataArray[i] * dataArray[i];
    }
    rms = Math.sqrt(rms / dataArray.length);
    setVolumeLevel(Math.min(1, rms * 3)); // Scale and clamp

    if (onAudioData) {
      onAudioData(downsampled);
    }

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, [isRecording, isPaused, onAudioData]);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      setError(null);
      chunksRef.current = [];
      setAudioBlob(null);
      // Revoke previous object URL to prevent memory leak
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);
      setDuration(0);
      pausedDurationRef.current = 0;

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints || {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;
      setHasPermission(true);

      // Set up audio analysis for waveform
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.onerror = (event) => {
        setError(new Error('Recording error: ' + (event as any).error?.message));
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();

      // Start duration timer (uses ref to avoid stale closure)
      isPausedRef.current = false;
      durationIntervalRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setDuration(Math.floor(elapsed + pausedDurationRef.current));
        }
      }, 100);

      // Start waveform animation
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(new Error(message));
      setHasPermission(err instanceof Error && err.name === 'NotAllowedError' ? false : null);
      cleanup();
    }
  }, [audioConstraints, audioUrl, cleanup, updateWaveform]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      isPausedRef.current = true;
      pausedDurationRef.current += (Date.now() - startTimeRef.current) / 1000;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      isPausedRef.current = false;
      startTimeRef.current = Date.now();

      // Resume waveform animation
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }
  }, [isRecording, isPaused, updateWaveform]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      const recorder = mediaRecorderRef.current;

      recorder.onstop = () => {
        const mimeType = recorder.mimeType;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        setIsPaused(false);
        cleanup();
        resolve(blob);
      };

      recorder.stop();
    });
  }, [isRecording, cleanup]);

  const resetRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setError(null);
    setWaveformData(new Float32Array(SAMPLE_SIZE));
    setVolumeLevel(0);
    chunksRef.current = [];
    pausedDurationRef.current = 0;
  }, [audioUrl, cleanup]);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    hasPermission,
    waveformData,
    volumeLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    requestPermission,
  };
}

export default useVoiceRecording;
