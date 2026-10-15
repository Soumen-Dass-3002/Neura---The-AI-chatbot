import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar({ isOpen, onToggle, chatHistory, activeChat, onNewChat, onSelectChat, onDeleteChat, currentUser, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [panel, setPanel] = useState(null);

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
            <img src="/neura-mark.png" alt="Neura AI" className="brand-logo-img" />
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

        {accountMenuOpen && <div className="account-menu-backdrop" onClick={() => { setAccountMenuOpen(false); setPanel(null); }} />}
        <div className="sidebar-footer">
          <div className="user-profile-bar" onClick={() => setAccountMenuOpen(!accountMenuOpen)} role="button" tabIndex={0} aria-expanded={accountMenuOpen}>
            <div className="user-avatar">
              {(currentUser.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser.name || 'User'}</div>
              <div className="user-plan">{currentUser.email || 'Account'}</div>
            </div>
            {accountMenuOpen && <div className="account-popup-menu" onClick={e => e.stopPropagation()}>
              {panel === 'account' ? <div className="account-detail"><strong>Account</strong><span>{currentUser.name}</span><span>{currentUser.email}</span></div> : panel === 'settings' ? <div className="account-detail"><strong>Settings</strong><span>Streaming responses are on.</span><span>Attachments up to 10 MB.</span></div> : <>
                <button className="account-menu-item" onClick={() => setPanel('account')}>Account</button>
                <button className="account-menu-item" onClick={() => setPanel('settings')}>Settings</button>
                <button className="account-menu-item signout" onClick={onLogout}>Sign out</button>
              </>}
              {panel && <button className="account-menu-item" onClick={() => setPanel(null)}>Back</button>}
            </div>}
          </div>
        </div>

      </aside>
    </>
  );
}

export default Sidebar;
