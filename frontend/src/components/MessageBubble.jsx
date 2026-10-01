import React from 'react';
import './MessageBubble.css';

function MessageBubble({ message, showToast, onEditUserMessage }) {
  const isUser = message.role === 'user';

  const copyContent = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      showToast('Message copied to clipboard');
    }
  };

  const handleFeedback = (type) => {
    showToast(`Feedback recorded: ${type}`);
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="ai-avatar">
          <img src="/logo.png" alt="Neura AI" className="ai-avatar-img" />
        </div>
      )}

      {isUser ? (
        <div className="user-bubble-container">
          <div className="user-bubble">{message.content}</div>
          <div className="user-action-bar">
            <button
              className="user-action-btn"
              onClick={() => onEditUserMessage && onEditUserMessage(message.content, message.id)}
              title="Edit message"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </button>
            <button
              className="user-action-btn"
              onClick={copyContent}
              title="Copy text"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="ai-content-body">
          <div className="ai-text-block">
            {message.content ? (
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
            ) : null}
            {message.isStreaming && <span className="streaming-cursor"></span>}
          </div>

          {message.content && (
            <div className="ai-action-bar">
              <button className="ai-action-btn" onClick={copyContent} title="Copy response">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </button>
              <button className="ai-action-btn" onClick={() => handleFeedback('like')} title="Helpful">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3"/><path d="M10 2v8"/>
                </svg>
              </button>
              <button className="ai-action-btn" onClick={() => handleFeedback('dislike')} title="Poor response">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"/><path d="M14 22v-8"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<div class="code-block-container"><div class="code-header"><span class="code-lang-label">${lang || 'code'}</span></div><div class="code-content"><code>${code}</code></div></div>`;
  });

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italics
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Paragraphs
  html = html.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');

  return html;
}

export default MessageBubble;
