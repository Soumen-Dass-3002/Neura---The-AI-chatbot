import React from 'react';
import './TypingIndicator.css';

function TypingIndicator() {
  return (
    <div className="message-row assistant">
      <div className="ai-avatar thinking">
        <img src="/neura-mark.png" alt="Neura AI" className="ai-avatar-img" />
      </div>
      <div className="ai-content-body">
        <div className="thinking-dots-container" aria-label="Neura is thinking">
          <div className="loader"></div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
