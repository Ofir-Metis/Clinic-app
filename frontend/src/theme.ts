import { createTheme, Theme } from '@mui/material/styles';

/**
 * Creates the Material-UI theme used across the application.
 * @param direction text direction for internationalization support.
 * @returns configured Material-UI theme.
 */
export const createAppTheme = (direction: 'ltr' | 'rtl' = 'ltr'): Theme =>
  createTheme({
    direction,
    palette: {
      primary: { main: '#00A699' },
      background: { default: '#F5F5F5' },
    },
    typography: { fontFamily: 'Roboto' },
  });
