'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Search, 
  ArrowRight, 
  Trophy, 
  Target, 
  Activity,
  Zap,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const router = useRouter();
  const { addTask, tasks } = useApp();
  const [command, setCommand] = useState('');
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, text: '系统初始化完成', time: '10分钟前' },
  ]);

  const stats = [
    { label: '已完成任务', value: tasks.filter(t => t.done).length.toString(), icon: Target, color: '#10b981' },
    { label: '阅读论文', value: '4', icon: Trophy, color: '#f59e0b' },
    { label: '学习时长', value: '28h', icon: Activity, color: '#3b82f6' },
    { label: '总任务数', value: tasks.length.toString(), icon: Zap, color: '#ec4899' },
  ];

  const handleCommand = () => {
    const cmd = command.trim();
    if (!cmd) return;
    
    let activityText = '';
    
    // 智能识别：增加任务
    if (cmd.includes('增加') && cmd.includes('任务')) {
      let priority = '中';
      if (cmd.includes('高') || cmd.includes('紧急') || cmd.includes('重要')) priority = '高';
      if (cmd.includes('低') || cmd.includes('不急')) priority = '低';

      const taskText = cmd.replace(/帮我增加一个|帮我增加|增加一个|增加任务|任务|优先级|高|中|低|的/g, '').trim();
      if (taskText) {
        addTask(taskText, '研究', priority);
        activityText = `已自动添加${priority}优先级任务: ${taskText}`;
      }
    } 
    // 智能识别：搜集论文
    else if (cmd.includes('搜集') && cmd.includes('论文')) {
      const domain = cmd.replace(/帮我搜集|论文/g, '').trim();
      activityText = `正在搜集 ${domain} 相关权威论文...`;
      setTimeout(() => {
        router.push('/scholar');
      }, 1500);
    }
    // 通用指令
    else {
      activityText = `指令已执行: ${cmd}`;
    }
    
    const newActivity = {
      id: Date.now(),
      text: activityText,
      time: '刚刚'
    };
    
    setRecentActivities([newActivity, ...recentActivities.slice(0, 4)]);
    setCommand('');
    
    // 视觉反馈
    const feedback = document.createElement('div');
    feedback.className = 'toast-feedback';
    feedback.innerText = '✓ 指令处理中...';
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1>你好，研究员</h1>
        <p>您的全能指挥中心已启动。支持自然语言指令。</p>
      </header>

      <div className="command-section">
        <div className="command-box">
          <Sparkles size={18} className="sparkle-icon" />
          <input 
            type="text" 
            placeholder="尝试输入: 帮我增加一个任务背单词" 
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
          />
          <button className="command-btn" onClick={handleCommand}>
            <ArrowRight size={16} />
          </button>
        </div>
        <p className="command-hint">技巧: 输入“帮我搜集遥感论文”可自动跳转并发现文献</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card glass-card">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}10`, color: stat.color }}>
                <Icon size={20} />
              </div>
              <div className="stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="content-grid">
        <section className="activity-section glass-card">
          <div className="section-header">
            <h2>执行反馈</h2>
            <Link href="/analytics" className="view-all">查看全部</Link>
          </div>
          <div className="activity-list">
            {recentActivities.map(act => (
              <div key={act.id} className="activity-item">
                <div className="act-dot"></div>
                <div className="act-content">
                  <p>{act.text}</p>
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="quick-nav glass-card">
          <div className="section-header">
            <h2>工作区直达</h2>
          </div>
          <div className="nav-btns">
            <Link href="/tasks" className="nav-btn">
              <CheckCircle2 size={16} /> 任务看板
            </Link>
            <Link href="/scholar" className="nav-btn">
              <BookOpen size={16} /> 学术中心
            </Link>
            <Link href="/journal" className="nav-btn">
              <Plus size={16} /> 快速随记
            </Link>
          </div>
        </section>
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1000px;
          margin: 0 auto;
        }

        .dash-header {
          margin-bottom: 2.5rem;
        }

        .dash-header h1 {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 0.5rem;
          color: #18181b;
        }

        .dash-header p {
          color: #71717a;
          font-size: 1rem;
        }

        .command-section {
          margin-bottom: 3rem;
        }

        .command-box {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.25rem;
          gap: 1rem;
          background: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          transition: border-color 0.2s;
        }

        .command-box:focus-within {
          border-color: #18181b;
        }

        .sparkle-icon {
          color: #2563eb;
        }

        .command-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: #18181b;
          font-size: 1rem;
          outline: none;
        }

        .command-btn {
          background: #18181b;
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .command-hint {
          font-size: 0.75rem;
          color: #a1a1aa;
          margin-top: 0.75rem;
          padding-left: 0.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid #f4f4f5;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info h3 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #18181b;
        }

        .stat-info p {
          color: #71717a;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.5rem;
        }

        .glass-card {
          background: #ffffff;
          border: 1px solid #f4f4f5;
          padding: 1.5rem;
          border-radius: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #18181b;
        }

        .view-all {
          font-size: 0.8rem;
          color: #2563eb;
          text-decoration: none;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .activity-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .act-dot {
          width: 8px;
          height: 8px;
          background: #2563eb;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .act-content p {
          font-size: 0.9rem;
          color: #3f3f46;
          margin-bottom: 0.2rem;
        }

        .act-content span {
          font-size: 0.75rem;
          color: #a1a1aa;
        }

        .nav-btns {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 10px;
          color: #18181b;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: #ffffff;
          border-color: #2563eb;
          color: #2563eb;
          transform: translateX(4px);
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      
      <style jsx global>{`
        .toast-feedback {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: #18181b;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 99px;
          font-size: 0.9rem;
          font-weight: 500;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 2000;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translate(-50%, 1rem); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
