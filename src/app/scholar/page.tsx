'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  BookOpen, 
  Search, 
  Plus, 
  ExternalLink, 
  Star,
  Zap,
  TrendingUp,
  FileText,
  Flame,
  Clock,
  Loader2
} from 'lucide-react';

const ScholarHub = () => {
  const [activeDomain, setActiveDomain] = useState('遥感');
  const [filter, setFilter] = useState('hot');
  const [domains, setDomains] = useState(['遥感', '大语言模型', '计算机视觉', '气候变化']);
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 真实 ArXiv API 抓取逻辑
  const fetchPapers = async (query: string) => {
    setLoading(true);
    try {
      // 使用 ArXiv API 搜索
      const response = await fetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10`);
      const data = await response.text();
      
      // 简易 XML 解析 (提取 title, authors, link)
      const parser = new DOMParser();
      const xml = parser.parseFromString(data, "text/xml");
      const entries = xml.getElementsByTagName("entry");
      
      const results = Array.from(entries).map(entry => ({
        title: entry.getElementsByTagName("title")[0].textContent?.replace(/\n/g, ' ').trim(),
        authors: Array.from(entry.getElementsByTagName("author")).map(a => a.textContent?.trim()).slice(0, 2).join(', ') + ' 等',
        journal: 'ArXiv Pre-print',
        year: entry.getElementsByTagName("published")[0].textContent?.slice(0, 4),
        citations: Math.floor(Math.random() * 100), // ArXiv API 不提供引用数，此处模拟
        impact: '权威发布',
        link: entry.getElementsByTagName("id")[0].textContent,
      }));
      
      setPapers(results);
    } catch (error) {
      console.error("Fetch papers failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers(activeDomain);
  }, [activeDomain]);

  return (
    <div className="scholar-hub">
      <header className="hub-header">
        <div className="header-title">
          <BookOpen size={28} className="title-icon" />
          <h1>学术中心</h1>
        </div>
      </header>

      <div className="domain-bar glass-card">
        {domains.map(d => (
          <button 
            key={d} 
            className={`domain-tab ${activeDomain === d ? 'active' : ''}`}
            onClick={() => setActiveDomain(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="hub-content">
        <aside className="hub-sidebar">
          <div className="intelligence-card glass-card">
            <h3><Zap size={14} /> 实时情报</h3>
            <p>正在监控 ArXiv 上关于 <b>{activeDomain}</b> 的最新动态。</p>
            <button className="research-cmd-btn" onClick={() => fetchPapers(activeDomain)}>
              {loading ? <Loader2 className="animate-spin" size={14} /> : '刷新实时文献'}
            </button>
          </div>

          <div className="stats-card glass-card">
            <h3><TrendingUp size={14} /> 全球趋势</h3>
            <div className="impact-meter">
              <div className="meter-fill" style={{ width: '85%' }}></div>
            </div>
            <p>当前领域热度: 极高</p>
          </div>
        </aside>

        <main className="papers-main">
          <div className="search-bar glass-card">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={`搜索 ArXiv 全球文献库...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPapers(searchTerm)}
            />
          </div>

          <div className="papers-list">
            <div className="list-header">
              <h2>ArXiv 实时发现</h2>
              <div className="filters">
                <span className="api-status">API: 已连接</span>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <Loader2 className="animate-spin" size={32} />
                <p>正在从全球服务器抓取权威文献...</p>
              </div>
            ) : papers.length > 0 ? papers.map((paper, i) => (
              <div key={i} className="paper-card glass-card">
                <div className="paper-info">
                  <div className="paper-tag">{paper.impact}</div>
                  <h3>{paper.title}</h3>
                  <p className="authors">{paper.authors} • {paper.journal}, {paper.year}</p>
                  <div className="paper-meta">
                    <a href={paper.link} target="_blank" rel="noreferrer" className="pdf-link">
                      <FileText size={12} /> 查看 PDF 原文
                    </a>
                  </div>
                </div>
                <button className="open-link-btn" onClick={() => window.open(paper.link, '_blank')}>
                  <ExternalLink size={18} />
                </button>
              </div>
            )) : (
              <div className="empty-state">未能找到相关文献，请尝试更换关键词。</div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .scholar-hub {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hub-header {
          margin-bottom: 2rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-title h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #18181b;
        }

        .title-icon {
          color: #2563eb;
        }

        .domain-bar {
          display: flex;
          gap: 0.25rem;
          padding: 0.4rem;
          margin-bottom: 2rem;
          background: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
        }

        .domain-tab {
          background: transparent;
          border: none;
          color: #71717a;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .domain-tab.active {
          background: #ffffff;
          color: #18181b;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .hub-content {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 2rem;
        }

        .hub-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .glass-card {
          background: #ffffff;
          border: 1px solid #f4f4f5;
          padding: 1.25rem;
          border-radius: 12px;
        }

        .intelligence-card h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .research-cmd-btn {
          width: 100%;
          background: #18181b;
          color: white;
          padding: 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .impact-meter {
          height: 6px;
          background: #f4f4f5;
          border-radius: 3px;
          margin: 1rem 0 0.5rem 0;
          overflow: hidden;
        }

        .meter-fill {
          height: 100%;
          background: #2563eb;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          margin-bottom: 2rem;
          border: 1px solid #e4e4e7;
        }

        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.95rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 5rem;
          color: #a1a1aa;
          gap: 1rem;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .paper-card {
          padding: 1.5rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .paper-tag {
          display: inline-block;
          background: #eff6ff;
          color: #2563eb;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .paper-card h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }

        .authors {
          color: #71717a;
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
        }

        .pdf-link {
          color: #2563eb;
          text-decoration: none;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .open-link-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f9fafb;
          border: 1px solid #e4e4e7;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .api-status {
          font-size: 0.7rem;
          color: #10b981;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ScholarHub;
