"use client";
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../components/ThemeProvider';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null; // Should never happen due to AuthProvider protection

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', marginBottom: '2rem' }}>
        <h1 className="animate-fade-in">Settings</h1>
        <p className="animate-fade-in" style={{ fontSize: '1.25rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
          Manage your account and preferences.
        </p>
      </div>

      <div className="card animate-fade-in glass" style={{ maxWidth: '600px', margin: '0 auto', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Account Details</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Name</label>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.name}</p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Email Address</label>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.email}</p>
          </div>
        </div>

        <button 
          onClick={logout} 
          className="btn btn-secondary" 
          style={{ marginTop: '2rem', width: '100%', borderColor: 'red', color: 'red' }}
        >
          Log Out
        </button>
      </div>

      <div className="card animate-fade-in glass" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Preferences</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, margin: 0 }}>Application Theme</p>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              Currently using {theme === 'dark' ? 'Dark' : 'Light'} mode.
            </p>
          </div>
          <button onClick={toggleTheme} className="btn btn-primary">
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>
    </main>
  );
}
