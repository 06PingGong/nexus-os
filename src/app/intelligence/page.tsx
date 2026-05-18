'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Lightbulb,
  Target,
  Zap,
  Plus,
  Trash2,
  Star,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type InsightTab = 'application' | 'tech_tool';

interface Insight {
  id: number;
  type: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  priority: string;
  source?: string;
  link?: string;
  created_at: string;
}

const IntelligencePage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<InsightTab>('application');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    target: '', // 对于 application：目标院校/导师；对于 tech_tool：关注领域
    context: '', // 背景或补充信息
  });

  useEffect(() => {
    loadInsights();
  }, [activeTab]);

  const loadInsights = async () => {
    if (!isSupabaseConfigured) {
      setInsights([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('type', activeTab)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInsights(data as Insight[]);
      }
    } catch (error) {
      console.error('加载情报失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async () => {
    if (!formData.target.trim()) {
      alert('请输入信息内容');
      return;
    }

    setGenerating(true);
    try {
      const action = activeTab === 'application' ? 'application_insight' : 'tech_tool_update';
      const prompt =
        activeTab === 'application'
          ? `目标院校/导师信息：${formData.target}\n背景说明：${formData.context || '暂无'}\n\n请分析这位学生的保研/出国申请机会、准备方向和竞争力亮点。`
          : `关注领域/研究方向：${formData.target}\n补充信息：${formData.context || '暂无'}\n\n请分析当前该领域最新的工具、方法、数据集和实践机会。`;

      const response = await fetch('/api/reader-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content: prompt }),
      });

      const data = await response.json();
      let parsedContent = '';

      try {
        const jsonText = String(data.result || '')
          .replace(/^```json/i, '')
          .replace(/^```/, '')
          .replace(/```$/, '')
          .trim();
        const parsed = JSON.parse(jsonText);
        parsedContent = JSON.stringify(parsed, null, 2);
      } catch {
        parsedContent = data.result || '生成失败';
      }

      if (isSupabaseConfigured && !parsedContent.includes('生成失败')) {
        const { error } = await supabase.from('insights').insert([
          {
            type: activeTab,
            category: activeTab === 'application' ? '申请情报' : '工具前沿',
            title:
              activeTab === 'application'
                ? `${formData.target} 保研/出国申请分析`
                : `${formData.target} 技术工具更新`,
            content: parsedContent,
            tags: formData.target.split(/[\s,，]+/).filter(Boolean),
            priority: '高',
            source: 'AI 生成',
          },
        ]);

        if (!error) {
          await loadInsights();
          setFormData({ target: '', context: '' });
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error('生成情报失败:', error);
      alert('AI 生成失败，请检查配置');
    } finally {
      setGenerating(false);
    }
  };

  const deleteInsight = async (id: number) => {
    if (!isSupabaseConfigured) return;

    try {
      await supabase.from('insights').delete().eq('id', id);
      await loadInsights();
    } catch (error) {
      console.error('删除情报失败:', error);
    }
  };

  return (
    <main className="intelligence-page">
      <header className="intel-header">
        <button className="back-btn" onClick={() => router.push('/scholar')}>
          <ArrowLeft size={20} /> 返回学术中心
        </button>
        <div className="header-text">
          <h1>情报中心</h1>
          <p>升学机会 · 技术趋势 · 竞赛资讯</p>
        </div>
      </header>

      <div className="intel-tabs">
        <button
          className={activeTab === 'application' ? 'active' : ''}
          onClick={() => {
            setActiveTab('application');
            setShowForm(false);
          }}
        >
          <Target size={18} /> 保研/出国情报
        </button>
        <button
          className={activeTab === 'tech_tool' ? 'active' : ''}
          onClick={() => {
            setActiveTab('tech_tool');
            setShowForm(false);
          }}
        >
          <Zap size={18} /> 技术/工具前沿
        </button>
      </div>

      <div className="intel-content">
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> 生成新情报
        </button>

        <AnimatePresence>
          {showForm && (
            <motion.div className="insight-form glass-card" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h3>{activeTab === 'application' ? '保研/出国申请分析' : '技术工具趋势分析'}</h3>
              <input
                type="text"
                placeholder={activeTab === 'application' ? '例：清华大学 计算机视觉方向' : '例：大语言模型 RAG 技术'}
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              />
              <textarea
                placeholder="补充说明（可选）"
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                rows={3}
              />
              <div className="form-actions">
                <button className="cancel-btn" onClick={() => setShowForm(false)}>
                  取消
                </button>
                <button className="generate-btn" onClick={generateInsight} disabled={generating}>
                  {generating ? <Loader2 size={16} className="spinning" /> : <Lightbulb size={16} />}
                  {generating ? '生成中...' : '生成情报'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="insights-grid">
          {loading ? (
            <div className="loading-state">
              <Loader2 size={32} className="spinning" />
              <p>加载中...</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="empty-state">
              <Lightbulb size={48} />
              <h3>暂无情报</h3>
              <p>{activeTab === 'application' ? '还没有生成保研/出国申请情报' : '还没有生成技术工具情报'}</p>
              <p>点击"生成新情报"开始分析</p>
            </div>
          ) : (
            insights.map((insight) => (
              <motion.div
                key={insight.id}
                className="insight-card glass-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="card-header">
                  <h4>{insight.title}</h4>
                  <button className="delete-btn" onClick={() => deleteInsight(insight.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="card-meta">
                  <span className="priority-badge">{insight.priority}</span>
                  <span className="time">
                    <Calendar size={12} />
                    {new Date(insight.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="card-content">
                  <pre>{insight.content}</pre>
                </div>

                <div className="card-tags">
                  {insight.tags?.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .intelligence-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem 5rem;
          color: #0f172a;
        }

        .intel-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .back-btn {
          border: none;
          background: #f1f5f9;
          color: #0f172a;
          border-radius: 12px;
          padding: 0.8rem 1.2rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #e2e8f0;
          transform: translateX(-2px);
        }

        .header-text h1 {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: -1px;
          margin: 0;
        }

        .header-text p {
          color: #64748b;
          font-weight: 700;
          margin-top: 0.3rem;
        }

        .intel-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 1rem;
        }

        .intel-tabs button {
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 800;
          padding: 0.8rem 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          border-bottom: 3px solid transparent;
          margin-bottom: -1rem;
          transition: all 0.2s;
        }

        .intel-tabs button.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .intel-content {
          display: grid;
          gap: 1.5rem;
        }

        .add-btn {
          width: fit-content;
          border: none;
          background: #0f172a;
          color: #fff;
          border-radius: 16px;
          padding: 1rem 1.6rem;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: all 0.2s;
        }

        .add-btn:hover {
          background: #1e293b;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.1);
        }

        .insight-form {
          padding: 1.6rem;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          display: grid;
          gap: 1rem;
        }

        .insight-form h3 {
          font-size: 1.2rem;
          margin: 0 0 0.5rem;
        }

        .insight-form input,
        .insight-form textarea {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0.9rem;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
        }

        .insight-form input:focus,
        .insight-form textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .cancel-btn,
        .generate-btn {
          border: none;
          border-radius: 12px;
          padding: 0.8rem 1.4rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .cancel-btn {
          background: #f1f5f9;
          color: #0f172a;
        }

        .cancel-btn:hover {
          background: #e2e8f0;
        }

        .generate-btn {
          background: #2563eb;
          color: #fff;
        }

        .generate-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 1.5rem;
        }

        .loading-state,
        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 4rem 2rem;
          color: #64748b;
        }

        .empty-state h3 {
          font-size: 1.3rem;
          margin: 0;
          color: #0f172a;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.95rem;
        }

        .insight-card {
          padding: 1.4rem;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.9);
          display: grid;
          gap: 1rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .card-header h4 {
          font-size: 1.1rem;
          margin: 0;
          flex: 1;
          line-height: 1.4;
        }

        .delete-btn {
          border: none;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 10px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-btn:hover {
          background: #fecaca;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.85rem;
        }

        .priority-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          font-weight: 700;
        }

        .time {
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .card-content {
          background: #f8fafc;
          border-radius: 14px;
          padding: 1rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .card-content pre {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.5;
          color: #334155;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .insights-grid {
            grid-template-columns: 1fr;
          }

          .header-text h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </main>
  );
};

export default IntelligencePage;
