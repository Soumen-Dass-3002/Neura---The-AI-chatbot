import React from 'react';
import './TypingIndicator.css';

function TypingIndicator() {
  return (
    <div className="message-row assistant">
      <div className="ai-avatar thinking">
        <img src="/logo.png" alt="Neura AI" className="ai-avatar-img" />
      </div>
      <div className="ai-content-body">
        <div className="thinking-dots-container">
          <span className="thinking-dot"></span>
          <span className="thinking-dot"></span>
          <span className="thinking-dot"></span>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
