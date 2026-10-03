"use client";
import { useState } from 'react';

export default function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAdminMode) {
      // Simulate Admin Login
      if (email === 'admin@travel.com' && password === 'admin123') {
        localStorage.setItem('user', JSON.stringify({ email, name: 'Admin', role: 'admin' }));
        onAuthSuccess();
      } else {
        alert("Invalid Admin credentials!");
      }
      return;
    }

    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

    if (isLogin) {
      // Simulate User Login
      if (email && password) {
        const userExists = registeredUsers.find(u => u.email === email && u.password === password);
        if (userExists) {
          localStorage.setItem('user', JSON.stringify({ email, name: userExists.name, role: 'user' }));
          onAuthSuccess();
        } else {
          alert("user doesnot exist register first");
        }
      } else {
        alert("Please enter both email and password.");
      }
    } else {
      // Simulate Registration
      if (email && password && name) {
        const userExists = registeredUsers.find(u => u.email === email);
        if (userExists) {
          alert("User already exists! Please login.");
        } else {
          registeredUsers.push({ email, password, name });
          localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
          alert("Registration successful! Please login.");
          setIsLogin(true); // Switch back to login view
        }
      } else {
        alert("Please fill all fields to register.");
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: 'url(/new-bg-india.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      {/* Dark overlay to make modal readable against the background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      
      <div className="card glass animate-fade-in" style={{ width: '100%', maxWidth: '400px', margin: '0 1rem', position: 'relative', zIndex: 1 }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {isAdminMode ? 'Admin Access' : (isLogin ? 'Welcome Back' : 'Create an Account')}
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <span 
            onClick={() => { setIsAdminMode(false); setIsLogin(true); }}
            style={{ fontWeight: !isAdminMode ? 'bold' : 'normal', color: !isAdminMode ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            User Login
          </span>
          <span 
            onClick={() => setIsAdminMode(true)}
            style={{ fontWeight: isAdminMode ? 'bold' : 'normal', color: isAdminMode ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Admin Login
          </span>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && !isAdminMode && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder={isAdminMode ? "admin@travel.com" : "you@example.com"} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
            {isAdminMode ? 'Login as Admin' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        {!isAdminMode && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <span 
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }} 
                  onClick={() => setIsLogin(false)}
                >
                  Register now
                </span>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <span 
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }} 
                  onClick={() => setIsLogin(true)}
                >
                  Login here
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
