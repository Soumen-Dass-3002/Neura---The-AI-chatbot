const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const User = require('./models/User');
const Chat = require('./models/Chat');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas.'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGODB_URI not found in environment variables.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

const chatSessions = new Map();

const SYSTEM_PROMPT = `You are Neura AI — a friendly, smart AI assistant. Talk like a helpful human tutor, NOT like a textbook or Wikipedia article.

STRICT RULES — never break these:

1. KEEP IT SHORT. For any explanation question, max 4-6 short bullet points or 3-4 short paragraphs. Do NOT write essays.
2. NO ### headings for simple conversational replies. Only use headings if the user explicitly asks for a structured breakdown or "full explanation".
3. When summarizing a document or PDF: pick the TOP 3-4 key ideas and explain each in 1-2 simple sentences. Do NOT list every single point from the doc.
4. Sound like a smart friend, not an academic paper. Use simple everyday words.
5. If someone asks "explain this in brief" — be BRIEF. Under 150 words total.
6. Never use LaTeX math notation. Write math in plain text like: y = w1*x1 + w2*x2 + b.
7. Do NOT use horizontal rules (---) or deeply nested structures.
8. Always respond in English only.
9. Never start your reply by restating the document title or lecture name.
10. One idea at a time. If the user wants more, they will ask.`;

const SESSION_HISTORY_SEED = [
  { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
  { role: 'model', parts: [{ text: "Got it! I'm Neura AI. I'll keep things clear, friendly, and easy to read. What can I help you with?" }] },
];

async function sendMessageWithRetry(chat, message, maxRetries = 2) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await chat.sendMessage(message);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt} error: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, 300 * attempt));
      }
    }
  }
  throw lastError;
}

async function sendMessageStreamWithRetry(chat, message, maxRetries = 2) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await chat.sendMessageStream(message);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`Stream attempt ${attempt} error: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, 300 * attempt));
      }
    }
  }
  throw lastError;
}

// ── Health Check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Neura AI Service is operational.' });
});

// ── Authentication Endpoints ───────────────────────────────────────

// 1. Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, name: newUser.name },
      process.env.JWT_SECRET || 'neura_fallback_secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'neura_fallback_secret',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ── User Private Chat Persistence Endpoints ────────────────────────

// Fetch all chats for logged in user
app.get('/api/chats', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error('Fetch chats error:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Save or Update a chat for logged in user
app.post('/api/chats', authMiddleware, async (req, res) => {
  try {
    const { chatId, title, messages } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    let chat = await Chat.findOne({ chatId, user: req.user.userId });

    if (chat) {
      chat.title = title || chat.title;
      chat.messages = messages;
      await chat.save();
    } else {
      chat = new Chat({
        chatId,
        user: req.user.userId,
        title: title || 'New Conversation',
        messages
      });
      await chat.save();
    }

    res.json(chat);
  } catch (err) {
    console.error('Save chat error:', err);
    res.status(500).json({ error: 'Failed to save chat' });
  }
});

// Delete a chat for logged in user
app.delete('/api/chats/:chatId', authMiddleware, async (req, res) => {
  try {
    await Chat.deleteOne({ chatId: req.params.chatId, user: req.user.userId });
    chatSessions.delete(req.params.chatId);
    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    console.error('Delete chat error:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// ── AI Chat Endpoints ─────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'API key not configured',
        reply: 'Gemini API key is not configured in backend/.env file.'
      });
    }

    if (!chatSessions.has(sessionId)) {
      const chat = model.startChat({
        history: SESSION_HISTORY_SEED,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      });
      chatSessions.set(sessionId, chat);
    }

    const chat = chatSessions.get(sessionId);
    const result = await sendMessageWithRetry(chat, message);
    const response = await result.response;
    const reply = response.text();

    res.json({ reply, sessionId });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to generate AI response',
      reply: 'The AI service encountered an error. Please try sending your message again.'
    });
  }
});

app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!process.env.GEMINI_API_KEY) {
      res.write(`data: ${JSON.stringify({ chunk: 'Gemini API key is not configured in backend/.env file.', done: true })}\n\n`);
      return res.end();
    }

    if (!chatSessions.has(sessionId)) {
      const chat = model.startChat({
        history: SESSION_HISTORY_SEED,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      });
      chatSessions.set(sessionId, chat);
    }

    const chat = chatSessions.get(sessionId);
    const result = await sendMessageStreamWithRetry(chat, message);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ chunk: 'The AI service encountered a temporary error. Please try again.', done: true })}\n\n`);
    res.end();
  }
});

app.delete('/api/chat/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  chatSessions.delete(sessionId);
  res.json({ message: 'Session cleared', sessionId });
});

app.listen(PORT, () => {
  console.log(`Neura AI Server running on http://localhost:${PORT}`);
});
