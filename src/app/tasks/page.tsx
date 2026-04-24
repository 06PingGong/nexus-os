'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Plus, 
  Filter, 
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';

const TasksPage = () => {
  const { tasks, setTasks, addTask } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newCategory, setNewCategory] = useState('研究');
  const [newPriority, setNewPriority] = useState('中');

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    addTask(newTaskText, newCategory, newPriority);
    setNewTaskText('');
    setNewPriority('中');
    setShowAdd(false);
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const cyclePriority = (id: number, current: string) => {
    const priorities = ['低', '中', '高'];
    const next = priorities[(priorities.indexOf(current) + 1) % priorities.length];
    setTasks(tasks.map(t => t.id === id ? { ...t, priority: next } : t));
  };

  return (
    <div className="tasks-page">
      <header className="page-header">
        <h1>任务管理</h1>
        <div className="header-actions">
          <button className="filter-btn"><Filter size={16} /> 筛选</button>
          <button className="add-task-btn" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> 新建任务
          </button>
        </div>
      </header>

      {showAdd && (
        <div className="add-modal-overlay">
          <div className="add-modal glass-card">
            <div className="modal-header">
              <h3>添加新任务</h3>
              <button onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <input 
              type="text" 
              placeholder="任务描述..." 
              autoFocus
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <div className="modal-options">
              <div className="option-group">
                <label>分类</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  <option>研究</option>
                  <option>生活</option>
                  <option>学习</option>
                </select>
              </div>
              <div className="option-group">
                <label>优先级</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                  <option>高</option>
                  <option>中</option>
                  <option>低</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="confirm-btn" onClick={handleAddTask}>确认添加</button>
            </div>
          </div>
        </div>
      )}

      <div className="task-stats glass-card">
        <div className="stat-item">
          <span className="stat-val">{tasks.length}</span>
          <span className="stat-lbl">全部任务</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">{tasks.filter(t => t.done).length}</span>
          <span className="stat-lbl">已完成</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">{tasks.filter(t => !t.done).length}</span>
          <span className="stat-lbl">进行中</span>
        </div>
      </div>

      <div className="task-list">
        {tasks.length > 0 ? tasks.map(task => (
          <div key={task.id} className={`task-card glass-card ${task.done ? 'completed' : ''}`}>
            <button className="check-btn" onClick={() => toggleTask(task.id)}>
              {task.done ? <CheckCircle2 size={20} className="checked" /> : <Circle size={20} />}
            </button>
            <div className="task-content">
              <h3>{task.text}</h3>
              <div className="task-meta">
                <span className="category">{task.category}</span>
                <button 
                  className={`priority-tag ${task.priority === '高' ? 'high' : task.priority === '中' ? 'medium' : 'low'}`}
                  onClick={() => cyclePriority(task.id, task.priority)}
                  title="点击切换优先级"
                >
                  {task.priority === '高' ? <AlertCircle size={12} /> : <Clock size={12} />}
                  {task.priority}优先级
                </button>
              </div>
            </div>
            <button className="delete-btn" onClick={() => deleteTask(task.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        )) : (
          <div className="empty-state">目前没有任务，快去创建一个吧！</div>
        )}
      </div>

      <style jsx>{`
        .tasks-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #18181b;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .filter-btn, .add-task-btn {
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .filter-btn {
          background: #ffffff;
          border: 1px solid #e4e4e7;
          color: #71717a;
        }

        .add-task-btn {
          background: #18181b;
          border: none;
          color: white;
        }

        .task-stats {
          display: flex;
          justify-content: space-around;
          padding: 1.5rem;
          margin-bottom: 2rem;
          background: #fafafa;
          border: 1px solid #f4f4f5;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-val {
          font-size: 1.5rem;
          font-weight: 700;
          color: #18181b;
        }

        .stat-lbl {
          font-size: 0.75rem;
          color: #a1a1aa;
          margin-top: 0.25rem;
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .task-card {
          display: flex;
          align-items: center;
          padding: 1rem 1.25rem;
          gap: 1.25rem;
          background: #ffffff;
          border: 1px solid #f4f4f5;
          transition: all 0.2s ease;
        }

        .task-card:hover {
          border-color: #d4d4d8;
        }

        .task-card.completed {
          opacity: 0.5;
        }

        .check-btn {
          background: transparent;
          border: none;
          color: #d4d4d8;
          cursor: pointer;
        }

        .check-btn .checked {
          color: #2563eb;
        }

        .task-content {
          flex: 1;
        }

        .task-content h3 {
          font-size: 0.95rem;
          font-weight: 500;
          margin-bottom: 0.4rem;
          color: #18181b;
        }

        .task-card.completed h3 {
          text-decoration: line-through;
        }

        .task-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .category {
          font-size: 0.7rem;
          color: #71717a;
          background: #f4f4f5;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }

        .priority-tag {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          font-size: 0.7rem;
          font-weight: 600;
          background: none;
          border: none;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .priority-tag:hover {
          background: rgba(0,0,0,0.05);
        }

        .priority-tag.high { color: #ef4444; background: #fee2e2; }
        .priority-tag.medium { color: #f59e0b; background: #fef3c7; }
        .priority-tag.low { color: #6b7280; background: #f3f4f6; }

        .delete-btn {
          background: transparent;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .task-card:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: #ef4444;
        }

        .add-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .add-modal {
          width: 420px;
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .modal-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .modal-header button {
          background: transparent;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
        }

        .add-modal input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
          margin-bottom: 1.25rem;
          outline: none;
        }

        .modal-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .option-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .option-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #71717a;
        }

        .option-group select {
          padding: 0.6rem;
          border-radius: 8px;
          border: 1px solid #e4e4e7;
          outline: none;
          background: #fafafa;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
        }

        .confirm-btn {
          background: #18181b;
          color: white;
          border: none;
          padding: 0.6rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
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
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
};

export default TasksPage;
