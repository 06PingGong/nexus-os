'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Plus, 
  Search, 
  Calendar, 
  Image as ImageIcon, 
  Tag, 
  Smile,
  MoreHorizontal,
  Trash2
} from 'lucide-react';

const JournalPage = () => {
  const { journalEntries, setJournalEntries, addJournal } = useApp();
  const [entry, setEntry] = useState('');

  const handleAddEntry = () => {
    if (!entry.trim()) return;
    addJournal(entry);
    setEntry('');
  };

  const deleteEntry = (id: number) => {
    setJournalEntries(journalEntries.filter(e => e.id !== id));
  };

  return (
    <div className="journal-page">
      <header className="page-header">
        <h1>随记与感悟</h1>
        <div className="search-box glass-card">
          <Search size={16} />
          <input type="text" placeholder="搜索您的想法..." />
        </div>
      </header>

      <div className="editor-section glass-card">
        <textarea 
          placeholder="在想什么？捕获到了新的灵感吗？" 
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
        />
        <div className="editor-actions">
          <div className="tool-group">
            <button title="添加图片"><ImageIcon size={18} /></button>
            <button title="添加标签"><Tag size={18} /></button>
            <button title="记录心情"><Smile size={18} /></button>
          </div>
          <button className="publish-btn" onClick={handleAddEntry}>
            <Plus size={18} /> <span>记录随记</span>
          </button>
        </div>
      </div>

      <div className="timeline">
        {journalEntries.length > 0 ? journalEntries.map(item => (
          <div key={item.id} className="journal-card glass-card">
            <div className="card-header">
              <span className="date"><Calendar size={14} /> {item.date}</span>
              <div className="card-actions">
                <button className="delete-btn" onClick={() => deleteEntry(item.id)}><Trash2 size={16} /></button>
                <button className="more-btn"><MoreHorizontal size={18} /></button>
              </div>
            </div>
            <p className="content">{item.content}</p>
            <div className="tags">
              {item.tags.map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          </div>
        )) : (
          <div className="empty-state">还没有随记，写下你的第一个灵感吧！</div>
        )}
      </div>

      <style jsx>{`
        .journal-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #18181b;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          margin-top: 1.5rem;
          background: #ffffff;
          border: 1px solid #f4f4f5;
        }

        .search-box input {
          background: transparent;
          border: none;
          color: #18181b;
          width: 100%;
          outline: none;
          font-size: 0.9rem;
        }

        .editor-section {
          padding: 1.25rem;
          margin-bottom: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: #ffffff;
          border: 1px solid #f4f4f5;
        }

        textarea {
          background: transparent;
          border: none;
          color: #18181b;
          font-size: 1rem;
          min-height: 100px;
          resize: none;
          outline: none;
          line-height: 1.6;
        }

        .editor-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f4f4f5;
          padding-top: 1rem;
        }

        .tool-group {
          display: flex;
          gap: 0.5rem;
        }

        .tool-group button {
          background: #ffffff;
          border: 1px solid #e4e4e7;
          color: #71717a;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .publish-btn {
          background: #18181b;
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.85rem;
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .journal-card {
          padding: 1.25rem;
          background: #ffffff;
          border: 1px solid #f4f4f5;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #a1a1aa;
        }

        .content {
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          color: #3f3f46;
        }

        .tags {
          display: flex;
          gap: 0.5rem;
        }

        .tag {
          font-size: 0.75rem;
          color: #2563eb;
          font-weight: 500;
          background: #eff6ff;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }

        .more-btn, .delete-btn {
          background: transparent;
          border: none;
          color: #d4d4d8;
          cursor: pointer;
        }

        .delete-btn:hover {
          color: #ef4444;
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: #a1a1aa;
          background: #f9fafb;
          border: 1px dashed #e4e4e7;
          border-radius: 12px;
        }

        .glass-card {
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default JournalPage;
