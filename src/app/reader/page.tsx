'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ClipboardList,
  ExternalLink,
  Highlighter,
  Languages,
  NotebookPen,
  Plus,
  Sparkles,
  Wand2
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

const ReaderPage = () => {
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'translate' | 'notes' | 'highlights'>('ai');
  const [selectedText, setSelectedText] = useState('');
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

  const isEmbeddablePdf = (url = '') => url.startsWith('blob:') || url.includes('arxiv.org/pdf');
  const pdfUrl = paper?.pdfUrl || '';
  const externalUrl = paper?.link || paper?.url || paper?.pdfUrl || '';
  const paperLink = paper?.link || paper?.pdfUrl || paper?.url || paper?.title || '';

  useEffect(() => {
    const raw = sessionStorage.getItem('nexus_reading_paper');
    if (raw) {
      setPaper(JSON.parse(raw));
    }
  }, []);

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
        localStorage.setItem(`${storageKey}_notes`, JSON.stringify(nextNotes));
      } else if (noteError) {
        console.error('加载云端阅读笔记失败:', noteError.message);
      }

      if (!highlightError && highlightRows) {
        const nextHighlights = highlightRows.map(row => ({ id: Number(row.id), text: row.text, color: row.color, createdAt: new Date(row.created_at).toLocaleString() }));
        setHighlights(nextHighlights);
        localStorage.setItem(`${storageKey}_highlights`, JSON.stringify(nextHighlights));
      } else if (highlightError) {
        console.error('加载云端重点摘录失败:', highlightError.message);
      }

      const { data: libraryRow, error: libraryError } = await supabase
        .from('reading_library')
        .select('status, priority, ai_card')
        .eq('link', paperLink)
        .maybeSingle();

      if (!libraryError && libraryRow) {
        setReadingStatus(libraryRow.status || '未读');
        setReadingPriority(libraryRow.priority || '中');
        setReadingCard(libraryRow.ai_card || '');
        localStorage.setItem(`${storageKey}_card`, libraryRow.ai_card || '');
      }

      const localPlan = localStorage.getItem(`${storageKey}_plan`) || '';
      setResearchPlan(localPlan);
      return;
    }

    const savedNotes = localStorage.getItem(`${storageKey}_notes`);
    const savedHighlights = localStorage.getItem(`${storageKey}_highlights`);
    const savedCard = localStorage.getItem(`${storageKey}_card`) || paper.aiCard || '';
    const savedPlan = localStorage.getItem(`${storageKey}_plan`) || '';
    setNotes(savedNotes ? JSON.parse(savedNotes) : []);
    setHighlights(savedHighlights ? JSON.parse(savedHighlights) : []);
    setReadingCard(savedCard);
    setResearchPlan(savedPlan);
    setReadingStatus(paper.status || '未读');
    setReadingPriority(paper.priority || '中');
  };

  const syncLibraryMeta = async (changes: { status?: string; priority?: string; ai_card?: string }) => {
    if (changes.status) setReadingStatus(changes.status);
    if (changes.priority) setReadingPriority(changes.priority);
    if (changes.ai_card !== undefined) {
      setReadingCard(changes.ai_card);
      localStorage.setItem(`${storageKey}_card`, changes.ai_card);
    }

    if (!isSupabaseConfigured || !paperLink || paperLink.startsWith('blob:')) return;
    const payload: Record<string, string> = { updated_at: new Date().toISOString() } as Record<string, string>;
    if (changes.status) payload.status = changes.status;
    if (changes.priority) payload.priority = changes.priority;
    if (changes.ai_card !== undefined) payload.ai_card = changes.ai_card;
    const { error } = await supabase.from('reading_library').update(payload).eq('link', paperLink);
    if (error) console.error('同步阅读元信息失败:', error.message);
  };

  const captureSelection = () => {
    const text = window.getSelection()?.toString().trim() || '';
    if (text) {
      setSelectedText(text);
      setHighlightDraft(text);
      setActiveTab('translate');
    }
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
    setResearchPlan(plan);
    localStorage.setItem(`${storageKey}_plan`, plan);
  };

  const translateText = async () => {
    const text = selectedText.trim();
    if (!text) return;
    setTranslation(await callReaderAI('translate', text));
  };

  const addNote = async () => {
    if (!noteDraft.trim()) return;
    const draft = noteDraft.trim();
    const next = [{ id: Date.now(), content: draft, createdAt: new Date().toLocaleString() }, ...notes];
    setNotes(next);
    localStorage.setItem(`${storageKey}_notes`, JSON.stringify(next));
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
    localStorage.setItem(`${storageKey}_highlights`, JSON.stringify(next));
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
          <button className="magic" onClick={() => { setActiveTab('ai'); markAsReading(); explainPaper(); }}><Sparkles size={18} /> AI 解读</button>
        </div>
      </header>

      <section className="reader-shell">
        <div className="pdf-pane">
          <div className="pdf-toolbar">
            <span>PDF 阅读区</span>
            <button onClick={() => { setHighlightDraft(selectedText); setActiveTab('highlights'); }}><Highlighter size={16} /> 划重点</button>
          </div>
          {pdfUrl && isEmbeddablePdf(pdfUrl) ? (
            <iframe src={pdfUrl} title={paper.title} />
          ) : (
            <div className="no-pdf">
              <BookOpen size={42} />
              <h2>暂未发现可直接嵌入的 PDF</h2>
              <p>当前来源更像期刊网页或 DOI 落地页，很多顶刊会禁止在 iframe 中直接预览。你仍然可以用右侧摘要精读、AI 解读和笔记功能。</p>
              {externalUrl && (
                <a href={externalUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> 打开论文原文页面</a>
              )}
            </div>
          )}
        </div>

        <aside className="ai-panel">
          {selectedText && (
            <div className="selection-bar">
              <span>已选中 {selectedText.length} 字</span>
              <button onClick={() => setActiveTab('translate')}>翻译</button>
              <button onClick={() => setActiveTab('highlights')}>高亮</button>
            </div>
          )}
          <nav className="tabs">
            <button className={activeTab === 'ai' ? 'active' : ''} onClick={() => setActiveTab('ai')}><Brain size={16} /> 解读</button>
            <button className={activeTab === 'translate' ? 'active' : ''} onClick={() => setActiveTab('translate')}><Languages size={16} /> 翻译</button>
            <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}><NotebookPen size={16} /> 笔记</button>
            <button className={activeTab === 'highlights' ? 'active' : ''} onClick={() => setActiveTab('highlights')}><Highlighter size={16} /> 高亮</button>
          </nav>

          {activeTab === 'ai' && (
            <div className="panel-section">
              <div className="ai-card hero">
                <Wand2 size={18} />
                <div>
                  <strong>实时解读</strong>
                  <p>根据题名、摘要、期刊和引用信息生成精读框架。</p>
                </div>
              </div>
              <h3>论文速览</h3>
              <p>{paper.summary || paper.abstract || '暂无摘要。建议先阅读摘要、方法和实验部分，并在翻译页粘贴关键段落进行逐句理解。'}</p>
              <button className="primary" onClick={explainPaper}><Sparkles size={16} /> {aiLoading ? 'AI 正在解读...' : '生成精读框架'}</button>
              <div className="quick-ai-actions">
                <button onClick={generateReadingCard}><ClipboardList size={16} /> 生成精读卡片</button>
                <button onClick={generateResearchPlan}><Wand2 size={16} /> 生成研究计划</button>
              </div>
              {aiReading && <div className="result">{aiReading}</div>}
              {readingCard && <div className="result card-result"><strong>精读卡片</strong>\n{readingCard}</div>}
              {researchPlan && <div className="result card-result"><strong>研究计划</strong>\n{researchPlan}</div>}
              <div className="insight-grid">
                <div><span>核心问题</span><b>该工作试图解决领域中的关键瓶颈。</b></div>
                <div><span>阅读顺序</span><b>摘要 → 图表 → 方法 → 实验 → 局限。</b></div>
                <div><span>精读建议</span><b>优先标记方法创新、数据集、评价指标和失败案例。</b></div>
              </div>
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
        </aside>
      </section>

      <style jsx>{`
        .reader-page { min-height: 100vh; background: #f6f7f9; color: #111827; padding: 1.2rem; }
        .reader-topbar { min-height: 86px; display: grid; grid-template-columns: 160px minmax(0, 1fr) minmax(280px, 420px); gap: 1rem; align-items: center; background: rgba(255,255,255,0.86); backdrop-filter: blur(18px); border: 1px solid #e5e7eb; border-radius: 26px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 18px 45px rgba(15,23,42,0.06); }
        .back, .magic, .pdf-toolbar button, .tabs button, .primary { border: none; cursor: pointer; font-weight: 850; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; }
        .back, .magic { height: 46px; border-radius: 16px; background: #111827; color: #fff; }
        .back { background: #fff; color: #111827; border: 1px solid #e5e7eb; }
        .paper-title { min-width: 0; }
        .paper-title span { color: #64748b; font-size: 0.76rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
        .paper-title h1 { margin: 0.25rem 0 0; font-size: 1.08rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .topbar-actions { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; flex-wrap: wrap; }
        .topbar-actions label { display: grid; gap: .2rem; font-size: .72rem; font-weight: 900; color: #64748b; }
        .topbar-actions select { min-width: 86px; height: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; padding: 0 .7rem; color: #111827; font-weight: 800; }
        .reader-shell { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 1rem; height: calc(100vh - 112px); }
        .pdf-pane, .ai-panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 28px; overflow: hidden; box-shadow: 0 18px 45px rgba(15,23,42,0.05); }
        .pdf-toolbar { height: 58px; display: flex; align-items: center; justify-content: space-between; padding: 0 1rem 0 1.25rem; border-bottom: 1px solid #eef2f7; font-weight: 900; }
        .pdf-toolbar button { height: 38px; padding: 0 0.9rem; border-radius: 13px; background: #f8fafc; color: #334155; }
        iframe { width: 100%; height: calc(100% - 58px); border: none; background: #f1f5f9; }
        .no-pdf { height: calc(100% - 58px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.9rem; color: #64748b; padding: 2rem; text-align: center; background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%); }
        .no-pdf h2 { margin: 0; color: #111827; font-size: 1.18rem; }
        .no-pdf p { max-width: 460px; margin: 0; line-height: 1.75; }
        .no-pdf a { margin-top: 0.4rem; display: inline-flex; align-items: center; gap: 0.45rem; height: 42px; padding: 0 1rem; border-radius: 14px; background: #111827; color: #fff; text-decoration: none; font-weight: 850; }
        .ai-panel { display: flex; flex-direction: column; }
        .selection-bar { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .75rem .85rem; border-bottom: 1px solid #eef2f7; background: #fffbeb; color: #92400e; font-size: .78rem; font-weight: 900; }
        .selection-bar button { border: none; background: #fff; color: #92400e; border-radius: 10px; padding: .45rem .7rem; font-weight: 900; cursor: pointer; }
        .tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; padding: 0.75rem; border-bottom: 1px solid #eef2f7; }
        .tabs button { height: 42px; border-radius: 14px; background: transparent; color: #64748b; font-size: 0.82rem; }
        .tabs button.active { background: #111827; color: #fff; }
        .panel-section { padding: 1.25rem; overflow: auto; }
        .panel-section h3 { margin: 0 0 0.9rem; font-size: 1.2rem; letter-spacing: -0.02em; }
        .panel-section p { color: #475569; line-height: 1.75; }
        .ai-card { display: flex; gap: 0.8rem; padding: 1rem; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 20px; margin-bottom: 1.2rem; }
        .ai-card p { margin: 0.25rem 0 0; font-size: 0.88rem; }
        .insight-grid { display: grid; gap: 0.8rem; margin-top: 1rem; }
        .insight-grid div, .list article, .result { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 18px; padding: 1rem; }
        .insight-grid span, time, .hint { color: #94a3b8; font-size: 0.76rem; font-weight: 900; }
        .insight-grid b { display: block; margin-top: 0.35rem; line-height: 1.55; }
        textarea { width: 100%; min-height: 138px; resize: vertical; border: 1px solid #e5e7eb; border-radius: 18px; padding: 1rem; outline: none; font: inherit; line-height: 1.6; background: #fff; }
        textarea:focus { border-color: #111827; }
        .primary { width: 100%; height: 46px; margin: 0.85rem 0; border-radius: 16px; background: #111827; color: #fff; }
        .quick-ai-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; margin-bottom: .85rem; }
        .quick-ai-actions button { border: 1px solid #e5e7eb; background: #f8fafc; color: #334155; border-radius: 14px; min-height: 42px; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: .45rem; }
        .result { white-space: pre-wrap; color: #334155; line-height: 1.7; }
        .card-result strong { color: #111827; }
        .list { display: grid; gap: 0.8rem; margin-top: 0.5rem; }
        .list p { margin: 0.35rem 0 0; color: #111827; }
        .highlights article { background: #fffbeb; border-color: #fde68a; }
        @media (max-width: 980px) {
          .reader-topbar, .reader-shell { grid-template-columns: 1fr; height: auto; }
          .topbar-actions { justify-content: flex-start; }
          .reader-shell { min-height: 100vh; }
          .pdf-pane { height: 70vh; }
        }
      `}</style>
    </main>
  );
};

export default ReaderPage;
