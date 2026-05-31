import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Paper, Typography, TextField, 
    IconButton, Avatar, CircularProgress, 
    Tooltip 
} from '@mui/material';
import { 
    MessageCircle, X, Send, Bot, 
    Sparkles, Info, ShieldCheck, HelpCircle,
    ChevronDown, Maximize2, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import chatbotService from '../../api/chatbot.service';

export default function DocBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat, isLoading]);

    useEffect(() => {
        if (isOpen && chat.length === 0) {
            const greeting = {
                role: 'assistant',
                content: "Hello! I'm DocBot, your intelligent platform navigation assistant for Clinical Hub. I can help you with:\n\n• Registration and login\n• How to use features for your role (Patient, Doctor, Receptionist, Admin)\n• Booking appointments and video consultations\n• Using EMR, billing, and inventory\n• Navigation and settings\n• Troubleshooting common issues\n• Security and compliance questions\n\nWhat would you like to know?"
            };
            setChat([greeting]);
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const userMsg = { role: 'user', content: message };
        setChat(prev => [...prev, userMsg]);
        setMessage('');
        setIsLoading(true);

        try {
            const response = await chatbotService.chat(message);
            setChat(prev => [...prev, { role: 'assistant', content: response.response }]);
        } catch (err) {
            setChat(prev => [...prev, { 
                role: 'assistant', 
                content: "I'm having a bit of trouble connecting to my brain. Please try again in a moment!" 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999 }}>
            {/* Toggle Button */}
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <IconButton
                    onClick={() => setIsOpen(!isOpen)}
                    sx={{
                        width: 65,
                        height: 65,
                        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(13, 148, 136, 0.4)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
                        }
                    }}
                >
                    {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
                    {!isOpen && (
                        <Box
                            component={motion.div}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            sx={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 15,
                                height: 15,
                                bgcolor: '#f43f5e',
                                borderRadius: '50%',
                                border: '3px solid white'
                            }}
                        />
                    )}
                </IconButton>
            </motion.div>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            bottom: 80,
                            right: 0,
                            width: isExpanded ? '450px' : '380px',
                            height: isExpanded ? '700px' : '550px',
                            maxWidth: '90vw',
                            maxHeight: '80vh',
                        }}
                    >
                        <Paper
                            elevation={24}
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            {/* Header */}
                            <Box sx={{ 
                                p: 3, 
                                background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 45, height: 45, border: '2px solid rgba(255,255,255,0.5)' }}>
                                        <Bot size={28} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>DocBot</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box sx={{ width: 8, height: 8, bgcolor: '#4ade80', borderRadius: '50%' }} />
                                            <Typography variant="caption" sx={{ opacity: 0.9 }}>Online Navigation Assistant</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box>
                                    <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)} sx={{ color: 'white', mr: 0.5 }}>
                                        {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                    </IconButton>
                                    <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                                        <ChevronDown size={22} />
                                    </IconButton>
                                </Box>
                            </Box>

                            {/* Info Banner */}
                            <Box sx={{ px: 2, py: 1, bgcolor: 'rgba(13, 148, 136, 0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShieldCheck size={14} color="#0d9488" />
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    HIPAA & GDPR Compliant Environment
                                </Typography>
                            </Box>

                            {/* Messages area */}
                            <Box 
                                ref={scrollRef}
                                sx={{ 
                                    flexGrow: 1, 
                                    p: 3, 
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2.5,
                                    scrollBehavior: 'smooth',
                                    '&::-webkit-scrollbar': { width: '6px' },
                                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '10px' }
                                }}
                            >
                                {chat.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%'
                                        }}
                                    >
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            bgcolor: msg.role === 'user' ? '#0d9488' : 'white',
                                            color: msg.role === 'user' ? 'white' : '#1e293b',
                                            boxShadow: msg.role === 'user' ? '0 4px 15px rgba(13, 148, 136, 0.2)' : '0 4px 15px rgba(0,0,0,0.05)',
                                            border: msg.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.05)',
                                            position: 'relative'
                                        }}>
                                            <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {msg.content}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ 
                                            display: 'block', 
                                            mt: 0.5, 
                                            textAlign: msg.role === 'user' ? 'right' : 'left',
                                            opacity: 0.6,
                                            fontSize: '10px'
                                        }}>
                                            {msg.role === 'assistant' ? 'DocBot' : 'You'}
                                        </Typography>
                                    </motion.div>
                                ))}
                                
                                {isLoading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'rgba(13, 148, 136, 0.05)', p: 1.5, borderRadius: '15px', width: 'fit-content' }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {[0, 1, 2].map((i) => (
                                                    <Box
                                                        key={i}
                                                        component={motion.div}
                                                        animate={{ y: [0, -5, 0] }}
                                                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                                        sx={{ width: 6, height: 6, bgcolor: '#0d9488', borderRadius: '50%' }}
                                                    />
                                                ))}
                                            </Box>
                                            <Typography variant="caption" color="#0d9488" fontWeight={600}>DocBot is typing...</Typography>
                                        </Box>
                                    </motion.div>
                                )}
                            </Box>

                            {/* Input Area */}
                            <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.05)', bgcolor: 'rgba(255,255,255,0.5)' }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    gap: 1, 
                                    bgcolor: 'white', 
                                    borderRadius: '16px', 
                                    p: 1,
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                    '&:focus-within': { borderColor: '#0d9488', boxShadow: '0 4px 20px rgba(13, 148, 136, 0.1)' }
                                }}>
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        placeholder="How do I book an appointment?"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        autoComplete="off"
                                        InputProps={{ 
                                            disableUnderline: true,
                                            sx: { px: 2, py: 1, fontSize: '0.9rem' }
                                        }}
                                    />
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <IconButton 
                                            onClick={handleSend}
                                            disabled={!message.trim() || isLoading}
                                            sx={{ 
                                                bgcolor: '#0d9488', 
                                                color: 'white', 
                                                borderRadius: '12px',
                                                '&:hover': { bgcolor: '#0f766e' },
                                                '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.1)', color: 'white' }
                                            }}
                                        >
                                            <Send size={20} />
                                        </IconButton>
                                    </motion.div>
                                </Box>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', opacity: 0.5 }}>
                                    Powered by RAG • I cannot provide medical advice
                                </Typography>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
}
