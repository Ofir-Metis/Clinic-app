import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    primary: { main: '#00A699' },
    background: { default: '#F5F5F5', paper: 'rgba(255,255,255,0.6)' },
  },
  typography: { fontFamily: 'Roboto, sans-serif' },
  components: {
    MuiPaper: { styleOverrides: { root: { backdropFilter: 'blur(16px)' } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 24, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.18)' } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 16, fontWeight: 700 } } },
    MuiTextField: { styleOverrides: { root: { borderRadius: 16, background: 'rgba(255,255,255,0.7)' } } },
    MuiDrawer: { styleOverrides: { paper: { background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', borderRadius: '0 24px 24px 0' } } },
    MuiBottomNavigation: { styleOverrides: { root: { background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', borderRadius: 24 } } },
  }
});
