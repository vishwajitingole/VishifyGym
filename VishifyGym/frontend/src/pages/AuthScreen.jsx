import { useState } from 'react';
import { Dumbbell, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useGym } from '../state/GymContext';

export function AuthScreen() {
  const { login, register, authenticating, authError } = useGym();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setLocalError(null);
    try {
      if (mode === 'login') await login({ email, password });
      else await register({ name, email, password });
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setLocalError(null);
  };

  return (
    <div className="auth-shell">
      <div className="auth-glow" />
      <section className="auth-card">
        <div className="auth-brand"><span><Dumbbell size={22} /></span><b>VISHIFY<em>GYM</em></b></div>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Log in to pick up your training exactly where you left off.'
            : 'Sign up and your 14-day demo history and full exercise library get seeded automatically.'}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label className="auth-field">
              <span>Your name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vishwajit" required minLength={2} />
            </label>
          )}
          <label className="auth-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>

          {(localError || authError) && <p className="auth-error">{(localError || authError)}</p>}

          <button className="auth-submit" type="submit" disabled={loading || authenticating}>
            {loading ? <Loader2 className="spin" size={17} /> : mode === 'login' ? <LogIn size={17} /> : <UserPlus size={17} />}
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>New here? <button onClick={() => switchMode('register')}>Create an account</button></p>
          ) : (
            <p>Already have an account? <button onClick={() => switchMode('login')}>Log in</button></p>
          )}
        </div>
      </section>
    </div>
  );
}