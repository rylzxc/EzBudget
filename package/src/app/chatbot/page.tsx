"use client";
import { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Container, 
  TextField, 
  IconButton, 
  Paper, 
  Avatar, 
  Typography,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

type Message = {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your budgeting assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Simulate bot response after 1s
    setTimeout(() => {
      const botResponses = [
        "I see. Let me analyze your spending patterns.",
        "Based on your budget, I'd recommend...",
        "Interesting question! For financial advice on this...",
        "I've updated your budget plan accordingly."
      ];
      const botMessage: Message = {
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 1000);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 0 }}>
      {/* Header */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        borderRadius: '0 0 8px 8px'
      }}>
        <SmartToyOutlinedIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Budget Assistant</Typography>
      </Box>

      {/* Chat Messages */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2, 
        bgcolor: 'background.default'
      }}>
        {messages.map((msg, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              mb: 2, 
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <Paper
              sx={{
                p: 1.5,
                maxWidth: '70%',
                bgcolor: msg.sender === 'user' ? 'primary.main' : 'grey.100',
                color: msg.sender === 'user' ? 'white' : 'text.primary',
                borderRadius: msg.sender === 'user' 
                  ? '18px 18px 0 18px' 
                  : '18px 18px 18px 0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Avatar sx={{ 
                  width: 24, 
                  height: 24, 
                  mr: 1,
                  bgcolor: msg.sender === 'user' ? 'white' : 'primary.main'
                }}>
                  {msg.sender === 'user' ? (
                    <PersonOutlineOutlinedIcon color="primary" sx={{ fontSize: 16 }} />
                  ) : (
                    <SmartToyOutlinedIcon sx={{ fontSize: 16, color: 'white' }} />
                  )}
                </Avatar>
                <Typography variant="caption">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              <Typography>{msg.text}</Typography>
            </Paper>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: '18px 18px 18px 0' }}>
              <CircularProgress size={20} />
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask about your budget..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{ mr: 1 }}
            />
            <IconButton 
              color="primary" 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              type="submit"
            >
              <SendIcon />
            </IconButton>
          </Box>
        </form>
      </Box>
    </Container>
  );
}