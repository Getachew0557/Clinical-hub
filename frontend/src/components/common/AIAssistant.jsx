import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Fab, Paper, Typography, TextField, 
    IconButton, Avatar, CircularProgress, 
    Fade, Zoom, Tooltip 
} from '@mui/material';
import { 
    MessageCircle, X, Send, Bot, 
    Sparkles, Info, HelpCircle 
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import aiService from '../../api/ai.service';

export default function AIAssistant() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialSuggestDone, setInitialSuggestDone] = useState(false);
    
    const { user } = useSelector((s) => s.auth);
    const location = useLocation();
    const scrollRef = useRef(null);

    const pageName = location.pathname.split('/').pop() || 'Dashboard';
    const role = user?.role || 'Guest';

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat]);

    // Initial greeting based on page
    useEffect(() => {
        if (open && !initialSuggestDone) {
            const greeting = {
                role: 'assistant',
                content: `Hi ${user?.fullName || 'there'}! I'm your Clinical Assistant. How can I help you on the ${pageName} page?`
            };
            setChat([greeting]);
            setInitialSuggestDone(true);
        }
    }, [open, pageName, user, initialSuggestDone]);

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMsg = { role: 'user', content: message };
        setChat(prev => [...prev, userMsg]);
        setMessage('');
        setLoading(true);

        try {
            const history = chat.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

            const response = await aiService.getContextAssistantResponse(
                message, 
                pageName, 
                role, 
                history
            );

            setChat(prev => [...prev, { role: 'assistant', content: response.response }]);
        } catch (err) {
            setChat(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <Tooltip title="AI Assistant" placement="left">
                <Fab 
                    color="primary" 
                    onClick={() => setOpen(!open)}
                    sx={{ 
                        position: 'fixed', 
                        bottom: 24, 
                        right: 24, 
                        zIndex: 1000,
                        bgcolor: '#0d9488',
                        '&:hover': { bgcolor: '#0f766e' },
                        boxShadow: '0 8px 32px rgba(13, 148, 136, 0.3)'
                    }}
                >
                    {open ? <X size={24} /> : <Sparkles size={24} />}
                </Fab>
            </Tooltip>

            {/* Chat Window */}
            <Zoom in={open}>
                <Paper 
                    elevation={6}
                    sx={{
                        position: 'fixed',
                        bottom: 90,
                        right: 24,
                        width: { xs: 'calc(100% - 48px)', sm: 380 },
                        height: 500,
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ p: 2, bgcolor: '#0d9488', color: 'white', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'white', color: '#0d9488', width: 32, height: 32 }}>
                            <Bot size={20} />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800}>Clinical Assistant</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Powered by Gemini AI</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setOpen(false)} sx={{ ml: 'auto', color: 'white' }}>
                            <X size={18} />
                        </IconButton>
                    </Box>

                    {/* Messages */}
                    <Box 
                        ref={scrollRef}
                        sx={{ 
                            flexGrow: 1, 
                            p: 2, 
                            overflowY: 'auto', 
                            bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        {chat.map((msg, i) => (
                            <Box 
                                key={i}
                                sx={{ 
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    p: 1.5,
                                    borderRadius: 3,
                                    bgcolor: (theme) => msg.role === 'user' ? '#0d9488' : (theme.palette.mode === 'light' ? 'white' : '#1e293b'),
                                    color: msg.role === 'user' ? 'white' : 'text.primary',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    border: (theme) => msg.role === 'assistant' ? `1px solid ${theme.palette.divider}` : 'none'
                                }}
                            >
                                <Typography variant="body2">{msg.content}</Typography>
                            </Box>
                        ))}
                        {loading && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                <CircularProgress size={16} color="inherit" />
                                <Typography variant="caption">Assistant is thinking...</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Input */}
                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField 
                                fullWidth 
                                size="small" 
                                placeholder="Ask me anything..." 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                disabled={loading}
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        borderRadius: 3,
                                        bgcolor: (theme) => theme.palette.mode === 'light' ? '#f1f5f9' : '#0f172a'
                                    } 
                                }}
                            />
                            <IconButton 
                                color="primary" 
                                onClick={handleSend} 
                                disabled={!message.trim() || loading}
                                sx={{ bgcolor: '#0d9488', color: 'white', '&:hover': { bgcolor: '#0f766e' } }}
                            >
                                <Send size={18} />
                            </IconButton>
                        </Box>
                    </Box>
                </Paper>
            </Zoom>
        </>
    );
}
