import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    IconButton,
    CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Message, getMessages, sendMessage } from '../api/communication';

interface PatientCommunicationProps {
    patientId: string; // Identifying the patient thread
    currentUserId: string; // The therapist ID
}

const PatientCommunication: React.FC<PatientCommunicationProps> = ({ patientId, currentUserId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();
    }, [patientId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const data = await getMessages(patientId);
            setMessages(data || []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const sentMessage = await sendMessage({
                threadId: patientId, // Assuming threadId maps to patientId for simple 1:1
                senderId: currentUserId,
                recipientId: patientId,
                content: newMessage,
                createdAt: new Date().toISOString()
            });

            // Optimistically add or use returned message
            const msgToAdd = sentMessage || {
                id: `temp-${Date.now()}`,
                senderId: currentUserId,
                recipientId: patientId,
                content: newMessage,
                createdAt: new Date().toISOString()
            };

            setMessages([...messages, msgToAdd as Message]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <Paper elevation={0} variant="outlined" sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
            <Box p={2} borderBottom="1px solid #eee">
                <Typography variant="h6">Patient Communication</Typography>
            </Box>

            <Box flex={1} overflow="auto" p={2} bgcolor="#f9f9f9">
                {loading ? (
                    <Box display="flex" justifyContent="center" height="100%" alignItems="center">
                        <CircularProgress />
                    </Box>
                ) : (
                    <List>
                        {messages.length === 0 && (
                            <Typography variant="body2" color="textSecondary" align="center" mt={4}>
                                No messages yet. Start the conversation!
                            </Typography>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.senderId === currentUserId;
                            return (
                                <ListItem key={msg.id} alignItems="flex-start" sx={{ flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: isMe ? 'primary.main' : 'secondary.main' }}>
                                            {isMe ? 'Me' : 'P'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 2,
                                            maxWidth: '70%',
                                            bgcolor: isMe ? '#e3f2fd' : '#fff',
                                            borderRadius: 2
                                        }}
                                    >
                                        <Typography variant="body1">{msg.content}</Typography>
                                        <Typography variant="caption" display="block" color="textSecondary" align="right" mt={0.5}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </Paper>
                                </ListItem>
                            );
                        })}
                        <div ref={bottomRef} />
                    </List>
                )}
            </Box>

            <Divider />

            <Box p={2} display="flex" alignItems="center" gap={1}>
                <IconButton size="small">
                    <AttachFileIcon />
                </IconButton>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    endIcon={<SendIcon />}
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                >
                    Send
                </Button>
            </Box>
        </Paper>
    );
};

export default PatientCommunication;
