import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PageAppBar from '../components/PageAppBar';
import { createAppTheme } from '../theme';

/**
 * Displays the calendar view placeholder.
 */
const CalendarPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageAppBar avatarUrls={[]} />
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" component="h1">
          {t('calendar')}
        </Typography>
      </Box>
    </ThemeProvider>
  );
};

export default CalendarPage;
