import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar({ isOpen, onToggle, chatHistory, activeChat, onNewChat, onSelectChat, onDeleteChat, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onToggle} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <a href="#welcome" className="brand-logo-wrap" onClick={(e) => { e.preventDefault(); onNewChat(); }}>
            <img src="/logo.png" alt="Neura AI" className="brand-logo-img" />
            <div className="brand-title">
              Neura AI
              <span className="brand-badge">PRO</span>
            </div>
          </a>
          <button className="icon-btn close-sidebar-btn" onClick={onToggle} title="Close sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-actions">
          <button className="btn-new-chat" onClick={onNewChat}>
            <span>New Chat</span>
          </button>
        </div>

        <div className="sidebar-search">
          <div className="search-input-wrap">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-nav-scroll">
          <div className="nav-section-title">
            <span>Recent Chats</span>
            <span style={{ fontSize: '10px', fontWeight: 500 }}>{filteredHistory.length}</span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="no-chats-msg">No conversations yet</div>
          ) : (
            filteredHistory.map(chat => (
              <div
                key={chat.id}
                className={`chat-list-item ${activeChat === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <svg className="chat-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="chat-title-text">{chat.title}</span>
                <button
                  className="chat-delete-btn"
                  title="Delete chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <a className="footer-link-btn" onClick={() => showToast('Settings opened')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Settings</span>
          </a>

          <a className="footer-link-btn" onClick={() => showToast('Help & Support')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Help & Support</span>
          </a>

          <div className="user-profile-bar" onClick={() => showToast('Account details: Sarah Chen')}>
            <div className="user-avatar">SC</div>
            <div className="user-info">
              <div className="user-name">Sarah Chen</div>
              <div className="user-plan">Enterprise Workspace</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
