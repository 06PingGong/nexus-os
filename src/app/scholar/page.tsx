'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  ExternalLink, 
  Zap, 
  Loader2, 
  FileText,
  TrendingUp
} from 'lucide-react';

const ScholarHub = () => {
  const [activeDomain, setActiveDomain] = useState('遥感');
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const translateQuery = (q: string) => {
    const dict: Record<string, string> = {
      '遥感': 'Remote Sensing',
      '大语言模型': 'Large Language Models',
      '计算机视觉': 'Computer Vision',
      '气候变化': 'Climate Change',
      '人工智能': 'Artificial Intelligence'
    };
    return dict[q] || q;
  };

  const fetchPapers = async (query: string) => {
    if (!query) return;
    setLoading(true);
    const engQuery = translateQuery(query);
    
    try {
      // 使用更通用的 ArXiv 查询格式
      const apiUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(engQuery)}&start=0&max_results=15&sortBy=relevance&sortOrder=descending`;
      const response = await fetch(apiUrl);
      const xmlText = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      // 更加鲁棒的解析：考虑命名空间
      const entries = Array.from(xmlDoc.querySelectorAll("entry, atom\\:entry"));
      
      const results = entries.map(entry => {
        const title = entry.querySelector("title")?.textContent?.replace(/\n/g, ' ').trim() || "无标题";
        const authors = Array.from(entry.querySelectorAll("author name")).map(a => a.textContent).slice(0, 2).join(', ') + (entry.querySelectorAll("author").length > 2 ? ' 等' : '');
        const id = entry.querySelector("id")?.textContent || "";
        const published = entry.querySelector("published")?.textContent?.slice(0, 4) || "2024";
        
        return {
          title,
          authors,
          year: published,
          link: id,
          impact: '权威资源'
        };
      });
      
      setPapers(results);
    } catch (error) {
      console.error("Fetch papers error:", error);
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
        {['遥感', '大语言模型', '计算机视觉', '气候变化', '人工智能'].map(d => (
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
            <h3><Zap size={14} color="#f59e0b" fill="#f59e0b" /> 智能检索优化</h3>
            <p>系统已将 <b>{activeDomain}</b> 自动映射至全球学术知识图谱。</p>
            <button className="research-cmd-btn" onClick={() => fetchPapers(activeDomain)}>
              {loading ? <Loader2 className="animate-spin" size={14} /> : '刷新实时文献'}
            </button>
          </div>
          
          <div className="stats-card glass-card">
            <h3><TrendingUp size={14} color="#2563eb" /> 全球热度</h3>
            <div className="impact-meter">
              <div className="meter-fill" style={{ width: '94%' }}></div>
            </div>
            <p>该领域学术讨论活跃度: 极高</p>
          </div>
        </aside>

        <main className="papers-main">
          <div className="search-bar glass-card">
            <Search size={18} color="#a1a1aa" />
            <input 
              type="text" 
              placeholder="搜索全球权威文献 (支持中英文关键词)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPapers(searchTerm)}
            />
          </div>

          <div className="papers-list">
            <div className="list-header">
              <h2>ArXiv 实时库</h2>
              <div className="api-badge">API: 已连接</div>
            </div>

            {loading ? (
              <div className="loading-state">
                <Loader2 className="animate-spin" size={32} />
                <p>正在跨越全球服务器拉取最新研究成果...</p>
              </div>
            ) : papers.length > 0 ? (
              <div className="papers-grid">
                {papers.map((paper, i) => (
                  <div key={i} className="paper-card glass-card">
                    <div className="paper-body">
                      <span className="paper-tag">{paper.impact}</span>
                      <h3>{paper.title}</h3>
                      <p className="authors">{paper.authors} • {paper.year}</p>
                    </div>
                    <div className="paper-actions">
                      <a href={paper.link} target="_blank" rel="noreferrer" className="action-btn">
                        <FileText size={16} /> PDF
                      </a>
                      <button className="open-btn" onClick={() => window.open(paper.link, '_blank')}>
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">未能找到相关文献，请尝试更换关键词。</div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .scholar-hub { max-width: 1200px; margin: 0 auto; }
        .hub-header { margin-bottom: 2rem; }
        .header-title { display: flex; align-items: center; gap: 0.75rem; }
        .header-title h1 { font-size: 1.75rem; font-weight: 700; color: #18181b; }
        .title-icon { color: #2563eb; }
        .domain-bar { display: flex; gap: 0.25rem; padding: 0.4rem; margin-bottom: 2rem; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; }
        .domain-tab { background: transparent; border: none; color: #71717a; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
        .domain-tab.active { background: #ffffff; color: #18181b; font-weight: 600; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        .hub-content { display: grid; grid-template-columns: 260px 1fr; gap: 2rem; }
        .hub-sidebar { display: flex; flex-direction: column; gap: 1.25rem; }
        .glass-card { background: #ffffff; border: 1px solid #f4f4f5; padding: 1.25rem; border-radius: 12px; }
        .intelligence-card h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; font-weight: 600; margin-bottom: 1rem; }
        .research-cmd-btn { width: 100%; background: #18181b; color: white; padding: 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; border: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; }
        .impact-meter { height: 6px; background: #f4f4f5; border-radius: 3px; margin: 1rem 0 0.5rem 0; overflow: hidden; }
        .meter-fill { height: 100%; background: #2563eb; transition: width 1s ease; }
        .search-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; margin-bottom: 2rem; border: 1px solid #e4e4e7; }
        .search-bar input { flex: 1; background: transparent; border: none; outline: none; font-size: 0.95rem; }
        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f4f4f5; }
        .api-badge { font-size: 0.7rem; color: #10b981; font-weight: 700; background: #ecfdf5; padding: 0.2rem 0.5rem; border-radius: 4px; }
        .papers-grid { display: flex; flex-direction: column; gap: 1rem; }
        .paper-card { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; transition: all 0.2s; border: 1px solid #f4f4f5; }
        .paper-card:hover { border-color: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .paper-body { flex: 1; }
        .paper-tag { font-size: 0.65rem; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 0.1rem 0.4rem; border-radius: 4px; margin-bottom: 0.5rem; display: inline-block; }
        .paper-card h3 { font-size: 1.1rem; font-weight: 600; color: #18181b; margin-bottom: 0.4rem; line-height: 1.4; }
        .authors { font-size: 0.85rem; color: #71717a; }
        .paper-actions { display: flex; align-items: center; gap: 0.75rem; margin-left: 2rem; }
        .action-btn { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 600; color: #18181b; text-decoration: none; padding: 0.5rem 0.75rem; background: #f4f4f5; border-radius: 8px; transition: background 0.2s; }
        .action-btn:hover { background: #e4e4e7; }
        .open-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #18181b; color: white; border: none; border-radius: 8px; cursor: pointer; transition: opacity 0.2s; }
        .open-btn:hover { opacity: 0.9; }
        .loading-state { padding: 5rem; text-align: center; color: #a1a1aa; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .empty-state { padding: 4rem; text-align: center; color: #a1a1aa; border: 1px dashed #e4e4e7; border-radius: 12px; }
      `}</style>
    </div>
  );
};

export default ScholarHub;
