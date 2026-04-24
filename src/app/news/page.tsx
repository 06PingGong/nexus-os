'use client';

import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Search, 
  Cpu, 
  Globe, 
  Gavel, 
  Flag,
  Clock,
  RefreshCw,
  ExternalLink,
  Loader2,
  ChevronRight
} from 'lucide-react';

const CATEGORIES = [
  { id: '科技', icon: <Cpu size={18} />, color: '#3b82f6' },
  { id: '国内时政', icon: <Flag size={18} />, color: '#ef4444' },
  { id: '法律', icon: <Gavel size={18} />, color: '#18181b' },
  { id: '国际实事', icon: <Globe size={18} />, color: '#10b981' }
];

const NewsPage = () => {
  const [activeTab, setActiveTab] = useState('科技');
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async (cat: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/news?cat=${cat}`);
      const data = await response.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch news failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(activeTab);
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
          实时连接中
        </div>
      </header>

      <div className="page-layout">
        <aside className="sidebar">
          <div className="section-card glass-card">
            <h3>板块</h3>
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

          <button className="refresh-btn glass-card" onClick={() => fetchNews(activeTab)}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 刷新资讯流
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
              <p>正在从全球资讯网同步最新动态...</p>
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
                        <Clock size={12} /> {item.date?.split(' ')[0] || '刚刚'}
                      </span>
                      <span className="source">{item.source}</span>
                    </div>
                    <h3>{item.title}</h3>
                  </div>
                  <div className="card-arrow">
                    <ChevronRight size={20} />
                  </div>
                </div>
              ))}
              {news.length === 0 && (
                <div className="empty-state">暂无资讯，请尝试点击刷新。</div>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .news-page { max-width: 1100px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .title-area { display: flex; align-items: center; gap: 0.75rem; }
        .title-area h1 { font-size: 1.75rem; font-weight: 700; color: #18181b; }
        .title-icon { color: #18181b; }
        .conn-status { font-size: 0.75rem; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 0.5rem; background: #ecfdf5; padding: 0.3rem 0.6rem; border-radius: 20px; }
        .status-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }

        .page-layout { display: grid; grid-template-columns: 240px 1fr; gap: 2rem; }
        .sidebar { display: flex; flex-direction: column; gap: 1rem; }
        .glass-card { background: #ffffff; border: 1px solid #f4f4f5; border-radius: 16px; padding: 1.25rem; }
        
        .section-card h3 { font-size: 0.8rem; font-weight: 700; color: #a1a1aa; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .nav-list { display: flex; flex-direction: column; gap: 0.4rem; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: none; background: transparent; border-radius: 10px; font-size: 0.9rem; font-weight: 600; color: #52525b; cursor: pointer; transition: all 0.2s; text-align: left; }
        .nav-item:hover { background: #f4f4f5; color: #18181b; }
        .nav-item.active { background: #18181b; color: #ffffff; }
        .nav-item .icon { display: flex; align-items: center; justify-content: center; width: 24px; }
        
        .refresh-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-weight: 700; font-size: 0.9rem; cursor: pointer; border: 1px solid #e4e4e7; transition: all 0.2s; }
        .refresh-btn:hover { background: #f4f4f5; }

        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .list-header h2 { font-size: 1.25rem; font-weight: 700; }
        .meta { font-size: 0.75rem; color: #a1a1aa; font-weight: 600; }

        .news-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .news-card { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; cursor: pointer; transition: all 0.2s; border: 1px solid #f4f4f5; }
        .news-card:hover { transform: translateX(5px); border-color: #18181b; }
        
        .card-meta { display: flex; gap: 1rem; align-items: center; margin-bottom: 0.6rem; }
        .cat-tag { font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 4px; }
        .time { font-size: 0.75rem; color: #a1a1aa; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; }
        .source { font-size: 0.75rem; color: #a1a1aa; font-weight: 600; }
        
        .card-info h3 { font-size: 1.15rem; font-weight: 700; color: #18181b; line-height: 1.4; }
        .card-arrow { color: #e4e4e7; }
        .news-card:hover .card-arrow { color: #18181b; }

        .loading-state { padding: 8rem 0; text-align: center; color: #a1a1aa; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .empty-state { padding: 4rem; text-align: center; color: #a1a1aa; border: 1px dashed #e4e4e7; border-radius: 16px; }
      `}</style>
    </div>
  );
};

export default NewsPage;
