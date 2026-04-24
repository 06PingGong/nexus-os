'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">N</div>
        <span className="logo-text">极简系统</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="nav-label">{item.name}</span>
            </Link>
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

      <style jsx>{`
        .sidebar {
          width: 240px;
          background: #ffffff;
          border-right: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          padding: 1.5rem 0;
          z-index: 100;
        }

        .sidebar-logo {
          padding: 0 1.5rem;
          margin-bottom: 2.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          width: 28px;
          height: 28px;
          background: #18181b;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: white;
          font-size: 1rem;
        }

        .logo-text {
          font-weight: 600;
          font-size: 1.1rem;
          color: #18181b;
          letter-spacing: -0.5px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 0 1rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 0.8rem 1rem;
          border-radius: 10px;
          color: #71717a;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
        }

        .nav-item:hover {
          background: #f4f4f5;
          color: #18181b;
        }

        .nav-item.active {
          background: #f4f4f5;
          color: #2563eb;
          font-weight: 500;
        }

        .nav-label {
          font-size: 0.9rem;
        }

        .sidebar-footer {
          padding: 1rem 0.75rem;
          border-top: 1px solid #f0f0f0;
          margin-top: auto;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1rem;
          padding: 0 0.5rem;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: #f4f4f5;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #18181b;
        }

        .user-role {
          font-size: 0.7rem;
          color: #a1a1aa;
        }

        .footer-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0 0.5rem;
        }

        .footer-btn {
          flex: 1;
          height: 32px;
          background: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #71717a;
          cursor: pointer;
          transition: all 0.2s;
        }

        .footer-btn:hover {
          background: #f4f4f5;
          color: #18181b;
          border-color: #d4d4d8;
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            bottom: 0;
            top: auto;
            width: 100%;
            height: auto;
            flex-direction: row;
            padding: 0.5rem;
            border-right: none;
            border-top: 1px solid #f0f0f0;
            justify-content: space-around;
          }

          .sidebar-logo, .sidebar-footer, .nav-label {
            display: none;
          }

          .sidebar-nav {
            flex-direction: row;
            width: 100%;
            justify-content: space-around;
            padding: 0;
          }

          .nav-item {
            padding: 0.5rem;
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
