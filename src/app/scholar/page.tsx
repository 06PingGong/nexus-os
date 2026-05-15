'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  BookOpen,
  Search,
  Loader2,
  RefreshCw,
  Bookmark,
  Maximize2,
  X,
  Upload,
  Sparkles,
  Award,
  TrendingUp,
  Newspaper,
  Radar,
  Flame,
  ExternalLink,
  Star,
  Tags,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

type DomainKey = 'remote' | 'ai' | 'llm';

type Paper = {
  title: string;
  authors: string;
  date: string;
  link: string;
  source: string;
  summary?: string;
  doi?: string;
  citations?: number;
  level?: string;
  type?: string;
  savedAt?: string;
  pdfUrl?: string;
  status?: string;
  tags?: string[];
  priority?: string;
  aiCard?: string;
  personalRating?: number;
};

type FrontierInsight = {
  summary: string;
  trends: string[];
  hotTerms: string[];
  activeLevel: string;
  readingPriority: string;
  reviewFocus: string;
};

const DOMAIN_INTELLIGENCE: Record<DomainKey, any> = {
  remote: {
    label: '遥感',
    trend: '+32%',
    status: '地学智能爆发期',
    hotTopics: ['地学大模型', '自监督遥感', '多源融合', 'SAR-光学协同', '变化检测'],
    frontier: [
      '从单一影像解译转向跨传感器、跨区域、跨时间的地理空间基础模型。',
      '顶刊更关注可迁移性、物理一致性、低标注场景和真实灾害/农业/城市应用。',
      '综述脉络集中在 foundation model、earth observation、hyperspectral 与 multimodal fusion。',
    ],
    reviewTitle: '最新综述脉络：遥感基础模型与地球观测智能',
  },
  ai: {
    label: '人工智能',
    trend: '+45%',
    status: '全面渗透期',
    hotTopics: ['AI for Science', '多模态学习', '可信 AI', '模型压缩', '智能体'],
    frontier: [
      '权威论文正在从单点模型性能转向可解释、可信、可部署的智能系统。',
      'Nature/Science 系列更偏 AI for Science，顶会更偏算法、训练范式与评测。',
      '值得精读的是高引用综述、顶会最佳论文和跨学科落地论文。',
    ],
    reviewTitle: '最新综述脉络：基础模型、可信智能与科学发现',
  },
  llm: {
    label: '大语言模型',
    trend: '+128%',
    status: '高速迭代期',
    hotTopics: ['RAG', 'Agent', '长上下文', '推理增强', '对齐评测'],
    frontier: [
      '研究前沿从“更大模型”转向推理、工具调用、检索增强和可验证智能体。',
      '权威论文通常来自 ICLR/NeurIPS/ICML/ACL/EMNLP，以及 Nature Machine Intelligence。',
      '最新综述适合用来建立知识框架，再挑高影响论文精读。',
    ],
    reviewTitle: '最新综述脉络：LLM 推理、智能体与检索增强生成',
  },
};

const domainKeys = Object.keys(DOMAIN_INTELLIGENCE) as DomainKey[];

const mapLibraryRow = (row: any): Paper => ({
  title: row.title,
  authors: row.authors || '',
  date: row.date || '',
  link: row.link,
  source: row.source || '',
  summary: row.summary || '',
  doi: row.doi || '',
  citations: row.citations || 0,
  level: row.level || '',
  type: row.paper_type || '',
  savedAt: row.saved_at || '',
  pdfUrl: row.pdf_url || undefined,
  status: row.status || '未读',
  tags: row.tags || ['待精读'],
  priority: row.priority || '中',
  aiCard: row.ai_card || '',
  personalRating: row.personal_rating || 0,
});

const mapPaperToLibraryRow = (paper: Paper) => ({
  title: paper.title,
  authors: paper.authors || '',
  date: paper.date || '',
  link: paper.link,
  pdf_url: getPdfUrl(paper),
  source: paper.source || '',
  summary: paper.summary || '',
  doi: paper.doi || '',
  citations: paper.citations || 0,
  level: paper.level || '',
  paper_type: paper.type || '',
  saved_at: paper.savedAt || new Date().toLocaleDateString(),
  status: paper.status || '未读',
  tags: paper.tags?.length ? paper.tags : ['待精读'],
  priority: paper.priority || '中',
  ai_card: paper.aiCard || '',
  personal_rating: paper.personalRating || 0,
});

