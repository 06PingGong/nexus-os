'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, useApp } from '@/context/AppContext';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  RefreshCcw,
  Play,
  Pause,
  RotateCcw,
  Target,
  Volume2,
  Wind,
  CloudRain,
  Trees,
  Search,
  Sparkles,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

type NoiseType = '雨声' | '森林' | '冥想';
type TaskFilter = '全部' | '待办' | '已完成' | '高优先级';
type SortMode = '最新' | '优先级' | '状态' | '截止时间';
type TaskView = '全部' | 'today' | 'week' | 'later' | 'backlog';

const QUICK_TEMPLATES = [
  { text: '精读 1 篇顶刊论文', category: '论文', priority: '高' },
  { text: '完成 25 分钟深度工作', category: '时间', priority: '高' },
  { text: '整理今天的阅读卡片', category: '写作', priority: '中' },
  { text: '规划明天的研究任务', category: '规划', priority: '中' },
];

const randomTaskOptions = [
  '阅读最新AI论文',
  '完成每日代码练习',
  '整理文献笔记',
  '进行30分钟冥想',
  '刷新任务面板',
  '优化视觉布局',
  '更新项目依赖',
  '写一段技术博客',
];

const TasksPage = () => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('研究');
  const [newTaskPriority, setNewTaskPriority] = useState('中');
  const [newTaskView, setNewTaskView] = useState<Task['view']>('today');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskLinkedPaper, setNewTaskLinkedPaper] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState('25');
  const [newTaskSubtasks, setNewTaskSubtasks] = useState('');
  const [query, setQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('全部');
  const [taskView, setTaskView] = useState<TaskView>('全部');
  const [sortMode, setSortMode] = useState<SortMode>('最新');
  const [timerMode, setTimerMode] = useState<'WORK' | 'BREAK'>('WORK');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [currentNoise, setCurrentNoise] = useState<NoiseType | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodesRef = useRef<Array<AudioNode>>([]);

  useEffect(() => {
    loadTodayFocus();
  }, []);

  const loadTodayFocus = async () => {
    if (!isSupabaseConfigured) return;
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data, error } = await supabase.from('focus_sessions').select('minutes').gte('created_at', since.toISOString());
    if (error) {
      console.error('加载专注统计失败:', error.message);
      return;
    }
    setTodayFocusMinutes((data || []).reduce((sum, item) => sum + Number(item.minutes || 0), 0));
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      handleComplete();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    if (timerMode === 'WORK') {
      setPomodoroCount(prev => prev + 1);
      setTodayFocusMinutes(prev => prev + 25);
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('focus_sessions').insert([{ task_id: focusTask?.id || null, task_text: focusTask?.text || '自由专注', minutes: 25, mode: 'WORK' }]);
        if (error) console.error('保存专注会话失败:', error.message);
      }
      setTimerMode('BREAK');
      setTimeLeft(5 * 60);
    } else {
      setTimerMode('WORK');
      setTimeLeft(25 * 60);
    }
  };

  const stopNoise = () => {
    noiseNodesRef.current.forEach(node => {
      try {
        if ('stop' in node) (node as AudioBufferSourceNode | OscillatorNode).stop();
        node.disconnect();
      } catch {}
    });
    noiseNodesRef.current = [];
  };

  const createNoiseBuffer = (context: AudioContext, tone: NoiseType) => {
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (tone === '森林') {
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      } else if (tone === '冥想') {
        data[i] = white * 0.08;
      } else {
        data[i] = white * 0.35;
      }
    }
    return buffer;
  };

  const playNoise = async (type: NoiseType) => {
    if (currentNoise === type) {
      stopNoise();
      setCurrentNoise(null);
      return;
    }

    try {
      stopNoise();
      const context = audioContextRef.current || new AudioContext();
      audioContextRef.current = context;
      if (context.state === 'suspended') await context.resume();

      const source = context.createBufferSource();
      source.buffer = createNoiseBuffer(context, type);
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = type === '雨声' ? 'highpass' : 'lowpass';
      filter.frequency.value = type === '雨声' ? 900 : type === '森林' ? 420 : 260;
      const gain = context.createGain();
      gain.gain.value = type === '冥想' ? 0.08 : 0.16;
      source.connect(filter);
      filter.connect(gain);

      if (type === '冥想') {
        const oscillator = context.createOscillator();
        const toneGain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 174;
        toneGain.gain.value = 0.025;
        oscillator.connect(toneGain);
        toneGain.connect(context.destination);
        oscillator.start();
        noiseNodesRef.current.push(oscillator, toneGain);
      }

      gain.connect(context.destination);
      source.start();
      noiseNodesRef.current.push(source, filter, gain);
      setCurrentNoise(type);
    } catch (error) {
      console.error('Noise engine failed:', error);
      setCurrentNoise(null);
    }
  };

  useEffect(() => {
    return () => {
      stopNoise();
      audioContextRef.current?.close();
    };
  }, []);

  const generateRandomTask = () => {
    const text = randomTaskOptions[Math.floor(Math.random() * randomTaskOptions.length)];
    addTask(text, '研究', '中', { view: 'today', estimatedMinutes: 25 });
  };

  const taskViewMeta: Record<TaskView, { label: string; desc: string }> = {
    全部: { label: '全部任务', desc: '查看当前所有工作项' },
    today: { label: 'Today', desc: '今天必须推进的关键任务' },
    week: { label: 'This Week', desc: '本周内要完成的研究推进' },
    later: { label: 'Later', desc: '稍后处理但已进入排程' },
    backlog: { label: 'Backlog', desc: '灵感、储备与未来计划' },
  };

  const getSubtaskStats = (task: Task) => {
    const total = task.subtasks?.length || 0;
    const completed = task.subtasks?.filter(item => item.done).length || 0;
    return { total, completed };
  };

  const isOverdue = (task: Task) => Boolean(task.dueDate && !task.done && new Date(task.dueDate).getTime() < new Date(new Date().toDateString()).getTime());

  const sortedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      if (taskView !== '全部' && (task.view || 'today') !== taskView) return false;
      if (query && !`${task.text} ${task.category} ${task.priority} ${task.notes || ''} ${task.linkedPaperTitle || ''}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (taskFilter === '待办') return !task.done;
      if (taskFilter === '已完成') return task.done;
      if (taskFilter === '高优先级') return task.priority === '高';
      return true;
    });

    const priorityOrder: Record<string, number> = { 高: 0, 中: 1, 低: 2 };
    return [...filtered].sort((a, b) => {
      if (sortMode === '截止时间') {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime || b.id - a.id;
      }
      if (sortMode === '优先级') return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) || b.id - a.id;
      if (sortMode === '状态') return Number(a.done) - Number(b.done) || b.id - a.id;
      return b.id - a.id;
    });
  }, [tasks, query, taskFilter, sortMode, taskView]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.done).length;
    const pending = total - completed;
    const high = tasks.filter(task => task.priority === '高' && !task.done).length;
    return {
      total,
      completed,
      pending,
      high,
      completion: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  const submitQuickTask = async (text: string, category = '研究', priority = '中') => {
    if (!text.trim()) return;
    await addTask(text, category, priority, { view: 'today', estimatedMinutes: priority === '高' ? 45 : 25 });
  };

  const handleModalSubmit = async () => {
    if (!newTaskText.trim()) return;
    await addTask(newTaskText, newTaskCategory, newTaskPriority, {
      view: newTaskView,
      dueDate: newTaskDueDate || undefined,
      notes: newTaskNotes,
      linkedPaperTitle: newTaskLinkedPaper || undefined,
      estimatedMinutes: Number(newTaskEstimate) || undefined,
      subtasks: newTaskSubtasks
        .split(/\n+/)
        .map(item => item.trim())
        .filter(Boolean)
        .map((item, index) => ({ id: Date.now() + index, text: item, done: false })),
    });
    setNewTaskText('');
    setNewTaskCategory('研究');
    setNewTaskPriority('中');
    setNewTaskView('today');
    setNewTaskDueDate('');
    setNewTaskNotes('');
    setNewTaskLinkedPaper('');
    setNewTaskEstimate('25');
    setNewTaskSubtasks('');
    setShowAdd(false);
  };

  return (
    <div className="tasks-page">
      <header className="page-header">
        <div className="title-section">
          <span className="eyebrow">Task · Time · Focus</span>
          <h1>任务管理</h1>
          <p className="subtitle">像成熟效率工具一样，把任务、专注和节奏控制放进同一个工作台。</p>
          <div className="goal-status">
            <div className="goal-bar">
              <motion.div className="goal-progress" animate={{ width: `${Math.min((pomodoroCount / 8) * 100, 100)}%` }} />
            </div>
            <span>专注进度: {pomodoroCount}/8</span>
            <span>今日云端专注: {todayFocusMinutes} 分钟</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="add-task-btn" onClick={() => setShowAdd(true)}>
            <Plus size={20} /> 新建任务
          </button>
          <button className="random-task-btn" onClick={generateRandomTask}>
            <RefreshCcw size={20} /> 随机任务
          </button>
        </div>
      </header>

      <section className="metrics-row">
        <div className="metric glass-card">
          <span>总任务</span>
          <strong>{stats.total}</strong>
          <small>当前工作池</small>
        </div>
        <div className="metric glass-card">
          <span>待完成</span>
          <strong>{stats.pending}</strong>
          <small>优先推进中</small>
        </div>
        <div className="metric glass-card highlight">
          <span>完成率</span>
          <strong>{stats.completion}%</strong>
          <small>今天的推进程度</small>
        </div>
        <div className="metric glass-card warm">
          <span>高优先级</span>
          <strong>{stats.high}</strong>
          <small>需要深度专注</small>
        </div>
      </section>

      <section className="quick-panel glass-card">
        <div className="quick-head">
          <div>
            <span className="section-kicker">Quick Capture</span>
            <h3>常用动作</h3>
          </div>
          <button className="ghost-btn" onClick={() => setShowAdd(true)}>
            <ArrowUpRight size={16} /> 自定义录入
          </button>
        </div>
        <div className="quick-grid">
          {QUICK_TEMPLATES.map(item => (
            <button key={item.text} className="quick-chip" onClick={() => submitQuickTask(item.text, item.category, item.priority)}>
              <span>{item.category}</span>
              <strong>{item.text}</strong>
              <small>{item.priority}优先级</small>
            </button>
          ))}
        </div>
      </section>

      <div className="focus-hub glass-card">
        <div className="timer-box">
          <div className="timer-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="bg" />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                className="fg"
                animate={{ pathLength: timeLeft / (timerMode === 'WORK' ? 25 * 60 : 5 * 60) }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </svg>
            <div className="timer-text">
              <span className="mode">{timerMode === 'WORK' ? 'FOCUS' : 'REST'}</span>
              <h2>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</h2>
              {focusTask && <p className="target">正在执行: {focusTask.text}</p>}
            </div>
          </div>

          <div className="focus-side">
            <div className="focus-card">
              <span className="section-kicker">当前焦点</span>
              <h3>{focusTask?.text || '还没有指定专注任务'}</h3>
              <p>{focusTask ? '建议先完成这一项，再切换上下文。' : '从任务列表点一下靶心图标，立即进入单任务模式。'}</p>
            </div>
            <div className="controls">
              <button className="ctrl-btn main" onClick={() => setIsActive(!isActive)}>
                {isActive ? <Pause fill="white" size={28} /> : <Play fill="white" size={28} />}
              </button>
              <button className="ctrl-btn" onClick={() => { setIsActive(false); setTimeLeft(timerMode === 'WORK' ? 25 * 60 : 5 * 60); }}>
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="noise-panel">
          <div className="panel-head">
            <h4><Volume2 size={18} /> 专注音效</h4>
            <span className="noise-note">本地生成 · 不依赖外链</span>
          </div>

          <div className="noise-grid">
            <button className={currentNoise === '雨声' ? 'active' : ''} onClick={() => playNoise('雨声')}>
              <CloudRain size={20} /> 舒适雨声
            </button>
            <button className={currentNoise === '森林' ? 'active' : ''} onClick={() => playNoise('森林')}>
              <Trees size={20} /> 森林环境
            </button>
            <button className={currentNoise === '冥想' ? 'active' : ''} onClick={() => playNoise('冥想')}>
              <Wind size={20} /> 空灵冥想
            </button>
          </div>
        </div>
      </div>

      <div className="task-container">
        <div className="list-header">
          <div>
            <span className="section-kicker">Cloud Task Board</span>
            <h3>我的任务列表</h3>
            <p className="list-desc">{taskViewMeta[taskView].desc}</p>
          </div>
          <div className="task-tools">
            <div className="task-search-wrap">
              <Search size={18} />
              <input className="task-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索任务、分类、备注或关联论文" />
            </div>
            <div className="view-row">
              {(['全部', 'today', 'week', 'later', 'backlog'] as const).map(item => (
                <button key={item} className={taskView === item ? 'active' : ''} onClick={() => setTaskView(item)}>{taskViewMeta[item].label}</button>
              ))}
            </div>
            <div className="filter-row">
              {(['全部', '待办', '已完成', '高优先级'] as const).map(item => (
                <button key={item} className={taskFilter === item ? 'active' : ''} onClick={() => setTaskFilter(item)}>{item}</button>
              ))}
            </div>
            <div className="sort-row">
              {(['最新', '优先级', '状态', '截止时间'] as const).map(item => (
                <button key={item} className={sortMode === item ? 'active' : ''} onClick={() => setSortMode(item)}>{item}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="board-tip">
          <Sparkles size={16} /> 优先把高优先级待办设为专注任务，再启动计时器，体验会更接近专业任务管理与时间管理工具。
        </div>

        <div className="task-grid">
          <AnimatePresence mode="popLayout">
            {sortedTasks.map((task, i) => (
              <motion.div key={task.id} className={`task-card glass-card ${task.done ? 'done' : ''} ${focusTask?.id === task.id ? 'active' : ''}`} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.025, 0.2) }}>
                <div className="task-index">{String(i + 1).padStart(2, '0')}</div>
                <div className="task-main">
                  <button className="check" onClick={() => updateTask(task.id, { done: !task.done })}>
                    {task.done ? <CheckCircle2 size={26} className="checked" /> : <Circle size={26} />}
                  </button>
                  <div className="content">
                    <h4 onClick={() => setFocusTask(task)}>{task.text}</h4>
                    <div className="meta">
                      <span className="tag">{task.category}</span>
                      <span className={`prio ${task.priority}`}>{task.priority}级</span>
                      <span className="tag subtle">{taskViewMeta[task.view || 'today'].label}</span>
                      {task.estimatedMinutes ? <span className="tag subtle">{task.estimatedMinutes} 分钟</span> : null}
                      {task.dueDate ? <span className={`tag due ${isOverdue(task) ? 'overdue' : ''}`}>{isOverdue(task) ? '已逾期' : `截止 ${task.dueDate}`}</span> : null}
                      {!task.done && task.priority === '高' && <span className="energy"><Flame size={13} /> 需要专注</span>}
                    </div>
                    {(task.notes || task.linkedPaperTitle || (task.subtasks?.length || 0) > 0) && (
                      <div className="task-extended">
                        {task.linkedPaperTitle ? <p className="linked-paper">关联论文：{task.linkedPaperTitle}</p> : null}
                        {task.notes ? <p className="task-note">{task.notes}</p> : null}
                        {(task.subtasks?.length || 0) > 0 ? (
                          <div className="subtask-block">
                            <span>子任务 {getSubtaskStats(task).completed}/{getSubtaskStats(task).total}</span>
                            <ul>
                              {task.subtasks?.slice(0, 3).map(subtask => <li key={subtask.id} className={subtask.done ? 'done' : ''}>{subtask.text}</li>)}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                <div className="actions">
                  {!task.done && <button className="focus-trigger" onClick={() => setFocusTask(task)}><Target size={20} /></button>}
                  <button className="del" onClick={() => deleteTask(task.id)}><Trash2 size={20} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {showAdd && (
        <div className="modal-mask" onClick={() => setShowAdd(false)}>
          <motion.div className="modal-content glass-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <h3>创建新任务</h3>
            <input autoFocus placeholder="你需要完成什么？" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleModalSubmit()} />
            <div className="modal-grid two">
              <label><span>分类</span><input value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value)} placeholder="如：论文 / 实验 / 写作" /></label>
              <label><span>优先级</span><select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}>{['高', '中', '低'].map(item => <option key={item}>{item}</option>)}</select></label>
              <label><span>视图</span><select value={newTaskView} onChange={e => setNewTaskView(e.target.value as Task['view'])}>{(['today', 'week', 'later', 'backlog'] as const).map(item => <option key={item} value={item}>{taskViewMeta[item].label}</option>)}</select></label>
              <label><span>预估时长</span><input value={newTaskEstimate} onChange={e => setNewTaskEstimate(e.target.value)} placeholder="25" /></label>
              <label><span>截止日期</span><input type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} /></label>
              <label><span>关联论文</span><input value={newTaskLinkedPaper} onChange={e => setNewTaskLinkedPaper(e.target.value)} placeholder="论文标题" /></label>
            </div>
            <div className="modal-grid">
              <label><span>备注</span><textarea value={newTaskNotes} onChange={e => setNewTaskNotes(e.target.value)} placeholder="写下执行提示、实验思路、阻塞点..." /></label>
              <label><span>子任务</span><textarea value={newTaskSubtasks} onChange={e => setNewTaskSubtasks(e.target.value)} placeholder="每行一个子任务，例如：\n读摘要\n看方法图\n记录问题" /></label>
            </div>
            <div className="modal-btns">
              <button className="cancel" onClick={() => setShowAdd(false)}>取消</button>
              <button className="add" onClick={handleModalSubmit}>创建任务</button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .tasks-page { max-width: 1180px; margin: 0 auto; padding: 2rem 0 5rem; color: #111827; }
        .eyebrow, .section-kicker { color: #64748b; font-size: 0.72rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; margin-bottom: 1.5rem; }
        .page-header h1 { font-size: 3rem; font-weight: 850; letter-spacing: -2px; margin-top: 0.35rem; }
        .subtitle { margin-top: 0.55rem; color: #64748b; font-size: 1rem; font-weight: 700; max-width: 640px; }
        .header-actions { display: flex; align-items: center; gap: 0.8rem; }
        .add-task-btn, .random-task-btn, .ghost-btn { border: 1px solid #e5e7eb; padding: 0.95rem 1.25rem; border-radius: 16px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.65rem; transition: all 0.25s; white-space: nowrap; }
        .add-task-btn { background: #111827; color: #fff; box-shadow: 0 14px 28px rgba(17,24,39,0.14); }
        .random-task-btn, .ghost-btn { background: #fff; color: #111827; box-shadow: 0 12px 28px rgba(15,23,42,0.05); }
        .add-task-btn:hover, .random-task-btn:hover, .ghost-btn:hover { transform: translateY(-2px); }
        .goal-status { margin-top: 1rem; display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
        .goal-status span { color: #64748b; font-size: 0.9rem; font-weight: 700; }
        .goal-bar { width: 160px; height: 8px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
        .goal-progress { height: 100%; background: linear-gradient(90deg, #111827, #2563eb); }
        .metrics-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .metric { padding: 1.2rem 1.25rem; border-radius: 24px; background: #fff; border: 1px solid #eef2f7; }
        .metric span { color: #64748b; font-size: 0.78rem; font-weight: 900; }
        .metric strong { display: block; margin-top: 0.35rem; font-size: 2rem; letter-spacing: -1px; }
        .metric small { display: block; margin-top: 0.25rem; color: #94a3b8; font-weight: 800; }
        .metric.highlight { background: linear-gradient(135deg, #eff6ff, #ffffff); }
        .metric.warm { background: linear-gradient(135deg, #fff7ed, #ffffff); }
        .quick-panel { padding: 1.35rem; margin-bottom: 1rem; background: #fff; border: 1px solid #eef2f7; border-radius: 30px; box-shadow: 0 18px 45px rgba(15,23,42,0.05); }
        .quick-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
        .quick-head h3 { font-size: 1.35rem; margin-top: 0.25rem; }
        .quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.8rem; }
        .quick-chip { text-align: left; border: 1px solid #e5e7eb; background: linear-gradient(180deg, #fff, #f8fafc); border-radius: 22px; padding: 1rem; cursor: pointer; transition: all 0.25s; }
        .quick-chip:hover { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(15,23,42,0.08); }
        .quick-chip span { color: #2563eb; font-size: 0.72rem; font-weight: 900; }
        .quick-chip strong { display: block; margin: 0.35rem 0 0.5rem; line-height: 1.5; }
        .quick-chip small { color: #64748b; font-weight: 800; }
        .focus-hub { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 2rem; padding: 2rem; margin-bottom: 1rem; background: #fff; border: 1px solid #eef2f7; border-radius: 34px; box-shadow: 0 24px 70px rgba(15,23,42,0.06); }
        .timer-box { display: flex; align-items: center; justify-content: space-between; gap: 2rem; min-width: 0; }
        .timer-circle { position: relative; width: 250px; height: 250px; flex: 0 0 auto; }
        .timer-circle svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .timer-circle circle { fill: none; stroke-width: 6; }
        .timer-circle circle.bg { stroke: #f3f4f6; }
        .timer-circle circle.fg { stroke: #111827; stroke-linecap: round; }
        .timer-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.25rem; text-align: center; min-width: 0; }
        .timer-text .mode { font-size: 0.72rem; color: #64748b; font-weight: 900; letter-spacing: 0.18em; }
        .timer-text h2 { margin: 0.4rem 0; font-size: 3.7rem; font-weight: 850; letter-spacing: -3px; }
        .timer-text .target { width: 100%; max-width: 170px; margin: 0.15rem auto 0; color: #64748b; font-size: 0.82rem; font-weight: 700; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
        .focus-side { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
        .focus-card { padding: 1.1rem 1.15rem; border-radius: 22px; background: #f8fafc; border: 1px solid #e5e7eb; }
        .focus-card h3 { font-size: 1.15rem; margin: 0.4rem 0 0.45rem; line-height: 1.5; }
        .focus-card p { color: #64748b; line-height: 1.65; font-size: 0.92rem; }
        .controls { display: flex; gap: 0.8rem; }
        .ctrl-btn { min-width: 58px; height: 58px; border: 1px solid #e5e7eb; border-radius: 20px; background: #fff; color: #111827; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 12px 26px rgba(15,23,42,0.06); padding: 0 1rem; font-weight: 800; }
        .ctrl-btn.main { background: #111827; color: #fff; border-color: #111827; }
        .ctrl-btn:hover { transform: translateY(-2px); }
        .noise-panel .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .noise-panel h4 { display: flex; align-items: center; gap: 0.55rem; margin: 0; font-size: 1rem; }
        .noise-note { color: #94a3b8; font-size: 0.72rem; font-weight: 800; }
        .noise-grid { display: grid; gap: 0.8rem; }
        .noise-grid button { border: 1px solid #e5e7eb; background: #fff; padding: 1rem 1.1rem; border-radius: 18px; font-size: 0.96rem; font-weight: 800; color: #475569; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.2s; text-align: left; }
        .noise-grid button.active { border-color: #111827; background: #111827; color: #fff; }
        .noise-grid button:hover { transform: translateY(-1px); }
        .task-container { background: #fff; border: 1px solid #eef2f7; border-radius: 34px; padding: 1.45rem; box-shadow: 0 20px 50px rgba(15,23,42,0.05); }
        .list-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 0.4rem 0.4rem 1rem; }
        .list-header h3 { font-size: 1.75rem; margin-top: 0.25rem; letter-spacing: -1px; }
        .list-desc { margin-top: 0.35rem; color: #64748b; font-weight: 700; }
        .task-tools { display: grid; gap: 0.7rem; width: min(520px, 100%); }
        .task-search-wrap { display: flex; align-items: center; gap: 0.7rem; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 16px; padding: 0 0.9rem; }
        .task-search { width: 100%; height: 46px; border: none; outline: none; background: transparent; font-weight: 700; }
        .view-row, .filter-row, .sort-row { display: flex; flex-wrap: wrap; gap: 0.55rem; }
        .view-row button, .filter-row button, .sort-row button { border: 1px solid #e5e7eb; background: #f8fafc; color: #64748b; border-radius: 999px; padding: 0.52rem 0.85rem; font-weight: 900; cursor: pointer; }
        .view-row button.active, .filter-row button.active, .sort-row button.active { background: #111827; color: #fff; border-color: #111827; }
        .board-tip { display: flex; align-items: center; gap: 0.5rem; margin: 0 0.4rem 1rem; padding: 0.85rem 1rem; border-radius: 16px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 0.84rem; font-weight: 800; }
        .task-grid { display: grid; gap: 1rem; }
        .task-card { position: relative; display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; gap: 1.15rem; align-items: center; padding: 1.45rem 1.55rem; border-radius: 26px; transition: all 0.3s; background: #fff; border: 1px solid #edf2f7; box-shadow: 0 8px 24px rgba(15,23,42,0.035); }
        .task-card:hover { transform: translateY(-2px); border-color: #cbd5e1; box-shadow: 0 16px 34px rgba(15,23,42,0.07); }
        .task-card.active { border-color: #111827; box-shadow: 0 16px 36px rgba(17,24,39,0.12); }
        .task-card.done { opacity: 0.62; }
        .task-card.done h4 { text-decoration: line-through; color: #94a3b8; }
        .task-index { width: 38px; height: 38px; border-radius: 14px; background: #f8fafc; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.82rem; border: 1px solid #edf2f7; }
        .task-main { display: flex; align-items: center; gap: 1.05rem; min-width: 0; }
        .check { border: none; background: transparent; color: #94a3b8; cursor: pointer; padding: 0; display: flex; }
        .checked { color: #111827; }
        .content { min-width: 0; }
        .content h4 { margin: 0; font-size: 1.08rem; line-height: 1.45; cursor: pointer; color: #111827; overflow-wrap: anywhere; }
        .meta { display: flex; gap: 0.5rem; margin-top: 0.55rem; flex-wrap: wrap; }
        .tag, .prio, .energy { font-size: 0.72rem; font-weight: 900; border-radius: 999px; padding: 0.34rem 0.72rem; background: #f8fafc; color: #64748b; border: 1px solid #edf2f7; display: inline-flex; align-items: center; gap: 0.3rem; }
        .tag.subtle { background: #f1f5f9; }
        .tag.due { background: #eff6ff; color: #1d4ed8; }
        .tag.due.overdue { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
        .energy { color: #b45309; background: #fff7ed; border-color: #fed7aa; }
        .task-extended { display: grid; gap: 0.45rem; margin-top: 0.8rem; }
        .linked-paper, .task-note { color: #475569; line-height: 1.55; }
        .subtask-block { padding: 0.75rem 0.85rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e5e7eb; }
        .subtask-block span { display: block; color: #64748b; font-size: 0.76rem; font-weight: 900; margin-bottom: 0.45rem; }
        .subtask-block ul { margin: 0; padding-left: 1rem; color: #334155; display: grid; gap: 0.3rem; }
        .subtask-block li.done { text-decoration: line-through; color: #94a3b8; }
        .actions { display: flex; gap: 0.55rem; background: #f8fafc; padding: 0.35rem; border-radius: 18px; border: 1px solid #edf2f7; }
        .actions button { width: 42px; height: 42px; border: none; border-radius: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: transparent; color: #64748b; }
        .focus-trigger:hover { background: #111827; color: #fff; }
        .del:hover { background: #fff; color: #be123c; }
        .actions button:hover { transform: translateY(-1px); }
        .modal-mask { position: fixed; inset: 0; background: rgba(15,23,42,0.35); display: grid; place-items: center; z-index: 50; }
        .modal-content { width: min(480px, 92vw); padding: 1.5rem; background: #fff; border-radius: 28px; }
        .modal-content h3 { font-size: 1.35rem; margin-bottom: 1rem; }
        .modal-content input, .modal-content select, .modal-content textarea { width: 100%; border: 1px solid #e5e7eb; border-radius: 16px; padding: 0 1rem; font-size: 1rem; font-weight: 700; outline: none; background: #fff; }
        .modal-content input, .modal-content select { height: 52px; }
        .modal-content textarea { min-height: 92px; padding: 0.85rem 1rem; resize: vertical; }
        .modal-content input:focus, .modal-content select:focus, .modal-content textarea:focus { border-color: #111827; }
        .modal-grid { display: grid; gap: 0.8rem; margin-top: 0.9rem; }
        .modal-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .modal-grid label { display: grid; gap: 0.45rem; }
        .modal-grid span { color: #64748b; font-size: 0.78rem; font-weight: 900; }
        .modal-btns { display: flex; justify-content: flex-end; gap: 0.7rem; margin-top: 1rem; }
        .modal-btns button { border: none; border-radius: 14px; padding: 0.85rem 1rem; font-weight: 900; cursor: pointer; }
        .modal-btns .cancel { background: #f1f5f9; color: #475569; }
        .modal-btns .add { background: #111827; color: #fff; }
        @media (max-width: 1100px) {
          .metrics-row, .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .focus-hub { grid-template-columns: 1fr; }
        }
        @media (max-width: 860px) {
          .page-header, .list-header, .timer-box { flex-direction: column; display: flex; }
          .header-actions, .task-tools { width: 100%; }
          .task-card { grid-template-columns: 1fr; }
          .task-index { display: none; }
          .actions { width: fit-content; }
          .metrics-row, .quick-grid { grid-template-columns: 1fr; }
          .controls { width: 100%; }
          .modal-grid.two { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default TasksPage;
