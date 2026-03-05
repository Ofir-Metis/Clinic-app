/**
 * VoiceNoteWaveform Component
 * Real-time audio waveform visualization using Canvas
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';

export interface VoiceNoteWaveformProps {
  data: Float32Array;
  isRecording?: boolean;
  isPaused?: boolean;
  width?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  backgroundColor?: string;
  style?: React.CSSProperties;
}

export const VoiceNoteWaveform: React.FC<VoiceNoteWaveformProps> = ({
  data,
  isRecording = false,
  isPaused = false,
  width = 300,
  height = 80,
  barWidth = 3,
  barGap = 2,
  barColor,
  backgroundColor,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  const colors = useMemo(() => ({
    bar: barColor || theme.palette.primary.main,
    barPaused: theme.palette.grey[400],
    background: backgroundColor || 'transparent',
  }), [barColor, backgroundColor, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Fill background
    if (colors.background !== 'transparent') {
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);
    }

    // Calculate bar count based on width
    const barCount = Math.floor(width / (barWidth + barGap));
    const centerY = height / 2;

    // Determine color based on state
    const currentColor = isPaused ? colors.barPaused : colors.bar;

    // Draw bars
    for (let i = 0; i < barCount; i++) {
      // Get data value (interpolate if needed)
      const dataIndex = Math.floor((i / barCount) * data.length);
      let value = data[dataIndex] || 0;

      // Scale value for visualization
      const minHeight = 4;
      const maxHeight = height * 0.8;
      const barHeight = Math.max(minHeight, value * maxHeight * 2);

      const x = i * (barWidth + barGap);
      const y = centerY - barHeight / 2;

      // Draw bar with rounded corners
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    }

    // Draw center line when not recording
    if (!isRecording && data.every(v => v === 0)) {
      ctx.strokeStyle = theme.palette.divider;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
    }
  }, [data, width, height, barWidth, barGap, colors, isRecording, isPaused, theme]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        overflow: 'hidden',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          maxWidth: width,
          height: 'auto',
        }}
      />
    </Box>
  );
};

export default VoiceNoteWaveform;
