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
import { useTranslation } from '../contexts/LanguageContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getTherapistProfile, updateTherapistProfile, TherapistProfile } from '../api/therapist';
import { logger } from '../logger';
import { theme } from '../theme';
import DOMPurify from 'dompurify';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [edit, setEdit] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getTherapistProfile(id)
      .then(setProfile)
      .catch((err) => {
        // If API returns 404, create a default profile (API not yet implemented)
        if (err?.response?.status === 404) {
          const savedUser = localStorage.getItem('user') || localStorage.getItem('clinic_user');
          let userData = { name: '', email: '' };
          try {
            if (savedUser) userData = JSON.parse(savedUser);
          } catch {}
          setProfile({
            id,
            userId: id,
            firstName: userData.name?.split(' ')[0] || 'User',
            lastName: userData.name?.split(' ').slice(1).join(' ') || '',
            name: userData.name || 'User Profile',
            email: userData.email || '',
            title: 'Coach',
            bio: '<p>Welcome to your profile page. This feature is coming soon!</p>',
            media: [],
            specializations: [],
            languages: ['Hebrew', 'English'],
            availability: {},
          });
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading profile...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !profile) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">Failed to load profile</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} direction="column">
          <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={profile.media[0]}
              sx={{ width: 80, height: 80, mr: 2 }}
              alt={`${profile.firstName} ${profile.lastName} profile picture`}
            />
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
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.bio) }} />
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack} />
      </Box>
    </ThemeProvider>
  );
};

export default TherapistProfilePage;
