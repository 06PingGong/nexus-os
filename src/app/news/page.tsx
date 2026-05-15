'use client';

import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Cpu, 
  Globe, 
  Flag,
  Clock,
  RefreshCw,
  ChevronRight,
  Loader2
} from 'lucide-react';

const CATEGORIES = [
  { id: '科技', icon: <Cpu size={18} />, color: '#3b82f6' },
  { id: '国内时政', icon: <Flag size={18} />, color: '#ef4444' },
  { id: '国际实事', icon: <Globe size={18} />, color: '#10b981' }
];

const NewsPage = () => {
  const [activeTab, setActiveTab] = useState('科技');
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchNews = async (cat: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/news?cat=${cat}`);
      const data = await response.json();
      setNews(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Fetch news failed:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 初始加载和切换 Tab 加载
  useEffect(() => {
    fetchNews(activeTab);
  }, [activeTab]);

  // 实时自动更新逻辑：每 5 分钟自动更新一次
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(`Auto-refreshing ${activeTab} news...`);
      fetchNews(activeTab, true); // 静默更新
    }, 300000); // 300,000 ms = 5 minutes

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="news-page">
      <header className="page-header">
        <div className="title-area">
          <Newspaper size={28} className="title-icon" />
          <h1>新闻中心</h1>
        </div>
        <div className="conn-status">
          <div className="status-dot pulse"></div>
          系统已接网 · 自动实时同步中
        </div>
      </header>

      <div className="page-layout">
        <aside className="sidebar">
          <div className="section-card glass-card">
            <h3>聚焦板块</h3>
            <div className="nav-list">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  className={`nav-item ${activeTab === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(cat.id)}
                >
                  <span className="icon" style={{ color: activeTab === cat.id ? '#fff' : cat.color }}>
                    {cat.icon}
                  </span>
                  {cat.id}
                </button>
              ))}
            </div>
          </div>

          <div className="info-card glass-card">
            <div className="info-item">
              <Clock size={14} />
              <span>上次更新: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <p className="refresh-hint">系统每 5 分钟自动同步一次</p>
          </div>

          <button className="refresh-btn glass-card" onClick={() => fetchNews(activeTab)}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 强制刷新资讯流
          </button>
        </aside>

        <main className="content-area">
          <div className="list-header">
            <h2>{activeTab} · 实时快讯</h2>
            <span className="meta">显示最新 {news.length} 条</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin" size={32} />
              <p>正在跨越网关同步最新动态...</p>
            </div>
          ) : (
            <div className="news-list">
              {news.map((item, i) => (
                <div key={i} className="news-card glass-card" onClick={() => window.open(item.link, '_blank')}>
                  <div className="card-info">
                    <div className="card-meta">
                      <span className="cat-tag" style={{ 
                        background: CATEGORIES.find(c => c.id === activeTab)?.color + '15',
                        color: CATEGORIES.find(c => c.id === activeTab)?.color
                      }}>
                        {activeTab}
                      </span>
                      <span className="time">
                        {item.date?.split(' ')[0] || '刚刚'}
                      </span>
                      <span className="source">来源: {item.source}</span>
                    </div>
                    <h3>{item.title}</h3>
                  </div>
                  <div className="card-arrow">
                    <ChevronRight size={20} />
                  </div>
                </div>
              ))}
              {news.length === 0 && (
                <div className="empty-state">暂无资讯，请尝试点击强制刷新。</div>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .news-page { max-width: 1100px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .title-area { display: flex; align-items: center; gap: 0.75rem; }
        .title-area h1 { font-size: 1.75rem; font-weight: 800; color: #18181b; letter-spacing: -1px; }
        .title-icon { color: #18181b; }
        .conn-status { font-size: 0.75rem; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 0.5rem; background: #ecfdf5; padding: 0.4rem 0.8rem; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.2); }
        .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }

        .page-layout { display: grid; grid-template-columns: 260px 1fr; gap: 2rem; }
        .sidebar { display: flex; flex-direction: column; gap: 1rem; }
        .glass-card { background: #ffffff; border: 1px solid #f4f4f5; border-radius: 16px; padding: 1.5rem; }
        
        .section-card h3 { font-size: 0.75rem; font-weight: 700; color: #a1a1aa; margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.1em; }
        .nav-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1rem; border: none; background: transparent; border-radius: 12px; font-size: 0.95rem; font-weight: 600; color: #52525b; cursor: pointer; transition: all 0.2s; text-align: left; }
        .nav-item:hover { background: #f4f4f5; color: #18181b; }
        .nav-item.active { background: #18181b; color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .nav-item .icon { display: flex; align-items: center; justify-content: center; width: 24px; }
        
        .info-card { background: #f9fafb; border-color: #f3f4f6; padding: 1rem; }
        .info-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #71717a; font-weight: 600; margin-bottom: 0.4rem; }
        .refresh-hint { font-size: 0.65rem; color: #a1a1aa; font-weight: 500; }

        .refresh-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-weight: 700; font-size: 0.9rem; cursor: pointer; border: 1px solid #e4e4e7; transition: all 0.2s; padding: 1rem; }
        .refresh-btn:hover { background: #18181b; color: white; border-color: #18181b; }

        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .list-header h2 { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; }
        .meta { font-size: 0.8rem; color: #a1a1aa; font-weight: 600; }

        .news-list { display: flex; flex-direction: column; gap: 1rem; }
        .news-card { display: flex; justify-content: space-between; align-items: center; padding: 1.75rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid #f4f4f5; }
        .news-card:hover { transform: translateX(8px); border-color: #18181b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
        
        .card-meta { display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; }
        .cat-tag { font-size: 0.6rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px; letter-spacing: 0.05em; }
        .time { font-size: 0.75rem; color: #a1a1aa; font-weight: 600; }
        .source { font-size: 0.75rem; color: #a1a1aa; font-weight: 600; }
        
        .card-info h3 { font-size: 1.2rem; font-weight: 700; color: #18181b; line-height: 1.5; }
        .card-arrow { color: #e4e4e7; transition: transform 0.2s; }
        .news-card:hover .card-arrow { color: #18181b; transform: translateX(3px); }

        .loading-state { padding: 10rem 0; text-align: center; color: #a1a1aa; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .empty-state { padding: 4rem; text-align: center; color: #a1a1aa; border: 1px dashed #e4e4e7; border-radius: 16px; }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
          .page-layout { grid-template-columns: 1fr; }
          .nav-list { flex-direction: row; overflow-x: auto; white-space: nowrap; padding-bottom: 0.5rem; }
          .nav-item { flex-shrink: 0; padding: 0.6rem 1rem; }
          .section-card h3 { display: none; }
          .card-meta { flex-wrap: wrap; }
          .list-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        }
      `}</style>
    </div>
  );
};

export default NewsPage;