const getPdfUrl = (paper: Paper) => {
  if (paper.pdfUrl) return paper.pdfUrl;
  if (paper.link?.includes('arxiv.org/abs')) return `${paper.link.replace('abs', 'pdf')}.pdf`;
  if (paper.link?.toLowerCase().includes('.pdf')) return paper.link;
  return '';
};

const ScholarHub = () => {
  const router = useRouter();
  const { addTask } = useApp();
  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'LIBRARY'>('DISCOVER');
  const [activeDomain, setActiveDomain] = useState<DomainKey>('remote');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [reviews, setReviews] = useState<Paper[]>([]);
  const [sourceLabel, setSourceLabel] = useState('OpenAlex');
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [frontierInsight, setFrontierInsight] = useState<FrontierInsight | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [libraryFilter, setLibraryFilter] = useState('全部');
  const [library, setLibrary] = useState<Paper[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const domain = DOMAIN_INTELLIGENCE[activeDomain];
  const filteredPapers = searchTerm.trim()
    ? papers.filter(paper => `${paper.title} ${paper.authors} ${paper.source}`.toLowerCase().includes(searchTerm.toLowerCase()))
    : papers;
  const filteredLibrary = library.filter(paper => libraryFilter === '全部' || paper.status === libraryFilter || paper.priority === libraryFilter || paper.tags?.includes(libraryFilter));

  useEffect(() => {
    loadLibrary();
    fetchPapers('remote');
  }, []);

  useEffect(() => {
    if (!autoSyncEnabled) return;
    const timer = window.setInterval(() => {
      fetchPapers(activeDomain);
    }, 1000 * 60 * 20);

    return () => window.clearInterval(timer);
  }, [activeDomain, autoSyncEnabled]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel('nexus-reading-library-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_library' }, () => loadLibrary())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLibrary = async () => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('reading_library').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const next = data.map(mapLibraryRow);
        setLibrary(next);
        localStorage.setItem('nexus_library', JSON.stringify(next));
        return;
      }
      console.error('加载云端精读库失败:', error?.message);
    }

    const saved = localStorage.getItem('nexus_library');
    if (saved) setLibrary(JSON.parse(saved));
  };

  const fetchPapers = async (domainKey = activeDomain) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scholar?domain=${domainKey}`);
      const results = await response.json();
      const nextPapers = Array.isArray(results.papers) ? results.papers : [];
      const nextReviews = Array.isArray(results.reviews) ? results.reviews : [];
      setPapers(nextPapers);
      setReviews(nextReviews);
      setSourceLabel(results.source || 'OpenAlex');
      setLastUpdated(new Date(results.updatedAt || Date.now()).toLocaleString());
      generateFrontierInsight(domainKey as DomainKey, nextPapers, nextReviews);
    } catch (error) {
      console.error('Fetch failed:', error);
      setPapers([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const generateFrontierInsight = async (domainKey: DomainKey, paperList: Paper[], reviewList: Paper[]) => {
    if (!paperList.length && !reviewList.length) {
      setFrontierInsight(null);
      return;
    }

    setInsightLoading(true);
    try {
      const payload = [...paperList.slice(0, 8), ...reviewList.slice(0, 3)].map((paper, index) => ({
        index: index + 1,
        title: paper.title,
        source: paper.source,
        date: paper.date,
        citations: paper.citations || 0,
        summary: paper.summary?.slice(0, 500) || '',
      }));

      const response = await fetch('/api/reader-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'frontier',
          content: `研究方向：${DOMAIN_INTELLIGENCE[domainKey].label}\n论文列表：${JSON.stringify(payload, null, 2)}`,
        }),
      });
      const data = await response.json();
      const raw = String(data.result || '').trim();
      const jsonText = raw.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(jsonText);
      setFrontierInsight({
        summary: parsed.summary || '',
        trends: Array.isArray(parsed.trends) ? parsed.trends : [],
        hotTerms: Array.isArray(parsed.hotTerms) ? parsed.hotTerms : [],
        activeLevel: parsed.activeLevel || DOMAIN_INTELLIGENCE[domainKey].status,
        readingPriority: parsed.readingPriority || '顶刊/高引优先',
        reviewFocus: parsed.reviewFocus || DOMAIN_INTELLIGENCE[domainKey].reviewTitle,
      });
    } catch (error) {
      console.error('生成 AI 前沿扫描失败:', error);
      setFrontierInsight(null);
    } finally {
      setInsightLoading(false);
    }
  };

  const switchDomain = (key: DomainKey) => {
    setActiveDomain(key);
    setSearchTerm('');
    fetchPapers(key);
  };

  const addToLibrary = async (paper: Paper) => {
    if (library.find(p => p.link === paper.link)) return;
    const newList = [{ ...paper, savedAt: new Date().toLocaleDateString() }, ...library];
    setLibrary(newList);
    localStorage.setItem('nexus_library', JSON.stringify(newList));

    if (isSupabaseConfigured && !paper.link.startsWith('blob:')) {
      const { error } = await supabase.from('reading_library').upsert(mapPaperToLibraryRow(paper), { onConflict: 'link' });
      if (error) console.error('保存云端精读库失败:', error.message);
    }
  };

  const removeFromLibrary = async (paper: Paper) => {
    const next = library.filter(item => item.link !== paper.link);
    setLibrary(next);
    localStorage.setItem('nexus_library', JSON.stringify(next));

    if (isSupabaseConfigured && !paper.link.startsWith('blob:')) {
      const { error } = await supabase.from('reading_library').delete().eq('link', paper.link);
      if (error) console.error('删除云端精读库失败:', error.message);
    }
  };

  const updateLibraryPaper = async (paper: Paper, changes: Partial<Paper>) => {
    const next = library.map(item => item.link === paper.link ? { ...item, ...changes } : item);
    setLibrary(next);
    localStorage.setItem('nexus_library', JSON.stringify(next));

    if (isSupabaseConfigured && !paper.link.startsWith('blob:')) {
      const payload: any = {};
      if (changes.status !== undefined) payload.status = changes.status;
      if (changes.tags !== undefined) payload.tags = changes.tags;
      if (changes.priority !== undefined) payload.priority = changes.priority;
      if (changes.aiCard !== undefined) payload.ai_card = changes.aiCard;
      if (changes.personalRating !== undefined) payload.personal_rating = changes.personalRating;
      payload.updated_at = new Date().toISOString();
      const { error } = await supabase.from('reading_library').update(payload).eq('link', paper.link);
      if (error) console.error('更新云端精读库失败:', error.message);
    }
  };

  const createPaperTasks = async (paper: Paper) => {
    await addTask(`精读论文：${paper.title}`, '论文', paper.priority || '中');
    await addTask(`整理精读卡片：${paper.title}`, '写作', '中');
    await addTask(`提炼可复现实验：${paper.title}`, '实验', '高');
  };

  const openReader = (paper: Paper) => {
    sessionStorage.setItem('nexus_reading_paper', JSON.stringify({ ...paper, pdfUrl: getPdfUrl(paper) }));
    router.push('/reader');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPaper = {
      title: file.name.replace('.pdf', ''),
      authors: '本地导入文献',
      date: new Date().toLocaleDateString(),
      link: URL.createObjectURL(file),
      source: '本地上传',
      level: '个人文献',
    };
    addToLibrary(localPaper);
    openReader(localPaper);
  };

  return (
    <div className="scholar-hub">
      <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleFileUpload} />

      <header className="hub-header">
        <div className="h-left">
          <div className="brand-icon"><BookOpen size={30} /></div>
          <div className="h-text">
            <h1>学术中心</h1>
            <p>顶刊精读 · 前沿扫描 · 综述导航</p>
          </div>
        </div>
        <div className="tab-switcher">
          <button className={activeTab === 'DISCOVER' ? 'active' : ''} onClick={() => setActiveTab('DISCOVER')}>方向雷达</button>
          <button className={activeTab === 'LIBRARY' ? 'active' : ''} onClick={() => setActiveTab('LIBRARY')}>我的精读库 ({library.length})</button>
        </div>
      </header>

      <div className="domain-board">
        {domainKeys.map(key => {
          const item = DOMAIN_INTELLIGENCE[key];
          return (
            <button key={key} className={`domain-card ${activeDomain === key ? 'active' : ''}`} onClick={() => switchDomain(key)}>
              <span>{item.label}</span>
              <strong>{item.status}</strong>
              <small>{item.trend} 活跃度</small>
            </button>
          );
        })}
      </div>

      {activeTab === 'DISCOVER' ? (
        <div className="research-layout">
          <section className="top-papers-panel">
            <div className="section-title-row">
              <div>
                <span className="eyebrow"><Award size={14} /> 顶刊 / 权威论文</span>
                <h2>{domain.label}精读候选</h2>
                <p>来源：{sourceLabel}，优先展示顶刊、顶会、高引用与正式发表论文。</p>
                <div className="sync-meta">
                  <span>{lastUpdated ? `最近同步：${lastUpdated}` : '最近同步：初始化中'}</span>
                  <button className={autoSyncEnabled ? 'on' : ''} onClick={() => setAutoSyncEnabled(prev => !prev)}>
                    {autoSyncEnabled ? '自动同步已开启' : '自动同步已关闭'}
                  </button>
                </div>
              </div>
              <button className="refresh-btn" onClick={() => fetchPapers()}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 刷新
              </button>
            </div>
            <div className="search-input-wrap">
              <Search size={20} color="#94a3b8" />
              <input placeholder="在当前方向内搜索题目、作者、期刊..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {loading ? (
              <div className="loading-placeholder"><Loader2 className="animate-spin" size={34} /> 正在扫描权威论文源...</div>
            ) : (
              <div className="paper-stack">
                {filteredPapers.map((paper, index) => (
                  <motion.article key={`${paper.link}-${index}`} className="paper-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="paper-rank">{String(index + 1).padStart(2, '0')}</div>
                    <div className="paper-body">
                      <div className="p-meta-info">
                        <span className="p-source">{paper.source || 'OpenAlex'}</span>
                        <span className="level-badge">{paper.level || '权威候选'}</span>
                        <span className="p-time">{paper.date}</span>
                        <span className="cite-chip">{paper.citations || 0} 引用</span>
                      </div>
                      <h3>{paper.title}</h3>
                      <p className="p-auths">{paper.authors}</p>
                      {paper.summary && <p className="paper-abstract">{paper.summary.slice(0, 240)}...</p>}
                      <div className="p-btns">
                        <button className="p-btn-dark" onClick={() => openReader(paper)}><Maximize2 size={16} /> 深度阅读</button>
                        <button className="p-btn-light" onClick={() => addToLibrary(paper)}><Bookmark size={16} /> 加入精读库</button>
                        <a className="p-link" href={paper.link} target="_blank" rel="noreferrer"><ExternalLink size={15} /> 来源</a>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </section>

          <aside className="insight-rail">
            <section className="ai-summary-card glass-card">
              <div className="card-heading"><Sparkles size={18} /> AI 前沿扫描 {insightLoading ? '· 生成中' : ''}</div>
              <h3>{domain.label}现在在做什么？</h3>
              {frontierInsight?.summary && <p className="frontier-summary">{frontierInsight.summary}</p>}
              <ul>
                {(frontierInsight?.trends?.length ? frontierInsight.trends : domain.frontier).map((item: string) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="metric-grid">
              <div className="metric-card">
                <TrendingUp size={18} />
                <span>领域活跃度</span>
                <strong>{domain.trend}</strong>
                <small>{frontierInsight?.activeLevel || domain.status}</small>
              </div>
              <div className="metric-card dark">
                <Radar size={18} />
                <span>精读优先级</span>
                <strong>TOP</strong>
                <small>{frontierInsight?.readingPriority || '顶刊/高引优先'}</small>
              </div>
            </section>

            <section className="hot-card glass-card">
              <div className="card-heading"><Flame size={18} /> 核心热词</div>
              <div className="word-cloud">
                {(frontierInsight?.hotTerms?.length ? frontierInsight.hotTerms : domain.hotTopics).map((topic: string) => <span key={topic}>{topic}</span>)}
              </div>
            </section>

            <section className="review-card glass-card">
              <div className="card-heading"><Newspaper size={18} /> 最新综述</div>
              <h3>{frontierInsight?.reviewFocus || domain.reviewTitle}</h3>
              <div className="review-list">
                {reviews.slice(0, 3).map((paper, index) => (
                  <button key={`${paper.link}-review-${index}`} onClick={() => openReader(paper)}>
                    <span>{paper.source}</span>
                    <strong>{paper.title}</strong>
                    <small>{paper.date} · {paper.citations || 0} 引用</small>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <div className="library-section">
          <div className="lib-top">
            <div>
              <span className="eyebrow"><BookOpen size={14} /> Personal Reading Vault</span>
              <h2>已存精读文献 ({library.length})</h2>
            </div>
            <button className="import-btn" onClick={() => fileInputRef.current?.click()}><Upload size={18} /> 导入本地 PDF</button>
          </div>
          <div className="library-filters">
            {['全部', '未读', '在读', '已读', '已复现', '高', '综述', '方法', '应用'].map(item => (
              <button key={item} className={libraryFilter === item ? 'active' : ''} onClick={() => setLibraryFilter(item)}>{item}</button>
            ))}
          </div>
          <div className="lib-item-list">
            {filteredLibrary.map((paper, index) => (
              <div key={`${paper.link}-lib-${index}`} className="lib-card-new glass-card">
                <div className="lib-card-top">
                  <span className="level-badge">{paper.level || '待鉴定'}</span>
                  <button onClick={() => removeFromLibrary(paper)}><X size={16} /></button>
                </div>
                <h4>{paper.title}</h4>
                <p>{paper.authors}</p>
                <div className="lib-meta-grid">
                  <label><CheckCircle2 size={14} /> 状态
                    <select value={paper.status || '未读'} onChange={e => updateLibraryPaper(paper, { status: e.target.value })}>
                      {['未读', '在读', '已读', '已复现', '已引用'].map(status => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                  <label><Star size={14} /> 优先级
                    <select value={paper.priority || '中'} onChange={e => updateLibraryPaper(paper, { priority: e.target.value })}>
                      {['高', '中', '低'].map(priority => <option key={priority}>{priority}</option>)}
                    </select>
                  </label>
                </div>
                <div className="tag-editor">
                  <Tags size={14} />
                  <input value={(paper.tags || []).join('，')} onChange={e => updateLibraryPaper(paper, { tags: e.target.value.split(/[，,]/).map(tag => tag.trim()).filter(Boolean) })} placeholder="标签：综述，方法，应用" />
                </div>
                <div className="rating-row">
                  {[1, 2, 3, 4, 5].map(score => (
                    <button key={score} className={(paper.personalRating || 0) >= score ? 'on' : ''} onClick={() => updateLibraryPaper(paper, { personalRating: score })}>★</button>
                  ))}
                </div>
                {paper.aiCard && <div className="mini-ai-card">{paper.aiCard.slice(0, 260)}...</div>}
                <div className="lib-actions-row">
                  <button className="read-now-btn" onClick={() => openReader(paper)}>进入深度研读模式</button>
                  <button className="task-link-btn" onClick={() => createPaperTasks(paper)}>生成任务</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .scholar-hub { max-width: 1440px; margin: 0 auto; padding: 2rem 0 5rem; color: #0f172a; }
        .hub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .h-left { display: flex; align-items: center; gap: 1rem; }
        .brand-icon { width: 62px; height: 62px; border-radius: 22px; background: linear-gradient(135deg, #0f172a, #2563eb); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 18px 35px rgba(37,99,235,0.24); }
        .h-text h1 { font-size: 2.8rem; font-weight: 900; letter-spacing: -2px; margin: 0; }
        .h-text p { margin-top: .35rem; color: #64748b; font-weight: 700; }
        .tab-switcher { background: #eef2f7; padding: 0.4rem; border-radius: 18px; display: flex; gap: 0.35rem; }
        .tab-switcher button { border: none; background: transparent; padding: 0.8rem 1.45rem; font-weight: 800; cursor: pointer; border-radius: 14px; color: #64748b; }
        .tab-switcher button.active { background: #fff; color: #0f172a; box-shadow: 0 12px 28px rgba(15,23,42,0.08); }

        .domain-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.6rem; }
        .domain-card { text-align: left; border: 1px solid #e2e8f0; background: linear-gradient(180deg, #fff, #f8fafc); border-radius: 24px; padding: 1.35rem; cursor: pointer; transition: all .25s; display: grid; gap: .55rem; }
        .domain-card span { font-size: 1.3rem; font-weight: 900; }
        .domain-card strong { color: #64748b; }
        .domain-card small { color: #2563eb; font-weight: 900; }
        .domain-card.active { background: radial-gradient(circle at top right, #60a5fa, #0f172a 58%); color: #fff; transform: translateY(-3px); box-shadow: 0 22px 45px rgba(15,23,42,.18); }
        .domain-card.active strong, .domain-card.active small { color: rgba(255,255,255,.82); }

        .research-layout { display: grid; grid-template-columns: minmax(0, 1fr) 410px; gap: 1.4rem; align-items: start; }
        .top-papers-panel, .insight-rail section, .library-section { background: rgba(255,255,255,.92); border: 1px solid #e5e7eb; border-radius: 30px; box-shadow: 0 18px 45px rgba(15,23,42,.06); }
        .top-papers-panel { padding: 1.6rem; }
        .section-title-row, .lib-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
        .eyebrow, .card-heading { display: inline-flex; align-items: center; gap: .45rem; color: #2563eb; font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
        .section-title-row h2, .lib-top h2 { font-size: 2rem; margin: .35rem 0; letter-spacing: -1px; }
        .section-title-row p { color: #64748b; font-weight: 600; margin: 0; }
        .refresh-btn, .import-btn { border: none; background: #0f172a; color: #fff; border-radius: 16px; padding: .9rem 1.2rem; font-weight: 900; display: inline-flex; align-items: center; gap: .6rem; cursor: pointer; }
        .sync-meta { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem; margin-top: .6rem; color: #64748b; font-size: .78rem; font-weight: 800; }
        .sync-meta button { border: 1px solid #e5e7eb; background: #fff; color: #64748b; border-radius: 999px; padding: .38rem .7rem; font-size: .75rem; font-weight: 900; cursor: pointer; }
        .sync-meta button.on { background: #111827; color: #fff; border-color: #111827; }
        .search-input-wrap { display: flex; align-items: center; gap: 1rem; padding: 0 1.1rem; border-radius: 18px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
        .search-input-wrap input { width: 100%; height: 54px; border: none; outline: none; background: transparent; font-size: 1rem; font-weight: 700; }
        .loading-placeholder { min-height: 320px; display: flex; align-items: center; justify-content: center; gap: .8rem; color: #64748b; font-weight: 900; }

        .paper-stack { display: grid; gap: 1rem; }
        .paper-card { display: grid; grid-template-columns: 54px 1fr; gap: 1rem; padding: 1.2rem; border-radius: 24px; border: 1px solid #e5e7eb; background: #fff; transition: all .25s; }
        .paper-card:hover { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(15,23,42,.08); border-color: #bfdbfe; }
        .paper-rank { width: 48px; height: 48px; border-radius: 16px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: 900; }
        .p-meta-info { display: flex; flex-wrap: wrap; gap: .55rem; margin-bottom: .75rem; align-items: center; }
        .p-source, .level-badge, .cite-chip, .p-time { font-size: .72rem; font-weight: 900; padding: .34rem .62rem; border-radius: 999px; }
        .p-source { color: #1d4ed8; background: #eff6ff; }
        .level-badge { color: #047857; background: #ecfdf5; }
        .cite-chip { color: #92400e; background: #fffbeb; }
        .p-time { color: #64748b; background: #f1f5f9; }
        .paper-card h3 { font-size: 1.22rem; line-height: 1.42; margin: 0 0 .55rem; letter-spacing: -.02em; }
        .p-auths { color: #64748b; margin: 0 0 .75rem; font-weight: 700; }
        .paper-abstract { color: #475569; line-height: 1.65; margin: 0 0 1rem; }
        .p-btns { display: flex; flex-wrap: wrap; gap: .8rem; align-items: center; }
        .p-btn-dark, .p-btn-light, .p-link { border: none; text-decoration: none; padding: .75rem 1rem; border-radius: 14px; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: .55rem; }
        .p-btn-dark { background: #0f172a; color: #fff; }
        .p-btn-light { background: #eef2ff; color: #3730a3; }
        .p-link { color: #475569; background: #f8fafc; }

        .insight-rail { display: grid; gap: 1rem; position: sticky; top: 1rem; }
        .ai-summary-card, .hot-card, .review-card { padding: 1.35rem; }
        .ai-summary-card h3, .review-card h3 { font-size: 1.35rem; margin: .6rem 0 1rem; letter-spacing: -.04em; }
        .ai-summary-card ul { padding-left: 1.1rem; display: grid; gap: .8rem; color: #475569; font-weight: 650; line-height: 1.65; }
        .frontier-summary { color: #0f172a; line-height: 1.7; font-weight: 750; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 18px; padding: .95rem; }
        .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: transparent !important; border: none !important; box-shadow: none !important; }
        .metric-card { border-radius: 24px; padding: 1.2rem; background: #fff; border: 1px solid #e5e7eb; display: grid; gap: .35rem; }
        .metric-card.dark { background: #0f172a; color: #fff; }
        .metric-card span { color: #64748b; font-size: .78rem; font-weight: 900; }
        .metric-card.dark span, .metric-card.dark small { color: rgba(255,255,255,.66); }
        .metric-card strong { font-size: 2rem; letter-spacing: -1px; }
        .metric-card small { color: #64748b; font-weight: 800; }
        .word-cloud { display: flex; flex-wrap: wrap; gap: .7rem; margin-top: 1rem; }
        .word-cloud span { background: #f1f5f9; color: #0f172a; padding: .6rem .85rem; border-radius: 999px; font-weight: 900; font-size: .82rem; }
        .review-list { display: grid; gap: .75rem; }
        .review-list button { border: 1px solid #e5e7eb; border-radius: 18px; background: #f8fafc; padding: .9rem; text-align: left; cursor: pointer; display: grid; gap: .35rem; }
        .review-list span { color: #2563eb; font-weight: 900; font-size: .72rem; }
        .review-list strong { line-height: 1.35; }
        .review-list small { color: #64748b; font-weight: 800; }

        .library-section { padding: 1.6rem; }
        .import-btn { background: #2563eb; }
        .library-filters { display: flex; flex-wrap: wrap; gap: .65rem; margin: -0.4rem 0 1.2rem; }
        .library-filters button { border: 1px solid #e5e7eb; background: #f8fafc; color: #64748b; border-radius: 999px; padding: .55rem .9rem; font-weight: 900; cursor: pointer; }
        .library-filters button.active { background: #0f172a; color: #fff; border-color: #0f172a; }
        .lib-item-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }
        .lib-card-new { padding: 1.4rem; border-radius: 24px; border: 1px solid #e5e7eb; background: #fff; }
        .lib-card-top { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .lib-card-top button { border: none; background: #f1f5f9; border-radius: 10px; width: 32px; height: 32px; cursor: pointer; }
        .lib-card-new h4 { font-size: 1.1rem; line-height: 1.45; }
        .lib-card-new p { color: #64748b; font-weight: 700; }
        .lib-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; margin: 1rem 0; }
        .lib-meta-grid label { display: grid; gap: .35rem; color: #64748b; font-size: .75rem; font-weight: 900; }
        .lib-meta-grid select, .tag-editor input { border: 1px solid #e5e7eb; border-radius: 12px; padding: .65rem; font-weight: 800; background: #f8fafc; outline: none; }
        .tag-editor { display: flex; align-items: center; gap: .55rem; padding: .55rem .7rem; border: 1px solid #e5e7eb; background: #f8fafc; border-radius: 14px; }
        .tag-editor input { width: 100%; border: none; background: transparent; padding: .25rem; }
        .rating-row { display: flex; gap: .25rem; margin: .9rem 0; }
        .rating-row button { border: none; background: transparent; color: #cbd5e1; font-size: 1.25rem; cursor: pointer; }
        .rating-row button.on { color: #f59e0b; }
        .mini-ai-card { white-space: pre-wrap; color: #475569; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 16px; padding: .9rem; line-height: 1.6; margin-bottom: .9rem; }
        .lib-actions-row { display: grid; grid-template-columns: 1fr 108px; gap: .65rem; }
        .read-now-btn, .task-link-btn { width: 100%; padding: .95rem; background: #0f172a; color: #fff; border: none; border-radius: 14px; font-weight: 900; cursor: pointer; }
        .task-link-btn { background: #eef2ff; color: #3730a3; }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1200px) { .research-layout { grid-template-columns: 1fr; } .insight-rail { position: static; } }
      `}</style>
    </div>
  );
};

export default ScholarHub;
