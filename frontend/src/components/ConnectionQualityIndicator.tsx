/**
 * ConnectionQualityIndicator - Component for displaying network connection quality
 * Uses Navigator.connection API and WebRTC stats where available
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Tooltip,
  Typography,
  Paper,
  Collapse,
  IconButton,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  SignalCellular4Bar as ExcellentIcon,
  SignalCellular3Bar as GoodIcon,
  SignalCellular2Bar as FairIcon,
  SignalCellular1Bar as PoorIcon,
  SignalCellular0Bar as NoSignalIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Speed as SpeedIcon,
  Timer as LatencyIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export type ConnectionStrength = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface ConnectionQuality {
  strength: ConnectionStrength;
  latency: number | null; // milliseconds
  downlink: number | null; // Mbps
  uplink: number | null; // Mbps (estimated)
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  rtt: number | null; // round-trip time in ms
  packetLoss: number | null; // percentage
  jitter: number | null; // milliseconds
  saveData: boolean;
}

export interface ConnectionQualityIndicatorProps {
  /** Optional WebRTC peer connection for detailed stats */
  peerConnection?: RTCPeerConnection;
  /** Whether to show expanded details by default */
  showExpanded?: boolean;
  /** Warning threshold for latency (ms) */
  latencyWarningThreshold?: number;
  /** Critical threshold for latency (ms) */
  latencyCriticalThreshold?: number;
  /** Callback when quality changes significantly */
  onQualityChange?: (quality: ConnectionQuality) => void;
  /** Poll interval for connection stats (ms) */
  pollInterval?: number;
}

