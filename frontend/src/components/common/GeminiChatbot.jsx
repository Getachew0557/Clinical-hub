import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import {
    Box, Paper, Typography, IconButton, TextField,
    Avatar, Fade, CircularProgress, Button, Zoom
} from '@mui/material';
import aiService from '../../api/ai.service';

export default function GeminiChatbot() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'model', parts: [{ text: "Hello! I'm your Clinical Hub assistant. How can I help you today?" }] }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = async () => {
        if (!message.trim() || loading) return;

        const userMsg = { role: 'user', parts: [{ text: message }] };
        const updatedHistory = [...chatHistory, userMsg];

        setChatHistory(updatedHistory);
        setMessage('');
        setLoading(true);

        try {
            // Mapping for the backend history format (if needed, here we send simple role/parts)
            const data = await aiService.getPublicChatResponse(message, chatHistory);

            setChatHistory(prev => [...prev, {
                role: 'model',
                parts: [{ text: data.response }]
            }]);
        } catch (err) {
            setChatHistory(prev => [...prev, {
                role: 'model',
                parts: [{ text: "I'm having trouble connecting right now. Please try again later or call our clinic directly." }]
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999 }}>
            {/* Chat Window */}
            <Fade in={open}>
                <Paper
                    elevation={10}
                    sx={{
                        position: 'absolute',
                        bottom: 80,
                        right: 0,
                        width: { xs: 320, sm: 400 },
                        height: 500,
                        borderRadius: 6,
                        display: open ? 'flex' : 'none',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ p: 2.5, bgcolor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'white', color: '#3b82f6', width: 32, height: 32 }}>
                                <Bot size={20} />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={800} lineHeight={1}>Clinic Assistant</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>Powered by Gemini AI</Typography>
                            </Box>
                        </Box>
                        <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                            <X size={20} />
                        </IconButton>
                    </Box>

                    {/* Messages */}
                    <Box
                        ref={scrollRef}
                        sx={{
                            flex: 1,
                            p: 2,
                            overflowY: 'auto',
                            bgcolor: '#f8fafc',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        {chatHistory.map((msg, i) => (
                            <Box
                                key={i}
                                sx={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5
                                }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        px: 2,
                                        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                        bgcolor: msg.role === 'user' ? '#3b82f6' : 'white',
                                        color: msg.role === 'user' ? 'white' : 'text.primary',
                                        border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0'
                                    }}
                                >
                                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                        {msg.parts[0].text}
                                    </Typography>
                                </Paper>
                                <Typography variant="caption" sx={{ color: 'text.secondary', px: 1, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    {msg.role === 'user' ? 'You' : 'Assistant'}
                                </Typography>
                            </Box>
                        ))}
                        {loading && (
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1 }}>
                                <CircularProgress size={16} thickness={6} />
                                <Typography variant="caption" color="text.secondary">Gemini is thinking...</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Input */}
                    <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}>
                        <TextField
                            fullWidth
                            placeholder="Type your question..."
                            size="small"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            InputProps={{
                                endAdornment: (
                                    <IconButton size="small" onClick={handleSend} color="primary" disabled={loading}>
                                        <Send size={18} />
                                    </IconButton>
                                ),
                                sx: { borderRadius: 4, bgcolor: '#f1f5f9', border: 'none', '& fieldset': { border: 'none' } }
                            }}
                        />
                    </Box>
                </Paper>
            </Fade>

            {/* Toggle Button */}
            <Zoom in={true}>
                <IconButton
                    onClick={() => setOpen(!open)}
                    sx={{
                        width: 64,
                        height: 64,
                        bgcolor: '#3b82f6',
                        color: 'white',
                        boxShadow: '0 10px 15px -3px rgb(59 130 246 / 0.5)',
                        '&:hover': { bgcolor: '#2563eb', transform: 'scale(1.05)' },
                        transition: 'all 0.2s'
                    }}
                >
                    {open ? <X size={28} /> : <MessageSquare size={28} />}
                </IconButton>
            </Zoom>
        </Box>
    );
}
