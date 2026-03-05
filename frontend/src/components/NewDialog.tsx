import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { PersonAdd as PersonAddIcon, Event as EventIcon } from '@mui/icons-material';
import { useTranslation } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

/**
 * Global dialog for creating new resources like patients or appointments.
 */
interface NewDialogProps {
  open: boolean;
  onClose: () => void;
}

const NewDialog: React.FC<NewDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const actionButtonSx = {
    p: 2,
    justifyContent: 'flex-start',
    textAlign: 'left',
    borderRadius: 2,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    '&:hover': {
      bgcolor: alpha(theme.palette.primary.main, 0.08),
      borderColor: theme.palette.primary.main,
    },
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600 }}>{t('newDialog.title')}</DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            component={Link}
            to="/patients/new"
            variant="outlined"
            fullWidth
            sx={actionButtonSx}
            onClick={onClose}
            startIcon={<PersonAddIcon sx={{ fontSize: 28, mr: 1 }} />}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle1" fontWeight={600} component="span" display="block">
                {t('newDialog.newPatient')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('newDialog.newPatientDescription')}
              </Typography>
            </Box>
          </Button>

          <Button
            component={Link}
            to="/appointments/new"
            variant="outlined"
            fullWidth
            sx={actionButtonSx}
            onClick={onClose}
            startIcon={<EventIcon sx={{ fontSize: 28, mr: 1 }} />}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle1" fontWeight={600} component="span" display="block">
                {t('newDialog.newAppointment')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('newDialog.newAppointmentDescription')}
              </Typography>
            </Box>
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewDialog;
