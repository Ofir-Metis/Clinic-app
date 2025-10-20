import React from 'react';
import { AppBar, Toolbar, Avatar, Typography, Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ViewSwitchingButton from './ViewSwitchingButton';

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
            <Avatar
              key={idx}
              src={url}
              alt={`User avatar ${idx + 1}`}
            />
          ))}
        </Box>
        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {title}
        </Typography>
        {/* View switching button for therapists */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ViewSwitchingButton />
          {avatarUrls.length === 0 && (
            <Box sx={{ width: 40 }} /> 
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default PageAppBar;
