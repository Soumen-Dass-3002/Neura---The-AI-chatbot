import React, { useState, useRef, useEffect } from 'react';
import './InputBar.css';

function InputBar({ onSend, isLoading, onStopGenerating, showToast }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [text]);

  const handleAction = () => {
    if (isLoading) {
      onStopGenerating();
    } else if (text.trim()) {
      onSend(text);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAction();
    }
  };

  return (
    <div className="composer-container">
      <div className="composer-box">
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder="Message Neura AI... (Press Enter to send, Shift+Enter for newline)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
        />

        <div className="composer-bottom-bar">
          <div className="composer-tools-left">
            <button
              className="composer-tool-btn"
              title="Attach file or code"
              onClick={() => showToast('File upload attached')}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            <button
              className="composer-tool-btn"
              title="Insert Emoji"
              onClick={() => {
                setText(prev => prev + '✨');
                showToast('Emoji inserted');
              }}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>

            <button
              className="composer-tool-btn"
              title="Voice Input"
              onClick={() => showToast('Voice transcription active... (Listening)')}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
            </button>
          </div>

          <div className="composer-tools-right">
            {isLoading ? (
              <button
                className="send-btn stop-mode active"
                onClick={handleAction}
                title="Stop generating"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/>
                </svg>
              </button>
            ) : (
              <button
                className={`send-btn ${text.trim() ? 'active' : ''}`}
                onClick={handleAction}
                disabled={!text.trim()}
                title="Send message (Enter)"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="composer-disclaimer">
        Neura AI can make mistakes. Verify important information.
      </div>
    </div>
  );
}

export default InputBar;
