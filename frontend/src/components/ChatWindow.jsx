import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import './ChatWindow.css';

function ChatWindow({ messages, isLoading, onSelectSuggestion, showToast }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestions = [
    {
      id: 1,
      title: 'Explain something',
      desc: '"Teach me a complex topic simply"',
      text: 'Teach me how transformer attention mechanisms work in simple intuitive steps.',
      type: 'explain',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      )
    },
    {
      id: 2,
      title: 'Write code',
      desc: '"Help me build a React component"',
      text: 'Help me build a reusable React custom hook for debounced keyboard inputs.',
      type: 'code',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
      )
    },
    {
      id: 3,
      title: 'Analyze data',
      desc: '"Find insights from my dataset"',
      text: 'Analyze this SaaS conversion funnel: 10,000 visits, 420 signups, 85 paid upgrades.',
      type: 'data',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      )
    },
    {
      id: 4,
      title: 'Brainstorm',
      desc: '"Generate ideas for my next project"',
      text: 'Generate 5 innovative AI productivity startup ideas for developers.',
      type: 'brainstorm',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      )
    }
  ];

  // Filter out the empty placeholder message when rendering MessageBubbles,
  // because the TypingIndicator renders the 3 dots for empty content while loading!
  const renderedMessages = messages.filter(
    msg => !(msg.role === 'assistant' && msg.content === '' && isLoading)
  );

  const showDots = isLoading && messages.length > 0 && messages[messages.length - 1]?.content === '';

  return (
    <div className="chat-scroll-container">
      <div className="content-center-column">
        {messages.length === 0 ? (
          <div className="welcome-container">
            <div className="welcome-icon-wrapper">
              <div className="welcome-icon-glow"></div>
              <div className="welcome-icon-box">
                <img src="/logo.png" alt="Neura AI" className="welcome-logo-img" />
              </div>
            </div>

            <h1 className="welcome-heading">How can I help you today?</h1>
            <p className="welcome-subheading">
              Ask questions, build ideas, write code, analyze data, or explore something new.
            </p>

            <div className="suggestions-grid">
              {suggestions.map(sug => (
                <div
                  key={sug.id}
                  className="suggestion-card"
                  onClick={() => onSelectSuggestion(sug.text)}
                >
                  <div className={`suggestion-card-icon sug-icon-${sug.type}`}>
                    {sug.icon}
                  </div>
                  <div>
                    <div className="suggestion-title">{sug.title}</div>
                    <div className="suggestion-desc">{sug.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-wrapper">
            {renderedMessages.map(msg => (
              <MessageBubble key={msg.id} message={msg} showToast={showToast} />
            ))}

            {showDots && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatWindow;
