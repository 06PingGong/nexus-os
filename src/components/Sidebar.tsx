'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  BarChart3, 
  BookMarked,
  Settings,
  LogOut,
  Globe
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: '仪表盘', icon: LayoutDashboard, path: '/' },
    { name: '学术中心', icon: BookOpen, path: '/scholar' },
    { name: '新闻中心', icon: Globe, path: '/news' },
    { name: '任务管理', icon: CheckSquare, path: '/tasks' },
    { name: '数据分析', icon: BarChart3, path: '/analytics' },
    { name: '随记', icon: BookMarked, path: '/journal' },
  ];

  return (
    <>
      <aside className="sidebar-container desktop-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-logo">
            <motion.div 
              className="logo-icon"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              N
            </motion.div>
            <span className="logo-text">Nexus OS</span>
          </div>

          <nav className="sidebar-nav">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link 
                    href={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <div className="icon-wrapper">
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="nav-label">{item.name}</span>
                    {isActive && (
                      <motion.div 
                        className="active-indicator"
                        layoutId="activeIndicator"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="avatar">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="用户" />
              </div>
              <div className="user-info">
                <span className="user-name">Aris 博士</span>
                <span className="user-role">首席研究员</span>
              </div>
            </div>
            
            <div className="footer-actions">
              <button className="footer-btn" title="设置">
                <Settings size={16} />
              </button>
              <button className="footer-btn logout" title="登出">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-container {
          width: 260px;
          height: calc(100vh - 2rem);
          position: sticky;
          top: 1rem;
          z-index: 100;
        }

        .sidebar-content {
          height: 100%;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 2rem;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .sidebar-logo {
          padding: 0 1rem;
          margin-bottom: 3rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: var(--primary);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: white;
          font-size: 1.1rem;
          box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
        }

        .logo-text {
          font-weight: 700;
          font-size: 1.2rem;
          color: #1d1d1f;
          letter-spacing: -0.5px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          color: #86868b;
          transition: all 0.2s;
          text-decoration: none;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(0, 0, 0, 0.03);
          color: #1d1d1f;
        }

        .nav-item.active {
          color: var(--primary);
          background: rgba(0, 113, 227, 0.05);
        }

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .nav-label {
          font-size: 0.95rem;
          font-weight: 500;
        }

        .active-indicator {
          position: absolute;
          left: 0;
          width: 3px;
          height: 20px;
          background: var(--primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding: 1rem 0.5rem 0;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          margin-top: auto;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding: 0 0.5rem;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          overflow: hidden;
          background: #f5f5f7;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1d1d1f;
        }

        .user-role {
          font-size: 0.75rem;
          color: #86868b;
        }

        .footer-actions {
          display: flex;
          gap: 0.5rem;
        }

        .footer-btn {
          flex: 1;
          height: 36px;
          background: rgba(0, 0, 0, 0.03);
          border: none;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #86868b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .footer-btn:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #1d1d1f;
        }

        .footer-btn.logout:hover {
          background: #fee2e2;
          color: #ef4444;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
