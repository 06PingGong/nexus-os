'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, login, loading } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (login(password)) {
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-overlay">
        <div className="auth-card glass-card">
          <div className="auth-icon">
            <Lock size={40} />
          </div>
          <h2>Nexus 系统门禁</h2>
          <p>请输入 6 位访问授权码以进入个人操作系统</p>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="授权码..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            {error && <span className="error-msg">验证失败，请重新输入</span>}
          </div>
          <button className="login-btn" onClick={handleLogin}>
            <ShieldCheck size={18} /> 确认身份
          </button>
        </div>

        <style jsx>{`
          .auth-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          
          .auth-card {
            width: 380px;
            padding: 3rem 2rem;
            text-align: center;
            background: #ffffff;
            border: 1px solid #f4f4f5;
            box-shadow: 0 10px 40px rgba(0,0,0,0.05);
            border-radius: 24px;
          }

          .auth-icon {
            color: #18181b;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: center;
          }

          h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
          }

          p {
            font-size: 0.9rem;
            color: #71717a;
            margin-bottom: 2rem;
          }

          .input-group {
            margin-bottom: 1.5rem;
            position: relative;
          }

          input {
            width: 100%;
            padding: 1rem;
            border-radius: 12px;
            border: 1px solid #e4e4e7;
            background: #fafafa;
            text-align: center;
            font-size: 1.25rem;
            letter-spacing: 0.2em;
            outline: none;
            transition: border-color 0.2s;
          }

          input:focus {
            border-color: #18181b;
          }

          .error-msg {
            color: #ef4444;
            font-size: 0.75rem;
            position: absolute;
            bottom: -1.5rem;
            left: 0;
            right: 0;
          }

          .login-btn {
            width: 100%;
            padding: 1rem;
            background: #18181b;
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            cursor: pointer;
            transition: opacity 0.2s;
          }

          .login-btn:hover {
            opacity: 0.9;
          }

          .auth-loading {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #a1a1aa;
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
