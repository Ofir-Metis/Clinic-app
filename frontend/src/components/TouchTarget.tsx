import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface TouchTargetProps {
  children: React.ReactNode;
  minSize?: number;
  sx?: SxProps<Theme>;
  component?: React.ElementType;
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * TouchTarget component ensures minimum 48x48px touch targets for mobile accessibility
 * According to Material Design and WCAG guidelines
 */
const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  minSize = 48,
  sx = {},
  component = 'div',
  onClick,
  disabled = false,
  className,
  ...props
}) => {
  const touchTargetSx: SxProps<Theme> = {
    minWidth: minSize,
    minHeight: minSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: onClick && !disabled ? 'pointer' : 'inherit',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',

    // Ensure touch targets are properly spaced
    '&:not(:last-child)': {
      marginRight: 1,
    },

    // Add visual feedback for better UX
    '&:hover': onClick && !disabled ? {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      borderRadius: 1,
    } : {},

    // Active state for touch feedback
    '&:active': onClick && !disabled ? {
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      transform: 'scale(0.98)',
      transition: 'transform 0.1s ease',
    } : {},

    // Focus state for keyboard navigation
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: 2,
      borderRadius: 1,
    },

    // Merge with additional styles
    ...sx,
  };

  return (
    <Box
      component={component}
      sx={touchTargetSx}
      onClick={onClick}
      className={className}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </Box>
  );
};

export default TouchTarget;