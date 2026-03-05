import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TherapistNotes from './TherapistNotes';
import * as notesApi from '../api/notes';

// Mock the API module
jest.mock('../api/notes');

describe('TherapistNotes', () => {
    const mockNote = {
        id: 'note-123',
        entityId: 'appt-1',
        entityType: 'appointment' as const,
        content: 'Existing note content',
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
        isPrivate: true
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly and fetches initial notes', async () => {
        (notesApi.getNotes as jest.Mock).mockResolvedValue([mockNote]);

        render(<TherapistNotes entityId="appt-1" entityType="appointment" />);

        // Check loading state (might be too fast to see, but good to know)
        // Wait for content to load
        await waitFor(() => {
            expect(screen.getByDisplayValue('Existing note content')).toBeInTheDocument();
        });

        expect(notesApi.getNotes).toHaveBeenCalledWith('appt-1', 'appointment');
    });

    it('allows saving new notes', async () => {
        (notesApi.getNotes as jest.Mock).mockResolvedValue([]);
        (notesApi.saveNote as jest.Mock).mockResolvedValue({ ...mockNote, id: 'new-note' });

        render(<TherapistNotes entityId="appt-1" entityType="appointment" />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Type detailed session notes here/i)).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText(/Type detailed session notes here/i);
        fireEvent.change(input, { target: { value: 'New session notes' } });

        const saveBtn = screen.getByText('Save Notes');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(notesApi.saveNote).toHaveBeenCalledWith({
                entityId: 'appt-1',
                entityType: 'appointment',
                content: 'New session notes',
                isPrivate: true
            });
            expect(screen.getByText('Notes saved successfully')).toBeInTheDocument();
        });
    });
});
