import React, { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';

const STORAGE_KEY_HISTORY = 'neura_chat_history_v1';
const STORAGE_KEY_ACTIVE = 'neura_active_chat_v1';

// Direct production backend URL fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://neura-the-ai-chatbot-2.onrender.com';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Neura Intelligence');
  const [toastText, setToastText] = useState('');
  const [toastShow, setToastShow] = useState(false);

  // Initialize Chat History from localStorage so chats persist across page reloads
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
      return [];
    }
  });

  // Initialize Active Chat ID from localStorage
  const [activeChatId, setActiveChatId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE) || null;
    } catch (e) {
      return null;
    }
  });

  const abortControllerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Save to localStorage whenever chatHistory or activeChatId changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(chatHistory));
    } catch (e) {
      console.error('Failed to save history to localStorage', e);
    }
  }, [chatHistory]);

  useEffect(() => {
    try {
      if (activeChatId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE, activeChatId);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE);
      }
    } catch (e) {
      console.error('Failed to save active chat to localStorage', e);
    }
  }, [activeChatId]);

  const showToast = useCallback((msg) => {
    setToastText(msg);
    setToastShow(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastShow(false);
    }, 2600);
  }, []);

  const activeChat = chatHistory.find(c => c.id === activeChatId);
  const currentMessages = activeChat ? activeChat.messages : [];

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    let targetChatId = activeChatId;
    const userMsg = { id: Date.now(), role: 'user', content: text, timestamp: new Date() };
    const aiMsgId = Date.now() + 1;
    const aiMsg = { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true };

    if (!targetChatId) {
      targetChatId = `chat-${Date.now()}`;
      const title = text.length > 25 ? text.slice(0, 24) + '...' : text;
      const newChat = {
        id: targetChatId,
        title,
        messages: [userMsg, aiMsg],
        timestamp: new Date()
      };
      setChatHistory(prev => [newChat, ...prev]);
      setActiveChatId(targetChatId);
    } else {
      setChatHistory(prev =>
        prev.map(chat =>
          chat.id === targetChatId
            ? { ...chat, messages: [...chat.messages, userMsg, aiMsg] }
            : chat
        )
      );
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: targetChatId }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                fullContent += data.chunk;
                setChatHistory(prev =>
                  prev.map(chat =>
                    chat.id === targetChatId
                      ? {
                          ...chat,
                          messages: chat.messages.map(msg =>
                            msg.id === aiMsgId ? { ...msg, content: fullContent } : msg
                          )
                        }
                      : chat
                  )
                );
              }
              if (data.done) {
                setChatHistory(prev =>
                  prev.map(chat =>
                    chat.id === targetChatId
                      ? {
                          ...chat,
                          messages: chat.messages.map(msg =>
                            msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
                          )
                        }
                      : chat
                  )
                );
              }
            } catch (e) {
              // Skip partial JSON chunks
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
        setChatHistory(prev =>
          prev.map(chat =>
            chat.id === targetChatId
              ? {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === aiMsgId
                      ? { ...msg, content: 'Unable to connect to AI server. Please check backend connection.', isStreaming: false }
                      : msg
                  )
                }
              : chat
          )
        );
      }
    }

    setIsLoading(false);
  }, [isLoading, activeChatId]);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    if (activeChatId) {
      setChatHistory(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: chat.messages
                  .filter(msg => !(msg.role === 'assistant' && msg.content === ''))
                  .map(msg => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
              }
            : chat
        )
      );
    }
    showToast('Generation stopped');
  }, [activeChatId, showToast]);

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    showToast('Ready for a new conversation');
    if (window.innerWidth <= 900) {
      setSidebarOpen(false);
    }
  }, [showToast]);

  const selectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
    if (window.innerWidth <= 900) {
      setSidebarOpen(false);
    }
  }, []);

  const deleteChat = useCallback((chatId) => {
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    showToast('Conversation deleted');
  }, [activeChatId, showToast]);

  const selectModel = useCallback((modelName) => {
    setSelectedModel(modelName);
    setModelDropdownOpen(false);
    showToast(`Active model changed to: ${modelName}`);
  }, [showToast]);

  const conversationTitle = activeChat ? activeChat.title : 'New Conversation';

  return (
    <div className="app">
      <div className="ambient-glow"></div>

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chatHistory={chatHistory}
        activeChat={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        showToast={showToast}
      />

      <main className="main-workspace">
        <header className="top-navbar">
          <div className="top-nav-left">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>
              </svg>
            </button>

            <div className="model-selector-pill" onClick={() => setModelDropdownOpen(!modelDropdownOpen)}>
              <span className="model-dot"></span>
              <span>{selectedModel}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>

              {modelDropdownOpen && (
                <div className="model-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <div
                    className={`model-opt-item ${selectedModel === 'Neura Intelligence' ? 'selected' : ''}`}
                    onClick={() => selectModel('Neura Intelligence')}
                  >
                    <svg className="model-opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                    <div>
                      <div className="model-opt-name">Neura Intelligence</div>
                      <div className="model-opt-desc">Default • Sub-second multi-modal reasoning</div>
                    </div>
                  </div>

                  <div
                    className={`model-opt-item ${selectedModel === 'GPT-4o Vision' ? 'selected' : ''}`}
                    onClick={() => selectModel('GPT-4o Vision')}
                  >
                    <svg className="model-opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                    </svg>
                    <div>
                      <div className="model-opt-name">GPT-4o Vision</div>
                      <div className="model-opt-desc">Complex logic & long document synthesis</div>
                    </div>
                  </div>

                  <div
                    className={`model-opt-item ${selectedModel === 'Gemini 1.5 Pro' ? 'selected' : ''}`}
                    onClick={() => selectModel('Gemini 1.5 Pro')}
                  >
                    <svg className="model-opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17 12 12 2 17"/><polygon points="2 12 12 17 22 12 12 7 2 12"/>
                    </svg>
                    <div>
                      <div className="model-opt-name">Gemini 1.5 Pro</div>
                      <div className="model-opt-desc">Extreme context & research synthesis</div>
                    </div>
                  </div>

                  <div
                    className={`model-opt-item ${selectedModel === 'Claude 3.5 Sonnet' ? 'selected' : ''}`}
                    onClick={() => selectModel('Claude 3.5 Sonnet')}
                  >
                    <svg className="model-opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div>
                      <div className="model-opt-name">Claude 3.5 Sonnet</div>
                      <div className="model-opt-desc">Coding excellence & natural nuances</div>
                    </div>
                  </div>

                  <div
                    className={`model-opt-item ${selectedModel === 'Local Model (Llama 3)' ? 'selected' : ''}`}
                    onClick={() => selectModel('Local Model (Llama 3)')}
                  >
                    <svg className="model-opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                    </svg>
                    <div>
                      <div className="model-opt-name">Local Model (Llama 3)</div>
                      <div className="model-opt-desc">Zero telemetry • Air-gapped compliance</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="conversation-title-badge">
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>/</span>
              <span className="conversation-title">{conversationTitle}</span>
            </div>
          </div>

          <div className="top-nav-right">
            <button
              className="action-pill-btn"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Conversation share link copied!');
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span>Share</span>
            </button>

            <button
              className="icon-btn"
              onClick={() => showToast('Conversation export menu')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
          </div>
        </header>

        <ChatWindow
          messages={currentMessages}
          isLoading={isLoading}
          onSelectSuggestion={(text) => sendMessage(text)}
          showToast={showToast}
        />

        <InputBar
          onSend={sendMessage}
          isLoading={isLoading}
          onStopGenerating={stopGenerating}
          showToast={showToast}
        />
      </main>

      <div className={`toast-pill ${toastShow ? 'show' : ''}`}>
        <svg className="toast-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>{toastText}</span>
      </div>
    </div>
  );
}

export default App;
