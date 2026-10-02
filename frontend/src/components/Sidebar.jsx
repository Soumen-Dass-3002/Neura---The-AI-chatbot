import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar({ isOpen, onToggle, chatHistory, activeChat, onNewChat, onSelectChat, onDeleteChat, showToast, currentUser, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const filteredHistory = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleAccountClick = () => {
    setAccountMenuOpen(prev => !prev);
  };

  const handleAccountOption = (option) => {
    setAccountMenuOpen(false);
    showToast(`${option} opened`);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onToggle} />
      )}

      {/* Click outside to close account menu */}
      {accountMenuOpen && (
        <div className="account-menu-backdrop" onClick={() => setAccountMenuOpen(false)} />
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

        {/* Footer — user profile bar with dynamic user info and account popup */}
        <div className="sidebar-footer">
          <div className="user-profile-bar" onClick={handleAccountClick}>
            <div className="user-avatar">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser?.name || 'User'}</div>
              <div className="user-plan">{currentUser?.email || 'Free Plan'}</div>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              style={{ transform: accountMenuOpen ? 'rotate(90deg)' : 'rotate(270deg)', transition: '0.2s' }}
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>

            {/* Account popup menu */}
            {accountMenuOpen && (
              <div className="account-popup-menu">
                <button className="account-menu-item" onClick={() => handleAccountOption('Account')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  <span>Account</span>
                </button>
                <button className="account-menu-item" onClick={() => handleAccountOption('Settings')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span>Settings</span>
                </button>
                <button className="account-menu-item" onClick={() => { setAccountMenuOpen(false); onLogout(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span style={{ color: '#EF4444' }}>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </aside>
    </>
  );
}

export default Sidebar;
