"use client";
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Container,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Typography,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

type Message = {
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your budgeting assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleAnalysisQuestion = async (question: string) => {
    setLoading(true);

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 6,
          question,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const { insights, recommendations, warning } = await res.json();
      let responseText = `🔍 Analysis Results:\n\n${insights.join("\n")}`;
      if (warning) responseText += `\n\n⚠️ Warning: ${warning}`;
      responseText += `\n\n💡 Recommendations:\n${recommendations
        .map((r: any) => `• ${r}`)
        .join("\n")}`;

      setMessages((prev) => [
        ...prev,
        {
          text: responseText,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: `Sorry, I couldn't complete the analysis. Please try again later.`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text: string) => {
    // add the user message to ui
    setMessages((prev) => [
      ...prev,
      {
        text: text,
        sender: "user" as const,
        timestamp: new Date(),
      },
    ]);
    setInput("");

    if (
      input.toLowerCase().includes("reduce") ||
      input.toLowerCase().includes("spike") ||
      input.toLowerCase().includes("general")
    ) {
      return handleAnalysisQuestion(input);
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 6,
          userMessage: text,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const entries = Object.entries(data.newBalances);
        setMessages((prev) => [
          ...prev,
          {
            text:
              `${data.message}\nNew balances:\n` +
              entries.map(([key, val]) => `- ${key}: $${val}`).join("\n"),
            sender: "bot" as const,
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(
          data.error + (data.suggestion ? `\n${data.suggestion}` : "")
        );
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: `❌ ${error}`,
          sender: "bot" as const,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container
      maxWidth="md"
      sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 0 }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          p: 2,
          display: "flex",
          alignItems: "center",
          borderRadius: "0 0 8px 8px",
        }}
      >
        <SmartToyOutlinedIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Budget Assistant</Typography>
      </Box>

      {/* Chat Messages */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "background.default" }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              mb: 2,
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: "70%",
                bgcolor: msg.sender === "user" ? "primary.main" : "grey.100",
                color: msg.sender === "user" ? "white" : "text.primary",
                borderRadius: msg.sender === "user" ? "18px 18px 0 18px" : "18px 18px 18px 0",
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: msg.sender === "user" ? "white" : "primary.main" }}>
                  {msg.sender === "user" ? (
                    <PersonOutlineOutlinedIcon color="primary" sx={{ fontSize: 16 }} />
                  ) : (
                    <SmartToyOutlinedIcon sx={{ fontSize: 16, color: "white" }} />
                  )}
                </Avatar>
                <Typography variant="caption">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>
              <Typography 
                component="div"
                sx={{ whiteSpace: 'pre-line' }}
              >
                {msg.text.split('\n').map((line, i) => (
                  <div key={i}>
                    {line.startsWith('•') ? (
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>{line.substring(1)}</li>
                      </ul>
                    ) : (
                      line
                    )}
                  </div>
                ))}
              </Typography>
            </Paper>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
            <Paper
              sx={{
                p: 1.5,
                bgcolor: "grey.100",
                borderRadius: "18px 18px 18px 0",
              }}
            >
              <CircularProgress size={20} />
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
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
              onClick={() => handleSend(input)}
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
