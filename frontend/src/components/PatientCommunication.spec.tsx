import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientCommunication from './PatientCommunication';
import * as commApi from '../api/communication';

// Mock the API module
jest.mock('../api/communication');

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('PatientCommunication', () => {
    const mockMessages = [
        {
            id: 'msg-1',
            senderId: 'patient-1',
            recipientId: 'therapist-1',
            content: 'Hello doctor',
            createdAt: new Date().toISOString()
        },
        {
            id: 'msg-2',
            senderId: 'therapist-1',
            recipientId: 'patient-1',
            content: 'Hi there, how are you?',
            createdAt: new Date().toISOString()
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders messages correctly', async () => {
        (commApi.getMessages as jest.Mock).mockResolvedValue(mockMessages);

        render(<PatientCommunication patientId="patient-1" currentUserId="therapist-1" />);

        await waitFor(() => {
            expect(screen.getByText('Hello doctor')).toBeInTheDocument();
            expect(screen.getByText('Hi there, how are you?')).toBeInTheDocument();
        });

        expect(commApi.getMessages).toHaveBeenCalledWith('patient-1');
    });

    it('sends a new message', async () => {
        (commApi.getMessages as jest.Mock).mockResolvedValue(mockMessages);
        (commApi.sendMessage as jest.Mock).mockResolvedValue({
            id: 'msg-3',
            senderId: 'therapist-1',
            recipientId: 'patient-1',
            content: 'I am doing well',
            createdAt: new Date().toISOString()
        });

        render(<PatientCommunication patientId="patient-1" currentUserId="therapist-1" />);

        await waitFor(() => {
            expect(screen.getByText('Hello doctor')).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'I am doing well' } });

        const sendBtn = screen.getByText('Send');
        fireEvent.click(sendBtn);

        await waitFor(() => {
            expect(commApi.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                content: 'I am doing well',
                recipientId: 'patient-1'
            }));
            expect(screen.getByText('I am doing well')).toBeInTheDocument();
        });
    });
});
