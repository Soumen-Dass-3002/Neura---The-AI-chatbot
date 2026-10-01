const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// gemini-flash-lite-latest provides sub-second (<1s) instant responses
const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

const chatSessions = new Map();

const SYSTEM_PROMPT = `You are Neura AI, a smart and friendly AI assistant.

RESPONSE STYLE — follow these strictly:
- Be conversational and clear, like explaining to a smart friend — not like writing a textbook.
- Keep paragraphs SHORT (2-3 sentences max). Never write walls of text.
- Use bullet points only when genuinely listing multiple items. Keep each point brief.
- Bold (**text**) only the most important terms — do not over-bold.
- For concept explanations: start with a one-line simple summary, then expand cleanly.
- For PDF/document questions: use short readable sections with simple headings, plain language, bite-sized explanations. Do NOT dump everything at once.
- Avoid excessive LaTeX math. Write math in plain readable text unless the user specifically asks for LaTeX.
- Do NOT add excessive --- dividers or deeply nested structures. Keep it visually clean.
- Match response length to the question complexity. Simple question = short answer.
- Always respond in English only.`;

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Neura AI Service is operational.' });
});

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
