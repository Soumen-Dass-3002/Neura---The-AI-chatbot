import React, { useState } from 'react';
import './AuthPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password.trim() || (mode === 'signup' && !form.name.trim())) {
      setError('Please complete all fields.');
      return;
    }
    if (mode === 'signup' && form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${mode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'signup' ? form : { email: form.email, password: form.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to continue.');
      onLogin({ ...data.user, token: data.token });
    } catch (requestError) {
      setError(requestError.message);
    } finally { setLoading(false); }
  };

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-mark">✦</div>
      <p className="auth-eyebrow">NEURA AI</p>
      <h1>{mode === 'login' ? 'Welcome back.' : 'Create your space.'}</h1>
      <p className="auth-copy">A focused workspace for your next good idea.</p>
      <form onSubmit={submit} className="auth-form">
        {mode === 'signup' && <label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" placeholder="Your name" /></label>}
        <label>Email<input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" type="email" placeholder="you@example.com" /></label>
        <label>Password<input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" placeholder="At least 6 characters" /></label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
    </section>
  </main>;
}
