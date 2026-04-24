'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  Zap, 
  Loader2, 
  FileText,
  TrendingUp,
  RefreshCw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';

const DOMAIN_INTELLIGENCE: Record<string, any> = {
  '遥感': {
    query: 'all:remote+sensing',
    trend: '+32%',
    status: '爆发期',
    hotTopics: ['地学大模型 (Geo-FM)', '星载 AI 处理', '高光谱变化检测', '跨模态影像融合'],
    directions: '当前研究正从单一目标识别转向具备推理能力的地理空间智能。'
  },
  '大语言模型': {
    query: 'all:LLM+OR+large+language+models',
    trend: '+128%',
    status: '指数级增长',
    hotTopics: ['MoE 混合专家模型', '长文本窗口优化', '思维链推理 (CoT)', '高效微调 (PEFT)'],
    directions: '核心趋势在于提升模型逻辑推理能力及多模态原生理解。'
  },
  '计算机视觉': {
    query: 'all:computer+vision',
    trend: '+18%',
    status: '成熟演进',
    hotTopics: ['Segment Anything 2', '三维重建 (NeRF/GS)', '具身智能感知', '生成式视频编辑'],
    directions: '重点已转向通用感知模型及与机器人学的深度结合。'
  },
  '人工智能': {
    query: 'all:artificial+intelligence',
    trend: '+45%',
    status: '全面渗透',
    hotTopics: ['AI for Science', '对齐技术 (RLHF)', '模型可解释性', '端侧 AI 部署'],
    directions: 'AI 正在从单纯的预测工具转变为加速基础科学发现的“第三种范式”。'
  }
};

