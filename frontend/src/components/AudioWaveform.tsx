/**
 * AudioWaveform - Real-time audio visualization component
 * Uses Web Audio API to display waveform during recording
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';

export interface AudioWaveformProps {
  /** MediaStream from recording - when provided, visualizes live audio */
  stream: MediaStream | null;
  /** Whether recording is active - controls animation */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused?: boolean;
  /** Width of the canvas in pixels */
  width?: number;
  /** Height of the canvas in pixels */
  height?: number;
  /** Visualization style */
  variant?: 'waveform' | 'bars' | 'circular';
  /** Color for the visualization (defaults to theme primary) */
  color?: string;
  /** Background color (defaults to transparent) */
  backgroundColor?: string;
  /** Number of bars for bar visualization */
  barCount?: number;
  /** Line width for waveform visualization */
  lineWidth?: number;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  stream,
  isRecording,
  isPaused = false,
  width = 300,
  height = 80,
  variant = 'waveform',
  color,
  backgroundColor = 'transparent',
  barCount = 64,
  lineWidth = 2,
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const visualColor = color || theme.palette.primary.main;

  // Initialize audio analysis
  const initializeAudio = useCallback(() => {
    if (!stream) return;

    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();

      // Create analyser node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = variant === 'bars' ? barCount * 4 : 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Connect stream to analyser
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      // Create data array for frequency/time data
      const bufferLength = variant === 'bars'
        ? analyserRef.current.frequencyBinCount
        : analyserRef.current.fftSize;
      dataArrayRef.current = new Uint8Array(bufferLength);

    } catch (error) {
      console.error('Failed to initialize audio visualization:', error);
    }
  }, [stream, variant, barCount]);

  // Draw waveform visualization
  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array) => {
    const bufferLength = dataArray.length;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = visualColor;
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [width, height, lineWidth, visualColor]);

  // Draw bar visualization
  const drawBars = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array) => {
    const bufferLength = Math.min(dataArray.length, barCount);
    const barWidth = width / bufferLength;
    const barGap = 2;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      const x = i * barWidth;
      const y = height - barHeight;

      // Gradient from primary to primary light
      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, visualColor);
      gradient.addColorStop(1, theme.palette.primary.light);

      ctx.fillStyle = gradient;
      ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight);
    }
  }, [width, height, barCount, visualColor, theme.palette.primary.light]);

  // Draw circular visualization
  const drawCircular = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const bufferLength = Math.min(dataArray.length, 180);

    ctx.beginPath();
    ctx.strokeStyle = visualColor;
    ctx.lineWidth = lineWidth;

    for (let i = 0; i < bufferLength; i++) {
      const angle = (i / bufferLength) * Math.PI * 2;
      const amplitude = (dataArray[i] / 255) * (radius * 0.5);
      const r = radius + amplitude;

      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = isRecording && !isPaused ? theme.palette.error.main : theme.palette.grey[400];
    ctx.fill();
  }, [width, height, lineWidth, visualColor, isRecording, isPaused, theme]);

  // Draw idle state
  const drawIdle = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = theme.palette.grey[400];
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw small pulse if paused
    if (isPaused) {
      ctx.fillStyle = theme.palette.warning.main;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [width, height, lineWidth, isPaused, theme]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // If not recording or no analyser, draw idle state
    if (!isRecording || isPaused || !analyserRef.current || !dataArrayRef.current) {
      drawIdle(ctx);
      if (isRecording && !isPaused) {
        animationRef.current = requestAnimationFrame(animate);
      }
      return;
    }

    // Get audio data
    const dataArray = dataArrayRef.current! as Uint8Array<ArrayBuffer>;
    if (variant === 'bars') {
      analyserRef.current.getByteFrequencyData(dataArray);
    } else {
      analyserRef.current.getByteTimeDomainData(dataArray);
    }

    // Draw based on variant
    switch (variant) {
      case 'waveform':
        drawWaveform(ctx, dataArray);
        break;
      case 'bars':
        drawBars(ctx, dataArray);
        break;
      case 'circular':
        drawCircular(ctx, dataArray);
        break;
    }

    // Continue animation
    animationRef.current = requestAnimationFrame(animate);
  }, [
    isRecording,
    isPaused,
    variant,
    width,
    height,
    backgroundColor,
    drawWaveform,
    drawBars,
    drawCircular,
    drawIdle,
  ]);

  // Initialize audio when stream changes
  useEffect(() => {
    if (stream && isRecording) {
      initializeAudio();
    }

    return () => {
      // Cleanup audio context
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [stream, isRecording, initializeAudio]);

  // Start/stop animation
  useEffect(() => {
    if (isRecording) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Draw idle state when stopped
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        drawIdle(ctx);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, animate, width, height, backgroundColor, drawIdle]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: backgroundColor === 'transparent' ? 'grey.100' : backgroundColor,
        p: 1,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          borderRadius: 4,
        }}
      />
    </Box>
  );
};

export default AudioWaveform;
