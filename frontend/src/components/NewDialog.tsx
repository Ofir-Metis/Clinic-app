import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('new')}</DialogTitle>
      <DialogContent>
        <Button
          component={Link}
          to="/patients/new"
          variant="contained"
          fullWidth
          sx={{ mb: 1 }}
          onClick={onClose}
        >
          {t('newPatient')}
        </Button>
        <Button
          component={Link}
          to="/appointments/new"
          variant="contained"
          fullWidth
          onClick={onClose}
        >
          {t('newAppointment')}
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewDialog;
