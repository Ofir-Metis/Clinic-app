import React from 'react';
import { AppBar, Toolbar, Avatar, Typography, Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Displays a top application bar with avatars and the current month/year.
 * The bar respects the theme direction and has rounded bottom corners.
 */
export interface PageAppBarProps {
  /** Date used for the month/year title. Defaults to current date. */
  date?: Date;
  /** Avatars to display on the bar. */
  avatarUrls?: string[];
  /** MUI position prop */
  position?: 'fixed' | 'absolute' | 'sticky' | 'static' | 'relative';
}

const PageAppBar: React.FC<PageAppBarProps> = ({
  date = new Date(),
  avatarUrls = [],
  position = 'static',
}) => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';

  const title = date.toLocaleDateString(i18n.language, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <AppBar
      position={position}
      sx={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
    >
      <Toolbar sx={{ flexDirection: isRtl ? 'row-reverse' : 'row', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {avatarUrls.map((url, idx) => (
            <Avatar key={idx} src={url} />
          ))}
        </Box>
        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {title}
        </Typography>
        {/* Placeholder to balance layout */}
        <Box sx={{ visibility: 'hidden', display: 'flex', gap: 1 }}>
          {avatarUrls.map((url, idx) => (
            <Avatar key={idx} src={url} />
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default PageAppBar;
