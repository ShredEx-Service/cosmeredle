import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import './AuthModal.css';

export default function AuthModal({ mode, onClose, onSwitch }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (mode === 'signin') {
      const err = await signIn(email, password);
      if (err) setError(err.message);
      else onClose();
    } else {
      if (!username.trim()) { setError('Username is required'); setLoading(false); return; }
      const err = await signUp(email, password, username.trim());
      if (err) { setError(err.message); }
      else {
        const signInErr = await signIn(email, password);
        if (signInErr) setError('Account created! Please sign in.');
        else onClose();
      }
    }
    setLoading(false);
  }

  return createPortal(
    <div className="auth-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>✕</button>
        <h2 className="auth-title">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>

        {success ? (
          <p className="auth-success">{success}</p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <input
                className="auth-input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            )}
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          {mode === 'signin' ? (
            <>No account? <button onClick={() => onSwitch('signup')}>Create one</button></>
          ) : (
            <>Already have one? <button onClick={() => onSwitch('signin')}>Sign in</button></>
          )}
        </p>
      </div>
    </div>,
    document.body
  );
}
