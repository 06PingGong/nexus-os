'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Lock, ShieldCheck, Loader2, Cpu } from 'lucide-react';

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

  const devLogin = () => {
    login('888888');
  };

  // 增加一个安全机制：如果加载超过 5 秒还没结束，强制显示
  const [safetyTimeout, setSafetyTimeout] = useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setSafetyTimeout(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !safetyTimeout) {
    return (
      <div className="auth-loading">
        <div className="loading-content">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 size={48} color="#0071e3" />
          </motion.div>
          <p>正在唤醒 Nexus 系统...</p>
        </div>
        <style jsx>{`
          .auth-loading {
            height: 100vh;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          p {
            font-size: 0.9rem;
            color: #86868b;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-overlay">
        <motion.div 
          className="auth-card glass-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="auth-icon-wrapper">
            <motion.div 
              className="auth-icon"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Lock size={44} />
            </motion.div>
          </div>
          <h2>Nexus 系统身份验证</h2>
          <p>请输入 6 位授权码以访问您的个人操作系统</p>
          
          <div className="input-group">
            <input 
              type="password" 
              placeholder="••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            <AnimatePresence>
              {error && (
                <motion.span 
                  className="error-msg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  授权码不正确，请重新核对
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <button className="login-btn" onClick={handleLogin}>
            <ShieldCheck size={20} /> 验证并进入
          </button>

          <div className="dev-mode">
            <button className="dev-btn" onClick={devLogin}>
              <Cpu size={14} /> 开发者预览模式
            </button>
          </div>
        </motion.div>

        <style jsx>{`
          .auth-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at center, #ffffff 0%, #f5f5f7 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          
          .auth-card {
            width: 420px;
            padding: 4rem 2.5rem;
            text-align: center;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 30px 60px rgba(0,0,0,0.1);
          }

          .auth-icon-wrapper {
            margin-bottom: 2rem;
            display: flex;
            justify-content: center;
          }

          .auth-icon {
            width: 80px;
            height: 80px;
            background: var(--primary);
            color: white;
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 15px 30px rgba(0, 113, 227, 0.3);
          }

          h2 {
            font-size: 1.75rem;
            font-weight: 800;
            margin-bottom: 0.75rem;
            color: #1d1d1f;
            letter-spacing: -1px;
          }

          p {
            font-size: 0.95rem;
            color: #86868b;
            margin-bottom: 2.5rem;
            line-height: 1.5;
          }

          .input-group {
            margin-bottom: 2rem;
            position: relative;
          }

          input {
            width: 100%;
            padding: 1.25rem;
            border-radius: 16px;
            border: 2px solid rgba(0, 0, 0, 0.05);
            background: rgba(255, 255, 255, 0.5);
            text-align: center;
            font-size: 1.5rem;
            letter-spacing: 0.5em;
            outline: none;
            transition: all 0.2s;
            color: #1d1d1f;
          }

          input:focus {
            border-color: var(--primary);
            background: white;
            box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
          }

          .error-msg {
            color: #ef4444;
            font-size: 0.85rem;
            font-weight: 500;
            position: absolute;
            bottom: -1.75rem;
            left: 0;
            right: 0;
          }

          .login-btn {
            width: 100%;
            padding: 1.1rem;
            background: #1d1d1f;
            color: white;
            border: none;
            border-radius: 16px;
            font-weight: 600;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .login-btn:hover {
            background: #000000;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          }

          .dev-mode {
            margin-top: 2.5rem;
          }

          .dev-btn {
            background: none;
            border: none;
            color: #86868b;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin: 0 auto;
            opacity: 0.6;
            transition: opacity 0.2s;
          }

          .dev-btn:hover {
            opacity: 1;
            color: var(--primary);
          }

          .auth-loading {
            height: 100vh;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
