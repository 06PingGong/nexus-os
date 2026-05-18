'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ClipboardList,
  Download,
  ExternalLink,
  Eye,
  Highlighter,
  Languages,
  NotebookPen,
  Plus,
  Sparkles,
  Wand2,
} from 'lucide-react';

type Paper = {
  id?: string | number;
  title: string;
  authors?: string;
  source?: string;
  journal?: string;
  year?: number | string;
  summary?: string;
  abstract?: string;
  link?: string;
  pdfUrl?: string;
  url?: string;
  status?: string;
  priority?: string;
  aiCard?: string;
  researchPlan?: string;
};

type Note = {
  id: number;
  content: string;
  createdAt: string;
};

type Highlight = {
  id: number;
  text: string;
  color: string;
  createdAt: string;
};

type ReaderTab = 'overview' | 'deepread' | 'translate' | 'notes' | 'highlights' | 'outputs';

const ReaderPage = () => {
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [activeTab, setActiveTab] = useState<ReaderTab>('overview');
  const [selectedText, setSelectedText] = useState('');
  const searchParams = useSearchParams();
  const [translation, setTranslation] = useState('');
  const [aiReading, setAiReading] = useState('');
  const [readingCard, setReadingCard] = useState('');
  const [researchPlan, setResearchPlan] = useState('');
  const [readingStatus, setReadingStatus] = useState('未读');
  const [readingPriority, setReadingPriority] = useState('中');
  const [aiLoading, setAiLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [highlightDraft, setHighlightDraft] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const storageKey = useMemo(() => {
    const base = paper?.id || paper?.link || paper?.title || 'empty';
    return `nexus_reader_${String(base).slice(0, 80)}`;
  }, [paper]);

  const isEmbeddablePdf = (url = '') => {
    const normalized = String(url).toLowerCase();
    return normalized.startsWith('blob:') || normalized.includes('arxiv.org/pdf') || normalized.endsWith('.pdf') || normalized.includes('.pdf');
  };
  const pdfUrl = paper?.pdfUrl || '';
  const externalUrl = paper?.link || paper?.url || paper?.pdfUrl || '';
  const paperLink = paper?.link || paper?.pdfUrl || paper?.url || paper?.title || '';

  useEffect(() => {
    if (paper) return;
    const link = searchParams.get('link');
    if (!link) return;

    setPaper({
      link,
      title: searchParams.get('title') || '未命名论文',
      authors: searchParams.get('authors') || '',
      source: searchParams.get('source') || '',
      summary: searchParams.get('summary') || '',
      pdfUrl: searchParams.get('pdfUrl') || '',
      status: searchParams.get('status') || '未读',
      priority: searchParams.get('priority') || '中',
    });
  }, [paper, searchParams]);

  useEffect(() => {
    if (!paper) return;
    loadReadingState();
  }, [paper, storageKey]);

  useEffect(() => {
    if (!paper || !isSupabaseConfigured || !paperLink || paperLink.startsWith('blob:')) return;
    const notesChannel = supabase
      .channel(`nexus-reader-notes-${paperLink.slice(0, 48)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reader_notes', filter: `paper_link=eq.${paperLink}` }, () => loadReadingState())
      .subscribe();
    const highlightsChannel = supabase
      .channel(`nexus-reader-highlights-${paperLink.slice(0, 48)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reader_highlights', filter: `paper_link=eq.${paperLink}` }, () => loadReadingState())
      .subscribe();

    return () => {
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(highlightsChannel);
    };
  }, [paper, paperLink]);

  const loadReadingState = async () => {
    if (!paper) return;

    if (isSupabaseConfigured && paperLink && !paperLink.startsWith('blob:')) {
      const [{ data: noteRows, error: noteError }, { data: highlightRows, error: highlightError }] = await Promise.all([
        supabase.from('reader_notes').select('*').eq('paper_link', paperLink).order('created_at', { ascending: false }),
        supabase.from('reader_highlights').select('*').eq('paper_link', paperLink).order('created_at', { ascending: false }),
      ]);

      if (!noteError && noteRows) {
        const nextNotes = noteRows.map(row => ({ id: Number(row.id), content: row.content, createdAt: new Date(row.created_at).toLocaleString() }));
        setNotes(nextNotes);
        localStorage.removeItem(`${storageKey}_notes`);
      }

      if (!highlightError && highlightRows) {
        const nextHighlights = highlightRows.map(row => ({ id: Number(row.id), text: row.text, color: row.color, createdAt: new Date(row.created_at).toLocaleString() }));
        setHighlights(nextHighlights);
        localStorage.removeItem(`${storageKey}_highlights`);
      }

      const { data: libraryRow } = await supabase
        .from('reading_library')
        .select('status, priority, ai_card, research_plan')
        .eq('link', paperLink)
        .maybeSingle();

      if (libraryRow) {
        setReadingStatus(libraryRow.status || '未读');
        setReadingPriority(libraryRow.priority || '中');
        setReadingCard(libraryRow.ai_card || '');
        setResearchPlan(libraryRow.research_plan || '');
        localStorage.removeItem(`${storageKey}_card`);
        localStorage.removeItem(`${storageKey}_plan`);
      }
      return;
    }

    setNotes(JSON.parse(localStorage.getItem(`${storageKey}_notes`) || '[]'));
    setHighlights(JSON.parse(localStorage.getItem(`${storageKey}_highlights`) || '[]'));
    setReadingCard(localStorage.getItem(`${storageKey}_card`) || paper.aiCard || '');
    setResearchPlan(localStorage.getItem(`${storageKey}_plan`) || '');
    setReadingStatus(paper.status || '未读');
    setReadingPriority(paper.priority || '中');
  };

  const syncLibraryMeta = async (changes: { status?: string; priority?: string; ai_card?: string; research_plan?: string }) => {
    if (changes.status) setReadingStatus(changes.status);
    if (changes.priority) setReadingPriority(changes.priority);
    if (changes.ai_card !== undefined) {
      setReadingCard(changes.ai_card);
      if (!isSupabaseConfigured || paperLink.startsWith('blob:')) localStorage.setItem(`${storageKey}_card`, changes.ai_card);
    }
    if (changes.research_plan !== undefined) {
      setResearchPlan(changes.research_plan);
      if (!isSupabaseConfigured || paperLink.startsWith('blob:')) localStorage.setItem(`${storageKey}_plan`, changes.research_plan);
    }

    if (!isSupabaseConfigured || !paperLink || paperLink.startsWith('blob:')) return;
    const payload: Record<string, string> = { updated_at: new Date().toISOString() } as Record<string, string>;
    if (changes.status) payload.status = changes.status;
    if (changes.priority) payload.priority = changes.priority;
    if (changes.ai_card !== undefined) payload.ai_card = changes.ai_card;
    if (changes.research_plan !== undefined) payload.research_plan = changes.research_plan;
    const { error } = await supabase.from('reading_library').update(payload).eq('link', paperLink);
    if (error) console.error('同步阅读元信息失败:', error.message);
  };

  const captureSelection = () => {
    const text = window.getSelection()?.toString().trim() || '';
    if (!text) return;
    setSelectedText(text);
    setHighlightDraft(text);
  };

  const paperPrompt = () => {
    if (!paper) return '';
    return [
      `题名：${paper.title}`,
      `作者：${paper.authors || '未知'}`,
      `来源：${paper.source || paper.journal || '未知'}`,
      `摘要：${paper.summary || paper.abstract || '暂无摘要'}`,
    ].join('\n');
  };

  const callReaderAI = async (action: 'explain' | 'translate' | 'card' | 'plan', content: string) => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/reader-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content }),
      });
      const data = await response.json();
      return data.result || data.error || 'AI 暂时没有返回内容。';
    } catch (error) {
      console.error('Reader AI request failed:', error);
      return 'AI 服务暂时不可用，请稍后重试。';
    } finally {
      setAiLoading(false);
    }
  };

  const explainPaper = async () => {
    if (!paper) return;
    setAiReading(await callReaderAI('explain', paperPrompt()));
  };

  const generateReadingCard = async () => {
    if (!paper) return;
    const card = await callReaderAI('card', paperPrompt());
    await syncLibraryMeta({ ai_card: card, status: '在读' });
  };

  const generateResearchPlan = async () => {
    if (!paper) return;
    const plan = await callReaderAI('plan', paperPrompt());
    await syncLibraryMeta({ research_plan: plan });
  };

  const translateText = async () => {
    if (!selectedText.trim()) return;
    setTranslation(await callReaderAI('translate', selectedText.trim()));
  };

  const addNote = async () => {
    if (!noteDraft.trim()) return;
    const draft = noteDraft.trim();
    const next = [{ id: Date.now(), content: draft, createdAt: new Date().toLocaleString() }, ...notes];
    setNotes(next);
    if (!isSupabaseConfigured || paperLink.startsWith('blob:')) localStorage.setItem(`${storageKey}_notes`, JSON.stringify(next));
    setNoteDraft('');

    if (isSupabaseConfigured && paper && paperLink && !paperLink.startsWith('blob:')) {
      const { error } = await supabase.from('reader_notes').insert([{ paper_link: paperLink, paper_title: paper.title, content: draft }]);
      if (error) console.error('保存云端阅读笔记失败:', error.message);
    }
  };

  const addHighlight = async () => {
    const text = (highlightDraft || selectedText).trim();
    if (!text) return;
    const next = [{ id: Date.now(), text, color: '#fef3c7', createdAt: new Date().toLocaleString() }, ...highlights];
    setHighlights(next);
    if (!isSupabaseConfigured || paperLink.startsWith('blob:')) localStorage.setItem(`${storageKey}_highlights`, JSON.stringify(next));
    setHighlightDraft('');

    if (isSupabaseConfigured && paper && paperLink && !paperLink.startsWith('blob:')) {
      const { error } = await supabase.from('reader_highlights').insert([{ paper_link: paperLink, paper_title: paper.title, text, color: '#fef3c7' }]);
      if (error) console.error('保存云端重点摘录失败:', error.message);
    }
  };

  const markAsReading = async () => {
    if (!paper) return;
    await syncLibraryMeta({ status: '在读' });
  };

  const exportWorkspace = () => {
    if (!paper) return;
    const content = [
      `# ${paper.title}`,
      '',
      `- 作者：${paper.authors || '未知'}`,
      `- 来源：${paper.source || paper.journal || '未知'}`,
      `- 状态：${readingStatus}`,
      `- 优先级：${readingPriority}`,
      '',
      '## 摘要',
      paper.summary || paper.abstract || '暂无摘要',
      '',
      '## AI 精读框架',
      aiReading || '暂无',
      '',
      '## 精读卡片',
      readingCard || '暂无',
      '',
      '## 研究计划',
      researchPlan || '暂无',
      '',
      '## 阅读笔记',
      ...notes.map(note => `- ${note.createdAt}｜${note.content}`),
      '',
      '## 重点摘录',
      ...highlights.map(item => `- ${item.createdAt}｜${item.text}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.title.slice(0, 40)}-reading-workspace.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const noteCount = notes.length;
  const highlightCount = highlights.length;
  const outputCount = Number(Boolean(readingCard)) + Number(Boolean(researchPlan));

  if (!paper) {
    return (
      <main className="reader-empty">
        <div>
          <BookOpen size={40} />
          <h1>还没有打开论文</h1>
          <p>请从学术中心点击“深度研读”或上传 PDF 后进入阅读器。</p>
          <button onClick={() => router.push('/scholar')}>返回学术中心</button>
        </div>
        <style jsx>{`
          .reader-empty { min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #111827; }
          .reader-empty div { width: min(460px, 92vw); background: #fff; border: 1px solid #e5e7eb; border-radius: 30px; padding: 3rem; text-align: center; box-shadow: 0 24px 70px rgba(15,23,42,0.08); }
          h1 { margin: 1rem 0 0.5rem; }
          p { color: #64748b; line-height: 1.7; }
          button { margin-top: 1.5rem; border: none; border-radius: 16px; padding: 0.9rem 1.3rem; background: #111827; color: #fff; font-weight: 800; cursor: pointer; }
        `}</style>
      </main>
    );
  }

  return (
    <main className="reader-page" onMouseUp={captureSelection}>
      <header className="reader-topbar">
        <button className="back" onClick={() => router.push('/scholar')}><ArrowLeft size={18} /> 学术中心</button>
        <div className="paper-title">
          <span>{paper.journal || paper.source || 'Paper Reader'}</span>
          <h1>{paper.title}</h1>
          <p>{paper.authors || '未知作者'}</p>
        </div>
        <div className="topbar-actions">
          <label>
            <span>状态</span>
            <select value={readingStatus} onChange={e => syncLibraryMeta({ status: e.target.value })}>
              {['未读', '在读', '已读', '已复现', '已引用'].map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>优先级</span>
            <select value={readingPriority} onChange={e => syncLibraryMeta({ priority: e.target.value })}>
              {['高', '中', '低'].map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button className="magic" onClick={() => { setActiveTab('deepread'); markAsReading(); explainPaper(); }}><Sparkles size={18} /> AI 解读</button>
        </div>
      </header>

      <section className="workspace-grid">
        <div className="reading-stage">
          <div className="stage-toolbar glass-card">
            <div className="left">
              <span><Eye size={16} /> 阅读工作台</span>
              <small>{pdfUrl && isEmbeddablePdf(pdfUrl) ? '支持内嵌 PDF 预览' : '当前将以网页阅读 + AI 辅助为主'}</small>
            </div>
            <div className="toolbar-actions">
              <button onClick={() => setActiveTab('translate')}><Languages size={16} /> 翻译</button>
              <button onClick={() => setActiveTab('highlights')}><Highlighter size={16} /> 划重点</button>
              <button onClick={exportWorkspace}><Download size={16} /> 导出</button>
            </div>
          </div>

          {selectedText && (
            <div className="selection-bar">
              <span>已选中 {selectedText.length} 字，可以立即翻译、解释或摘录。</span>
              <div>
                <button onClick={() => setActiveTab('translate')}>翻译</button>
                <button onClick={() => setActiveTab('highlights')}>高亮</button>
                <button onClick={() => setActiveTab('notes')}>记笔记</button>
              </div>
            </div>
          )}

          <div className="pdf-shell glass-card">
            <div className="pdf-toolbar">
              <span>论文内容区</span>
              {externalUrl ? <a href={externalUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> 原文链接</a> : null}
            </div>
            {pdfUrl && isEmbeddablePdf(pdfUrl) ? (
              <iframe src={pdfUrl} title={paper.title} />
            ) : (
              <div className="no-pdf">
                <BookOpen size={42} />
                <h2>暂未发现可直接嵌入的 PDF</h2>
                <p>当前来源更像期刊网页或 DOI 落地页。你仍然可以用右侧 AI 结构化精读、翻译、摘录、笔记与导出功能完成整套阅读工作流。</p>
                {externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> 打开论文原文页面</a>}
              </div>
            )}
          </div>
        </div>

        <aside className="analysis-rail">
          <div className="rail-summary glass-card">
            <div className="summary-grid">
              <div><span>状态</span><strong>{readingStatus}</strong></div>
              <div><span>优先级</span><strong>{readingPriority}</strong></div>
              <div><span>笔记</span><strong>{noteCount}</strong></div>
              <div><span>重点</span><strong>{highlightCount}</strong></div>
            </div>
            <div className="summary-grid compact">
              <div><span>AI 产出</span><strong>{outputCount}</strong></div>
              <div><span>摘要质量</span><strong>{paper.summary ? '较完整' : '待补充'}</strong></div>
            </div>
          </div>

          <nav className="tabs glass-card">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>概览</button>
            <button className={activeTab === 'deepread' ? 'active' : ''} onClick={() => setActiveTab('deepread')}>深读</button>
            <button className={activeTab === 'translate' ? 'active' : ''} onClick={() => setActiveTab('translate')}>翻译</button>
            <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>笔记</button>
            <button className={activeTab === 'highlights' ? 'active' : ''} onClick={() => setActiveTab('highlights')}>重点</button>
            <button className={activeTab === 'outputs' ? 'active' : ''} onClick={() => setActiveTab('outputs')}>产出</button>
          </nav>

          <div className="rail-panel glass-card">
            {activeTab === 'overview' && (
              <div className="panel-section">
                <div className="hero-card">
                  <Brain size={18} />
                  <div>
                    <strong>论文速览</strong>
                    <p>先建立问题、方法、实验、结论的全局图，再进入逐段精读。</p>
                  </div>
                </div>
                <div className="info-block">
                  <span>摘要</span>
                  <p>{paper.summary || paper.abstract || '暂无摘要。建议先阅读摘要、引言和结论，再让 AI 帮你梳理方法贡献。'}</p>
                </div>
                <div className="insight-grid">
                  <div><span>建议路径</span><b>摘要 → 图表 → 方法 → 实验 → 局限</b></div>
                  <div><span>适合记录</span><b>创新点、对比基线、关键数据集、失败案例</b></div>
                  <div><span>当前动作</span><b>点击“深读”可生成 AI 精读框架</b></div>
                </div>
              </div>
            )}

            {activeTab === 'deepread' && (
              <div className="panel-section">
                <div className="hero-card">
                  <Sparkles size={18} />
                  <div>
                    <strong>AI 深度研读</strong>
                    <p>把摘要、来源、题名组织成精读框架，辅助你建立论文理解地图。</p>
                  </div>
                </div>
                <div className="quick-ai-actions">
                  <button className="primary" onClick={explainPaper}><Sparkles size={16} /> {aiLoading ? 'AI 正在解读...' : '生成精读框架'}</button>
                  <button onClick={generateReadingCard}><ClipboardList size={16} /> 精读卡片</button>
                  <button onClick={generateResearchPlan}><Wand2 size={16} /> 研究计划</button>
                </div>
                {aiReading ? <div className="result">{aiReading}</div> : <div className="empty-result">点击上方按钮，生成结构化解读。</div>}
              </div>
            )}

            {activeTab === 'translate' && (
              <div className="panel-section">
                <h3>选择与翻译</h3>
                <p className="hint">在页面文本中选中内容会自动填入；PDF 内文本若无法捕获，可手动粘贴。</p>
                <textarea value={selectedText} onChange={e => setSelectedText(e.target.value)} placeholder="粘贴英文段落或选中文本..." />
                <button className="primary" onClick={translateText}><Languages size={16} /> {aiLoading ? 'AI 正在翻译...' : '翻译并解释'}</button>
                {translation && <div className="result">{translation}</div>}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="panel-section">
                <h3>阅读笔记</h3>
                <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="记录你的理解、疑问、复现实验思路..." />
                <button className="primary" onClick={addNote}><Plus size={16} /> 添加笔记</button>
                <div className="list">
                  {notes.map(note => <article key={note.id}><time>{note.createdAt}</time><p>{note.content}</p></article>)}
                </div>
              </div>
            )}

            {activeTab === 'highlights' && (
              <div className="panel-section">
                <h3>重点摘录</h3>
                <textarea value={highlightDraft} onChange={e => setHighlightDraft(e.target.value)} placeholder="粘贴或保留选中的关键句..." />
                <button className="primary" onClick={addHighlight}><Highlighter size={16} /> 添加重点</button>
                <div className="list highlights">
                  {highlights.map(item => <article key={item.id}><time>{item.createdAt}</time><p>{item.text}</p></article>)}
                </div>
              </div>
            )}

            {activeTab === 'outputs' && (
              <div className="panel-section">
                <h3>阅读产出</h3>
                <div className="output-block">
                  <strong>精读卡片</strong>
                  <div className="result compact">{readingCard || '还没有生成精读卡片。'}</div>
                </div>
                <div className="output-block">
                  <strong>研究计划</strong>
                  <div className="result compact">{researchPlan || '还没有生成研究计划。'}</div>
                </div>
                <button className="primary" onClick={exportWorkspace}><Download size={16} /> 导出当前阅读工作区</button>
              </div>
            )}
          </div>
        </aside>
      </section>

      <style jsx>{`
        .reader-page { min-height: 100vh; background: #f6f7f9; color: #111827; padding: 1.2rem; }
        .reader-topbar { min-height: 92px; display: grid; grid-template-columns: 160px minmax(0, 1fr) minmax(280px, 420px); gap: 1rem; align-items: center; background: rgba(255,255,255,0.86); backdrop-filter: blur(18px); border: 1px solid #e5e7eb; border-radius: 26px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 18px 45px rgba(15,23,42,0.06); }
        .back, .magic, .primary { border: none; cursor: pointer; font-weight: 850; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; }
        .back, .magic { height: 46px; border-radius: 16px; background: #111827; color: #fff; }
        .back { background: #fff; color: #111827; border: 1px solid #e5e7eb; }
        .paper-title { min-width: 0; }
        .paper-title span { color: #64748b; font-size: 0.76rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
        .paper-title h1 { margin: 0.35rem 0 0.25rem; font-size: 1.45rem; line-height: 1.35; letter-spacing: -0.04em; }
        .paper-title p { color: #64748b; font-weight: 700; margin: 0; }
        .topbar-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) auto; gap: 0.8rem; align-items: end; }
        .topbar-actions label { display: grid; gap: 0.35rem; font-size: 0.74rem; font-weight: 900; color: #64748b; }
        .topbar-actions select { height: 46px; border-radius: 14px; border: 1px solid #e5e7eb; background: #fff; padding: 0 0.8rem; font-weight: 800; }
        .workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 1rem; align-items: start; }
        .glass-card { background: rgba(255,255,255,0.92); border: 1px solid #e5e7eb; border-radius: 24px; box-shadow: 0 18px 45px rgba(15,23,42,0.05); }
        .reading-stage { display: grid; gap: 1rem; }
        .stage-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.1rem; }
        .stage-toolbar .left { display: grid; gap: 0.2rem; }
        .stage-toolbar span { display: inline-flex; align-items: center; gap: 0.45rem; font-weight: 900; }
        .stage-toolbar small { color: #64748b; font-weight: 700; }
        .toolbar-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .toolbar-actions button { border: 1px solid #e5e7eb; background: #fff; border-radius: 14px; padding: 0.7rem 0.9rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer; }
        .selection-bar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.9rem 1rem; border-radius: 18px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-weight: 800; }
        .selection-bar div { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .selection-bar button { border: none; border-radius: 999px; background: #fff; color: #1d4ed8; padding: 0.5rem 0.85rem; font-weight: 900; cursor: pointer; }
        .pdf-shell { overflow: hidden; }
        .pdf-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.1rem; border-bottom: 1px solid #eef2f7; font-weight: 900; }
        .pdf-toolbar a { display: inline-flex; align-items: center; gap: 0.45rem; color: #2563eb; text-decoration: none; }
        iframe { width: 100%; min-height: 78vh; border: none; background: #fff; }
        .no-pdf { min-height: 70vh; display: grid; place-items: center; text-align: center; padding: 2rem; color: #475569; }
        .no-pdf h2 { color: #111827; margin: 0.9rem 0 0.5rem; }
        .no-pdf p { max-width: 620px; line-height: 1.75; }
        .no-pdf a { margin-top: 1rem; display: inline-flex; align-items: center; gap: 0.45rem; color: #2563eb; text-decoration: none; font-weight: 900; }
        .analysis-rail { display: grid; gap: 1rem; position: sticky; top: 1rem; }
        .rail-summary, .tabs, .rail-panel { padding: 1rem; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.7rem; }
        .summary-grid.compact { margin-top: 0.7rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .summary-grid div { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 16px; padding: 0.8rem; }
        .summary-grid span { display: block; color: #64748b; font-size: 0.72rem; font-weight: 900; }
        .summary-grid strong { display: block; margin-top: 0.35rem; font-size: 1.05rem; }
        .tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.55rem; }
        .tabs button { border: 1px solid #e5e7eb; background: #f8fafc; border-radius: 14px; padding: 0.7rem 0.8rem; font-weight: 900; color: #64748b; cursor: pointer; }
        .tabs button.active { background: #111827; color: #fff; border-color: #111827; }
        .panel-section { display: grid; gap: 1rem; }
        .hero-card { display: flex; gap: 0.8rem; padding: 0.95rem; border-radius: 18px; background: linear-gradient(135deg, #eff6ff, #ffffff); border: 1px solid #dbeafe; }
        .hero-card strong { display: block; margin-bottom: 0.25rem; }
        .hero-card p { margin: 0; color: #475569; line-height: 1.6; }
        .info-block span, .output-block strong { display: block; color: #64748b; font-size: 0.76rem; font-weight: 900; margin-bottom: 0.45rem; }
        .info-block p { margin: 0; line-height: 1.7; color: #334155; }
        .insight-grid { display: grid; gap: 0.7rem; }
        .insight-grid div { border: 1px solid #e5e7eb; border-radius: 16px; padding: 0.85rem; background: #f8fafc; }
        .insight-grid span { display: block; color: #64748b; font-size: 0.72rem; font-weight: 900; margin-bottom: 0.3rem; }
        .quick-ai-actions { display: flex; gap: 0.7rem; flex-wrap: wrap; }
        .quick-ai-actions button, .primary { border: none; border-radius: 14px; background: #eef2ff; color: #3730a3; padding: 0.8rem 1rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 0.45rem; }
        .primary { background: #111827; color: #fff; }
        textarea { width: 100%; min-height: 110px; border: 1px solid #e5e7eb; border-radius: 16px; padding: 0.9rem 1rem; font-size: 0.98rem; line-height: 1.6; resize: vertical; outline: none; }
        .hint { color: #64748b; font-size: 0.9rem; line-height: 1.6; margin: -0.25rem 0 0; }
        .result { white-space: pre-wrap; line-height: 1.72; color: #334155; border: 1px solid #e5e7eb; background: #f8fafc; border-radius: 18px; padding: 1rem; }
        .result.compact { min-height: 72px; }
        .empty-result { color: #94a3b8; border: 1px dashed #cbd5e1; border-radius: 18px; padding: 1rem; text-align: center; }
        .list { display: grid; gap: 0.8rem; max-height: 360px; overflow: auto; }
        .list article { border: 1px solid #e5e7eb; border-radius: 16px; padding: 0.9rem; background: #fff; }
        .list time { display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 800; margin-bottom: 0.45rem; }
        .list p { margin: 0; line-height: 1.7; color: #334155; }
        .output-block { display: grid; gap: 0.55rem; }
        @media (max-width: 1200px) {
          .workspace-grid { grid-template-columns: 1fr; }
          .analysis-rail { position: static; }
        }
        @media (max-width: 860px) {
          .reader-topbar { grid-template-columns: 1fr; }
          .topbar-actions { grid-template-columns: 1fr 1fr; }
          .stage-toolbar, .selection-bar { flex-direction: column; align-items: flex-start; }
          .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </main>
  );
};

export default ReaderPage;