const ConnectionQualityIndicator: React.FC<ConnectionQualityIndicatorProps> = ({
  peerConnection,
  showExpanded = false,
  latencyWarningThreshold = 150,
  latencyCriticalThreshold = 300,
  onQualityChange,
  pollInterval = 2000
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(showExpanded);
  const [quality, setQuality] = useState<ConnectionQuality>({
    strength: 'unknown' as ConnectionStrength,
    latency: null,
    downlink: null,
    uplink: null,
    effectiveType: 'unknown',
    rtt: null,
    packetLoss: null,
    jitter: null,
    saveData: false
  });
  const [previousStrength, setPreviousStrength] = useState<ConnectionStrength | null>(null);

  /**
   * Map effective type to connection strength
   */
  const mapEffectiveType = useCallback((
    effectiveType: string,
    rtt: number | null
  ): ConnectionStrength => {
    // First check if we're offline
    if (!navigator.onLine) {
      return 'offline';
    }

    // Use RTT if available for more accurate assessment
    if (rtt !== null) {
      if (rtt < 50) return 'excellent';
      if (rtt < 100) return 'good';
      if (rtt < 200) return 'fair';
      return 'poor';
    }

    // Fall back to effective type
    switch (effectiveType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
        return 'fair';
      case 'slow-2g':
        return 'poor';
      default:
        return 'good'; // Assume good if unknown
    }
  }, []);

  /**
   * Get connection quality from Navigator.connection API
   */
  const getConnectionQuality = useCallback((): Partial<ConnectionQuality> => {
    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) {
      return {
        effectiveType: 'unknown',
        downlink: null,
        rtt: null,
        saveData: false
      };
    }

    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false
    };
  }, []);

  /**
   * Get WebRTC stats for packet loss and jitter
   */
  const getWebRTCStats = useCallback(async (): Promise<Partial<ConnectionQuality>> => {
    if (!peerConnection) {
      return { packetLoss: null, jitter: null, uplink: null };
    }

    try {
      const stats = await peerConnection.getStats();
      let packetLoss = 0;
      let jitter = 0;
      let packetsLost = 0;
      let packetsSent = 0;
      let roundTripTime = 0;
      let statsCount = 0;

      stats.forEach((report) => {
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          if (report.packetsSent) {
            packetsSent = report.packetsSent;
          }
        }
        if (report.type === 'remote-inbound-rtp') {
          if (report.packetsLost) {
            packetsLost = report.packetsLost;
          }
          if (report.jitter) {
            jitter += report.jitter * 1000; // Convert to ms
            statsCount++;
          }
          if (report.roundTripTime) {
            roundTripTime = report.roundTripTime * 1000; // Convert to ms
          }
        }
      });

      // Calculate packet loss percentage
      if (packetsSent > 0) {
        packetLoss = (packetsLost / (packetsSent + packetsLost)) * 100;
      }

      // Average jitter
      if (statsCount > 0) {
        jitter = jitter / statsCount;
      }

      return {
        packetLoss: packetLoss > 0 ? Math.round(packetLoss * 10) / 10 : null,
        jitter: jitter > 0 ? Math.round(jitter) : null,
        latency: roundTripTime > 0 ? Math.round(roundTripTime) : null
      };
    } catch (error) {
      console.error('Failed to get WebRTC stats:', error);
      return { packetLoss: null, jitter: null };
    }
  }, [peerConnection]);

  /**
   * Update connection quality
   */
  const updateQuality = useCallback(async () => {
    const connectionInfo = getConnectionQuality();
    const webrtcStats = await getWebRTCStats();

    const latency = webrtcStats.latency ?? connectionInfo.rtt ?? null;
    const strength = mapEffectiveType(connectionInfo.effectiveType || 'unknown', latency);

    const newQuality: ConnectionQuality = {
      strength,
      latency,
      downlink: connectionInfo.downlink ?? null,
      uplink: webrtcStats.uplink ?? null,
      effectiveType: connectionInfo.effectiveType ?? 'unknown',
      rtt: connectionInfo.rtt ?? null,
      packetLoss: webrtcStats.packetLoss ?? null,
      jitter: webrtcStats.jitter ?? null,
      saveData: connectionInfo.saveData ?? false
    };

    setQuality(newQuality);

    // Notify if strength changed significantly
    if (previousStrength !== null && previousStrength !== strength) {
      onQualityChange?.(newQuality);
    }
    setPreviousStrength(strength);
  }, [getConnectionQuality, getWebRTCStats, mapEffectiveType, previousStrength, onQualityChange]);

  // Set up polling for connection quality
  useEffect(() => {
    updateQuality();
    const interval = setInterval(updateQuality, pollInterval);

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateQuality);
    }

    // Listen for online/offline events
    window.addEventListener('online', updateQuality);
    window.addEventListener('offline', updateQuality);

    return () => {
      clearInterval(interval);
      if (connection) {
        connection.removeEventListener('change', updateQuality);
      }
      window.removeEventListener('online', updateQuality);
      window.removeEventListener('offline', updateQuality);
    };
  }, [updateQuality, pollInterval]);

  /**
   * Get icon and color for connection strength
   */
  const getStrengthIndicator = () => {
    switch (quality.strength) {
      case 'excellent':
        return { icon: ExcellentIcon, color: theme.palette.success.main, label: 'Excellent' };
      case 'good':
        return { icon: GoodIcon, color: theme.palette.success.light, label: 'Good' };
      case 'fair':
        return { icon: FairIcon, color: theme.palette.warning.main, label: 'Fair' };
      case 'poor':
        return { icon: PoorIcon, color: theme.palette.error.main, label: 'Poor' };
      case 'offline':
        return { icon: NoSignalIcon, color: theme.palette.error.dark, label: 'Offline' };
      default:
        return { icon: GoodIcon, color: theme.palette.grey[500], label: 'Unknown' };
    }
  };

  const { icon: StrengthIcon, color, label } = getStrengthIndicator();

  /**
   * Get latency warning status
   */
  const getLatencyStatus = () => {
    if (quality.latency === null) return 'unknown';
    if (quality.latency < latencyWarningThreshold) return 'good';
    if (quality.latency < latencyCriticalThreshold) return 'warning';
    return 'critical';
  };

  const latencyStatus = getLatencyStatus();

  return (
    <Box>
      {/* Compact indicator */}
      <Box display="flex" alignItems="center" gap={0.5}>
        <Tooltip
          title={
            <Box>
              <Typography variant="body2" fontWeight={600}>{label} Connection</Typography>
              {quality.latency !== null && (
                <Typography variant="caption">Latency: {quality.latency}ms</Typography>
              )}
              {quality.downlink !== null && (
                <Typography variant="caption" display="block">
                  Download: {quality.downlink} Mbps
                </Typography>
              )}
            </Box>
          }
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 0.5,
              borderRadius: 1,
              '&:hover': { bgcolor: alpha(color, 0.1) }
            }}
            onClick={() => setExpanded(!expanded)}
          >
            <StrengthIcon sx={{ color, fontSize: 20 }} />
            {latencyStatus === 'critical' && (
              <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 14, ml: -0.5 }} />
            )}
          </Box>
        </Tooltip>

        <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ p: 0.25 }}>
          {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Expanded details */}
      <Collapse in={expanded}>
        <Paper
          variant="outlined"
          sx={{
            mt: 1,
            p: 1.5,
            minWidth: 200
          }}
        >
          {/* Strength */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="caption" color="text.secondary">Connection</Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <StrengthIcon sx={{ color, fontSize: 16 }} />
              <Typography variant="body2" fontWeight={500} sx={{ color }}>
                {label}
              </Typography>
            </Box>
          </Box>

          {/* Latency */}
          {quality.latency !== null && (
            <Box mb={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <LatencyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Latency</Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: latencyStatus === 'critical'
                      ? theme.palette.error.main
                      : latencyStatus === 'warning'
                        ? theme.palette.warning.main
                        : theme.palette.success.main
                  }}
                >
                  {quality.latency}ms
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (quality.latency / latencyCriticalThreshold) * 100)}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.grey[500], 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: latencyStatus === 'critical'
                      ? theme.palette.error.main
                      : latencyStatus === 'warning'
                        ? theme.palette.warning.main
                        : theme.palette.success.main
                  }
                }}
              />
            </Box>
          )}

          {/* Download speed */}
          {quality.downlink !== null && (
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <SpeedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">Download</Typography>
              </Box>
              <Typography variant="body2">{quality.downlink} Mbps</Typography>
            </Box>
          )}

          {/* Packet loss */}
          {quality.packetLoss !== null && quality.packetLoss > 0 && (
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Packet Loss</Typography>
              <Typography
                variant="body2"
                sx={{
                  color: quality.packetLoss > 5
                    ? theme.palette.error.main
                    : quality.packetLoss > 2
                      ? theme.palette.warning.main
                      : theme.palette.text.primary
                }}
              >
                {quality.packetLoss}%
              </Typography>
            </Box>
          )}

          {/* Jitter */}
          {quality.jitter !== null && (
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Jitter</Typography>
              <Typography variant="body2">{quality.jitter}ms</Typography>
            </Box>
          )}

          {/* Network type */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">Network</Typography>
            <Typography variant="body2" textTransform="uppercase">
              {quality.effectiveType}
            </Typography>
          </Box>

          {/* Data saver warning */}
          {quality.saveData && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
              }}
            >
              <Typography variant="caption" color="warning.main">
                Data Saver is enabled. Recording quality may be reduced.
              </Typography>
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

export default ConnectionQualityIndicator;
