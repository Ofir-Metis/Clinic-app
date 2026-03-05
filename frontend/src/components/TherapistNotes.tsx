import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Snackbar,
    Alert,
    FormControlLabel,
    Switch
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { Note, getNotes, saveNote, updateNote } from '../api/notes';

interface TherapistNotesProps {
    entityId: string;
    entityType: 'appointment' | 'patient';
}

const TherapistNotes: React.FC<TherapistNotesProps> = ({ entityId, entityType }) => {
    const [note, setNote] = useState<Note | null>(null);
    const [content, setContent] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchNotes();
    }, [entityId, entityType]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const notes = await getNotes(entityId, entityType);
            if (notes && notes.length > 0) {
                // For simplicity, we'll take the most recent note or the first one
                // In a full implementation, we might list multiple notes
                const recentNote = notes[0];
                setNote(recentNote);
                setContent(recentNote.content);
                setIsPrivate(recentNote.isPrivate);
            } else {
                setNote(null);
                setContent('');
            }
        } catch (error) {
            console.error('Failed to fetch notes:', error);
            setMessage({ type: 'error', text: 'Failed to load notes' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (note) {
                // Update existing
                await updateNote(note.id, content);
                setNote({ ...note, content, updatedAt: new Date().toISOString() });
            } else {
                // Create new
                const newNote = await saveNote({
                    entityId,
                    entityType,
                    content,
                    isPrivate,
                });
                setNote(newNote as Note);
            }
            setMessage({ type: 'success', text: 'Notes saved successfully' });
        } catch (error) {
            console.error('Failed to save notes:', error);
            setMessage({ type: 'error', text: 'Failed to save notes' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
    }

    return (
        <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Therapist Notes</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            color="secondary"
                        />
                    }
                    label="Private Note"
                />
            </Box>

            <TextField
                fullWidth
                multiline
                minRows={6}
                variant="outlined"
                placeholder="Type detailed session notes here... (Markdown supported)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 2 }}
            />

            <Box display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || !content.trim()}
                >
                    {saving ? 'Saving...' : 'Save Notes'}
                </Button>
            </Box>

            <Snackbar
                open={!!message}
                autoHideDuration={4000}
                onClose={() => setMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setMessage(null)} severity={message?.type || 'info'} sx={{ width: '100%' }}>
                    {message?.text}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default TherapistNotes;
