import React, { useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  Avatar,
  IconButton,
  Snackbar,
  Grid,
  Switch,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getTherapistProfile, updateTherapistProfile, TherapistProfile } from '../api/therapist';
import { logger } from '../logger';
import { createAppTheme } from '../theme';

function getUserIdFromToken(): number | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch {
    return null;
  }
}

const TherapistProfilePage: React.FC<{ id: number }> = ({ id }) => {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [edit, setEdit] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);

  useEffect(() => {
    getTherapistProfile(id).then(setProfile);
  }, [id]);

  const isOwner = profile?.userId === getUserIdFromToken();

  const handleSave = async () => {
    if (!profile) return;
    logger.debug('save profile', profile);
    try {
      await updateTherapistProfile(id, profile);
      setSnack(t('saved'));
    } catch (e) {
      logger.error('save error', e);
      setSnack(t('saveFailed'));
    }
  };

  if (!profile) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} direction="column">
          <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={profile.media[0]} sx={{ width: 80, height: 80, mr: 2 }} />
            <Box sx={{ flexGrow: 1 }}>
              {edit ? (
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  aria-label="name"
                />
              ) : (
                <Typography variant="h5">{profile.name}</Typography>
              )}
              {edit ? (
                <input
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  aria-label="title"
                />
              ) : (
                <Typography variant="subtitle1">{profile.title}</Typography>
              )}
            </Box>
            {isOwner && (
              <Switch checked={edit} onChange={() => setEdit(!edit)} aria-label="edit" />
            )}
            {edit && (
              <IconButton onClick={handleSave} aria-label="save">
                <SaveIcon />
              </IconButton>
            )}
          </Grid>
          <Grid item>
            {edit ? (
              <ReactQuill value={profile.bio} onChange={(v) => setProfile({ ...profile, bio: v })} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: profile.bio }} />
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack} />
      </Box>
    </ThemeProvider>
  );
};

export default TherapistProfilePage;
