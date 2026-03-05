import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Snackbar,
  Typography,
  Box,
  Grid,
  Avatar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  NoteAdd as NoteAddIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { saveNote } from '../api/notes';
import { logger } from '../logger';
import WellnessLayout from '../layouts/WellnessLayout';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorAlert from '../components/ErrorAlert';
import LoadingButton from '../components/LoadingButton';
import LoadingOverlay from '../components/LoadingOverlay';

const AddNotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { translations: t } = useTranslation();
  const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const { error, handleError, clearError, setRetryAction } = useErrorHandler();

  const formik = useFormik({
    initialValues: {
      content: '',
      isPrivate: true,
    },
    validationSchema: Yup.object({
      content: Yup.string().required(t.addNotePage?.required || 'Content is required'),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      logger.debug('add note submit', values);
      clearError();

      if (!id) {
        setSnack({ message: 'Client ID is missing', severity: 'error' });
        setSubmitting(false);
        return;
      }

      const attemptSaveNote = async () => {
        try {
          await saveNote({
            entityId: id,
            entityType: 'patient',
            content: values.content,
            isPrivate: values.isPrivate,
          });
          setSnack({ message: t.addNotePage?.noteSaved || 'Note saved successfully!', severity: 'success' });
          resetForm();
          // Navigate back to patient detail after short delay
          setTimeout(() => navigate(`/patients/${id}`), 1500);
        } catch (e) {
          logger.error('add note error', e);
          setSnack({ message: t.addNotePage?.saveFailed || 'Failed to save note', severity: 'error' });
          handleError(e, t.addNotePage?.saveFailed || 'Failed to save note');
        } finally {
          setSubmitting(false);
        }
      };

      setRetryAction(attemptSaveNote);
      await attemptSaveNote();
    },
  });

  return (
    <WellnessLayout
      title={t.addNotePage?.title || 'Add Note'}
      showFab={false}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Avatar sx={{
          width: 80,
          height: 80,
          bgcolor: 'primary.main',
          mx: 'auto',
          mb: 2
        }}>
          <NoteAddIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t.addNotePage?.heading || 'Add Session Note'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t.addNotePage?.subtitle || 'Document your coaching session observations'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 700 }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={formik.handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t.addNotePage?.content || 'Note Content'}
                    multiline
                    rows={10}
                    {...formik.getFieldProps('content')}
                    error={formik.touched.content && Boolean(formik.errors.content)}
                    helperText={formik.touched.content && formik.errors.content}
                    placeholder={t.addNotePage?.contentPlaceholder || 'Write your session notes here... (Markdown supported)'}
                    InputProps={{
                      startAdornment: (
                        <NotesIcon sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(46, 125, 107, 0.04)',
                    border: '1px solid rgba(46, 125, 107, 0.12)'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.isPrivate}
                          onChange={(e) => formik.setFieldValue('isPrivate', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {t.addNotePage?.privateNote || 'Private Note'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.addNotePage?.privateDescription || 'Only you can see this note'}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    loading={formik.isSubmitting}
                    startIcon={<NoteAddIcon />}
                    sx={{ height: 56 }}
                  >
                    {t.addNotePage?.saveNote || 'Save Note'}
                  </LoadingButton>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack?.message}
      />

      {error && <ErrorAlert error={error} onRetry={error.retryAction} />}
      {formik.isSubmitting && <LoadingOverlay />}
    </WellnessLayout>
  );
};

export default AddNotePage;
