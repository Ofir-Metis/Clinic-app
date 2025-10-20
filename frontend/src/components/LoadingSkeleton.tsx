import React from 'react';
import {
  Box,
  Skeleton,
  Card,
  CardContent,
  Stack,
  useTheme,
  alpha
} from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'dashboard' | 'form' | 'list' | 'profile' | 'card' | 'table' | 'calendar' | 'default';
  count?: number;
  height?: number | string;
  width?: number | string;
  animated?: boolean;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'default',
  count = 3,
  height = 'auto',
  width = '100%',
  animated = true,
  className
}) => {
  const theme = useTheme();

  const renderDashboardSkeleton = () => (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="text" width="40%" height={24} />
      </Stack>

      {/* Stats Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} sx={{ flex: 1 }}>
            <CardContent>
              <Skeleton variant="rectangular" height={80} />
              <Skeleton variant="text" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Charts/Content */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Card sx={{ flex: 2 }}>
          <CardContent>
            <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={300} />
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );

  const renderFormSkeleton = () => (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
            <Skeleton variant="text" width="70%" height={40} sx={{ mx: 'auto' }} />
            <Skeleton variant="text" width="50%" height={24} sx={{ mx: 'auto' }} />
          </Box>

          {/* Form Fields */}
          <Stack spacing={3}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            ))}
            <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );

  const renderListSkeleton = () => (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Skeleton variant="text" width="30%" height={40} />
        <Skeleton variant="rectangular" width={120} height={36} />
      </Stack>

      {/* List Items */}
      <Stack spacing={2}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={50} height={50} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="30%" height={18} />
                </Box>
                <Skeleton variant="rectangular" width={80} height={32} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );

  const renderProfileSkeleton = () => (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Skeleton variant="circular" width={120} height={120} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="text" width="80%" height={20} />
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            <Skeleton variant="rectangular" width={100} height={36} />
            <Skeleton variant="rectangular" width={80} height={36} />
          </Stack>
        </CardContent>
      </Card>

      {/* Profile Sections */}
      <Stack spacing={3}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="85%" />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );

  const renderCardSkeleton = () => (
    <Stack spacing={2}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Skeleton variant="circular" width={48} height={48} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" height={24} />
                <Skeleton variant="text" width="50%" height={20} />
              </Box>
            </Box>
            <Skeleton variant="rectangular" height={height || 120} sx={{ borderRadius: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const renderTableSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      {/* Table Header */}
      <Box sx={{ display: 'flex', gap: 2, p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="text" width="20%" height={24} />
        ))}
      </Box>
      {/* Table Rows */}
      {Array.from({ length: count }, (_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width="25%" />
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="text" width="15%" />
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="rectangular" width={80} height={28} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Box>
  );

  const renderCalendarSkeleton = () => (
    <Box sx={{ p: 3 }}>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={200} height={32} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2 }}>
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} variant="text" width="100%" height={24} sx={{ textAlign: 'center' }} />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {Array.from({ length: 35 }, (_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    </Box>
  );

  const renderDefaultSkeleton = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(0.8)',
              opacity: 0.5,
            },
            '50%': {
              transform: 'scale(1.2)',
              opacity: 1,
            },
            '100%': {
              transform: 'scale(0.8)',
              opacity: 0.5,
            },
          },
        }}
      />
      <Stack spacing={1} alignItems="center">
        <Skeleton variant="text" width={200} height={24} />
        <Skeleton variant="text" width={150} height={20} />
      </Stack>
    </Box>
  );

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className={className}
      sx={{
        width,
        height,
        ...(animated && {
          '& .MuiSkeleton-root': {
            animation: 'wave 1.6s ease-in-out 0.5s infinite',
            '&::after': {
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
            }
          }
        })
      }}
    >
      {(() => {
        switch (variant) {
          case 'dashboard':
            return renderDashboardSkeleton();
          case 'form':
            return renderFormSkeleton();
          case 'list':
            return renderListSkeleton();
          case 'profile':
            return renderProfileSkeleton();
          case 'card':
            return renderCardSkeleton();
          case 'table':
            return renderTableSkeleton();
          case 'calendar':
            return renderCalendarSkeleton();
          default:
            return renderDefaultSkeleton();
        }
      })()}
    </Box>
  );
};

export default LoadingSkeleton;