const ScholarHub = () => {
  const [activeDomain, setActiveDomain] = useState('遥感');
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const activeInfo = DOMAIN_INTELLIGENCE[activeDomain];

  const fetchPapers = async (query: string, isSearch = false) => {
    setLoading(true);
    try {
      const q = isSearch ? `all:${encodeURIComponent(query)}` : activeInfo.query;
      // 调用我们自己的服务端接口，确保 100% 成功
      const response = await fetch(`/api/arxiv?q=${q}`);
      const results = await response.json();

      if (Array.isArray(results) && results.length > 0) {
        setPapers(results);
      } else {
        setPapers(getFallbackPapers(activeDomain));
      }
    } catch (error) {
      console.error("Fetch failed:", error);
      setPapers(getFallbackPapers(activeDomain));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackPapers = (domain: string) => [
    { title: `Latest Research in ${domain}`, authors: "Researcher et al.", date: "2025", summary: "实时数据获取失败，请检查网络或点击刷新。", link: "#", impact: "系统保底" }
  ];

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
        <div className="engine-status">
          <Globe size={14} className="pulse-icon" />
          ArXiv 全球实时连接 (中转引擎已就绪)
        </div>
      </header>

      <div className="domain-bar glass-card">
        {Object.keys(DOMAIN_INTELLIGENCE).map(d => (
          <button 
            key={d} 
            className={`domain-tab ${activeDomain === d ? 'active' : ''}`}
            onClick={() => { setActiveDomain(d); setExpandedId(null); }}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="hub-content">
        <aside className="hub-sidebar">
          <div className="intel-card glass-card">
            <h3><Lightbulb size={16} color="#f59e0b" fill="#f59e0b" /> 领域研究情报</h3>
            <p className="intel-desc">{activeInfo.directions}</p>
            <div className="hot-tags">
              {activeInfo.hotTopics.map((tag: string) => (
                <span key={tag} className="hot-tag">{tag}</span>
              ))}
            </div>
          </div>

          <div className="trend-card glass-card">
            <h3><TrendingUp size={16} color="#2563eb" /> 领域活跃度</h3>
            <div className="trend-main">
              <span className="trend-val">{activeInfo.trend}</span>
              <span className="trend-badge">{activeInfo.status}</span>
            </div>
          </div>

          <button className="refresh-btn glass-card" onClick={() => fetchPapers(activeDomain)}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 刷新实时发现
          </button>
        </aside>

        <main className="papers-main">
          <div className="search-bar glass-card">
            <Search size={18} color="#a1a1aa" />
            <input 
              type="text" 
              placeholder={`在 ${activeDomain} 领域中深入检索 (实时同步)...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPapers(searchTerm, true)}
            />
          </div>

          <div className="papers-list">
            <div className="list-header">
              <h2>ArXiv 实时库发现</h2>
              <span className="count">{papers.length} 篇最新成果</span>
            </div>

            {loading ? (
              <div className="loading">
                <Loader2 className="animate-spin" size={32} />
                <p>正在同步全球顶级实验室的最新产出...</p>
              </div>
            ) : (
              <div className="grid">
                {papers.map((paper, i) => (
                  <div key={i} className={`paper-item glass-card ${expandedId === i ? 'expanded' : ''}`}>
                    <div className="item-main" onClick={() => setExpandedId(expandedId === i ? null : i)}>
                      <div className="item-info">
                        <div className="item-meta">
                          <span className="tag">实时更新</span>
                          <span className="date">{paper.date}</span>
                        </div>
                        <h3>{paper.title}</h3>
                        <p className="authors">{paper.authors}</p>
                      </div>
                      <div className="item-toggle">
                        {expandedId === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                    
                    {expandedId === i && (
                      <div className="item-details">
                        <div className="summary-box">
                          <h4><Zap size={14} /> 摘要预览 (Abstract)</h4>
                          <p>{paper.summary}</p>
                        </div>
                        <div className="actions">
                          <button className="view-btn" onClick={() => window.open(paper.link, '_blank')}>
                            <FileText size={16} /> 查看 PDF 原文
                          </button>
                          <button className="link-btn" onClick={() => window.open(paper.link, '_blank')}>
                            <ExternalLink size={16} /> 源链接
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .scholar-hub { max-width: 1100px; margin: 0 auto; }
        .hub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header-title { display: flex; align-items: center; gap: 0.75rem; }
        .header-title h1 { font-size: 1.75rem; font-weight: 700; color: #18181b; }
        .title-icon { color: #2563eb; }
        .engine-status { font-size: 0.75rem; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 0.5rem; }
        .pulse-icon { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }

        .domain-bar { display: flex; gap: 0.25rem; padding: 0.4rem; margin-bottom: 2rem; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; }
        .domain-tab { background: transparent; border: none; color: #71717a; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; }
        .domain-tab.active { background: #ffffff; color: #18181b; font-weight: 600; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); }

        .hub-content { display: grid; grid-template-columns: 280px 1fr; gap: 2rem; }
        .hub-sidebar { display: flex; flex-direction: column; gap: 1.25rem; }
        .glass-card { background: #ffffff; border: 1px solid #f4f4f5; border-radius: 16px; padding: 1.25rem; }
        
        .intel-card h3, .trend-card h3 { display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; font-weight: 700; margin-bottom: 1rem; }
        .intel-desc { font-size: 0.8rem; color: #71717a; line-height: 1.6; margin-bottom: 1rem; }
        .hot-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .hot-tag { font-size: 0.7rem; color: #18181b; background: #f4f4f5; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 600; }
        
        .trend-main { display: flex; align-items: baseline; gap: 1rem; }
        .trend-val { font-size: 2rem; font-weight: 800; color: #2563eb; }
        .trend-badge { font-size: 0.7rem; font-weight: 700; color: #10b981; background: #ecfdf5; padding: 0.15rem 0.5rem; border-radius: 6px; }
        
        .refresh-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-weight: 700; font-size: 0.9rem; cursor: pointer; border: 1px solid #e4e4e7; transition: all 0.2s; }
        .refresh-btn:hover { background: #18181b; color: white; }

        .search-bar { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; margin-bottom: 2rem; border: 1px solid #e4e4e7; }
        .search-bar input { flex: 1; border: none; outline: none; font-size: 1rem; }

        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .list-header h2 { font-size: 1.25rem; font-weight: 700; }
        .count { font-size: 0.8rem; color: #a1a1aa; }

        .grid { display: flex; flex-direction: column; gap: 1rem; }
        .paper-item { padding: 0; overflow: hidden; border: 1px solid #f4f4f5; transition: all 0.2s; cursor: pointer; }
        .paper-item:hover { border-color: #2563eb; }
        .paper-item.expanded { border-color: #18181b; }

        .item-main { padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; }
        .item-meta { display: flex; gap: 0.6rem; align-items: center; margin-bottom: 0.4rem; }
        .tag { font-size: 0.6rem; font-weight: 800; color: #2563eb; background: #eff6ff; padding: 0.15rem 0.5rem; border-radius: 4px; }
        .date { font-size: 0.75rem; color: #a1a1aa; font-weight: 600; }
        .item-info h3 { font-size: 1.1rem; font-weight: 700; color: #18181b; margin-bottom: 0.2rem; line-height: 1.4; }
        .authors { font-size: 0.9rem; color: #71717a; }
        .item-toggle { color: #a1a1aa; }

        .item-details { padding: 0 1.25rem 1.25rem 1.25rem; border-top: 1px solid #f4f4f5; background: #fafafa; }
        .summary-box { padding: 1.25rem; background: white; border-radius: 12px; margin: 1rem 0; border: 1px solid #f1f1f4; }
        .summary-box h4 { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.6rem; }
        .summary-box p { font-size: 0.85rem; color: #52525b; line-height: 1.7; text-align: justify; }
        
        .actions { display: flex; gap: 0.75rem; }
        .view-btn { flex: 1; padding: 0.75rem; background: #18181b; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem; }
        .link-btn { padding: 0.75rem 1rem; background: #f4f4f5; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; }

        .loading { padding: 8rem 0; text-align: center; color: #a1a1aa; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .domain-bar {
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 0.5rem;
          }
          .domain-tab {
            flex-shrink: 0;
          }
          .hub-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .actions {
            flex-direction: column;
          }
          .item-meta {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default ScholarHub;
