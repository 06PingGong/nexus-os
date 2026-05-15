'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
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
  Trees
} from 'lucide-react';

type NoiseType = '雨声' | '森林' | '冥想';

const TasksPage = () => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();
  // 随机任务库
  const randomTaskOptions = [
    '阅读最新AI论文',
    '完成每日代码练习',
    '整理文献笔记',
    '进行30分钟冥想',
    '刷新任务面板',
    '优化视觉布局',
    '更新项目依赖',
    '写一段技术博客'
  ];
  const generateRandomTask = () => {
    const text = randomTaskOptions[Math.floor(Math.random() * randomTaskOptions.length)];
    addTask(text, '研究', '中');
  };
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [timerMode, setTimerMode] = useState<'WORK' | 'BREAK'>('WORK');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusTask, setFocusTask] = useState<any>(null);
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

  // 销毁时停止声音
  useEffect(() => {
    return () => {
      stopNoise();
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="tasks-page">
      <header className="page-header">
        <div className="title-section">
          <h1>任务管理</h1>
          <div className="goal-status">
            <div className="goal-bar">
              <motion.div className="goal-progress" animate={{ width: `${Math.min((pomodoroCount / 8) * 100, 100)}%` }} />
            </div>
            <span>专注进度: {pomodoroCount}/8 番茄钟</span>
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

      <div className="focus-hub glass-card">
        <div className="timer-box">
          <div className="timer-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="bg" />
              <motion.circle 
                cx="50" cy="50" r="45" className="fg" 
                animate={{ pathLength: timeLeft / (timerMode === 'WORK' ? 25*60 : 5*60) }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <div className="timer-text">
              <span className="mode">{timerMode === 'WORK' ? 'FOCUS' : 'REST'}</span>
              <h2>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</h2>
              {focusTask && <p className="target">正在执行: {focusTask.text}</p>}
            </div>
          </div>
          
          <div className="controls">
            <button className="ctrl-btn main" onClick={() => setIsActive(!isActive)}>
              {isActive ? <Pause fill="white" size={28} /> : <Play fill="white" size={28} />}
            </button>
            <button className="ctrl-btn" onClick={() => { setIsActive(false); setTimeLeft(timerMode === 'WORK' ? 25*60 : 5*60); }}>
              <RotateCcw size={20} />
            </button>
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
          </div>
          <div className="task-stats">
            <span>{tasks.filter(task => !task.done).length} 待办</span>
            <span>{tasks.filter(task => task.done).length} 已完成</span>
          </div>
        </div>
        
        <div className="task-grid">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, i) => (
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
                    </div>
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
            <input autoFocus placeholder="你需要完成什么？" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask(newTaskText, '研究', '中')} />
            <div className="modal-btns">
              <button className="cancel" onClick={() => setShowAdd(false)}>取消</button>
              <button className="add" onClick={() => { addTask(newTaskText, '研究', '中'); setShowAdd(false); setNewTaskText(''); }}>创建任务</button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .tasks-page { max-width: 980px; margin: 0 auto; padding: 2rem 0 5rem; color: #111827; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; margin-bottom: 2.5rem; }
        .page-header h1 { font-size: 2.75rem; font-weight: 850; letter-spacing: -2px; }
        .header-actions { display: flex; align-items: center; gap: 0.8rem; }
        .add-task-btn, .random-task-btn { border: 1px solid #e5e7eb; padding: 0.95rem 1.25rem; border-radius: 16px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.65rem; transition: all 0.25s; white-space: nowrap; }
        .add-task-btn { background: #111827; color: #fff; box-shadow: 0 14px 28px rgba(17,24,39,0.14); }
        .random-task-btn { background: #fff; color: #111827; box-shadow: 0 12px 28px rgba(15,23,42,0.05); }
        .add-task-btn:hover, .random-task-btn:hover { transform: translateY(-2px); }
        
        .goal-status { margin-top: 1rem; display: flex; align-items: center; gap: 1.5rem; }
        .goal-status span { color: #64748b; font-size: 0.9rem; font-weight: 700; }
        .goal-bar { width: 160px; height: 8px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
        .goal-progress { height: 100%; background: #111827; }

        .focus-hub { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 3rem; padding: 3rem; margin-bottom: 3rem; background: #fff; border: 1px solid #eef2f7; border-radius: 34px; box-shadow: 0 24px 70px rgba(15,23,42,0.06); }
        .timer-box { display: flex; align-items: center; justify-content: space-between; gap: 2.5rem; min-width: 0; }
        .timer-circle { position: relative; width: 250px; height: 250px; flex: 0 0 auto; }
        .timer-circle svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .timer-circle circle { fill: none; stroke-width: 6; }
        .timer-circle circle.bg { stroke: #f3f4f6; }
        .timer-circle circle.fg { stroke: #111827; stroke-linecap: round; }
        .timer-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.25rem; text-align: center; min-width: 0; }
        .timer-text .mode { font-size: 0.72rem; color: #64748b; font-weight: 900; letter-spacing: 0.18em; }
        .timer-text h2 { margin: 0.4rem 0; font-size: 3.7rem; font-weight: 850; letter-spacing: -3px; }
        .timer-text .target { width: 100%; max-width: 170px; margin: 0.15rem auto 0; color: #64748b; font-size: 0.82rem; font-weight: 700; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
        .controls { display: flex; flex-direction: column; gap: 0.8rem; }
        .ctrl-btn { width: 58px; height: 58px; border: 1px solid #e5e7eb; border-radius: 20px; background: #fff; color: #111827; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 12px 26px rgba(15,23,42,0.06); }
        .ctrl-btn.main { background: #111827; color: #fff; border-color: #111827; }
        .ctrl-btn:hover { transform: translateY(-2px); }

        .noise-panel .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .noise-panel h4 { display: flex; align-items: center; gap: 0.55rem; margin: 0; font-size: 1rem; }
        .noise-note { color: #94a3b8; font-size: 0.72rem; font-weight: 800; }

        .noise-grid { display: grid; gap: 0.8rem; }
        .noise-grid button { border: 1px solid #e5e7eb; background: #fff; padding: 1rem 1.1rem; border-radius: 18px; font-size: 0.96rem; font-weight: 800; color: #475569; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.2s; text-align: left; }
        .noise-grid button.active { border-color: #111827; background: #111827; color: #fff; }
        .noise-grid button:hover { transform: translateY(-1px); }

        .task-container { background: #fff; border: 1px solid #eef2f7; border-radius: 34px; padding: 1.45rem; box-shadow: 0 20px 50px rgba(15,23,42,0.05); }
        .list-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0.75rem 1.4rem; }
        .section-kicker { color: #64748b; font-size: 0.72rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
        .list-header h3 { font-size: 1.75rem; margin-top: 0.25rem; letter-spacing: -1px; }
        .task-stats { display: flex; gap: 0.75rem; }
        .task-stats span { background: #f8fafc; color: #475569; padding: 0.58rem 0.9rem; border-radius: 999px; font-size: 0.82rem; font-weight: 900; border: 1px solid #e5e7eb; }
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
        .meta { display: flex; gap: 0.5rem; margin-top: 0.55rem; }
        .tag, .prio { font-size: 0.72rem; font-weight: 900; border-radius: 999px; padding: 0.34rem 0.72rem; background: #f8fafc; color: #64748b; border: 1px solid #edf2f7; }
        .actions { display: flex; gap: 0.55rem; background: #f8fafc; padding: 0.35rem; border-radius: 18px; border: 1px solid #edf2f7; }
        .actions button { width: 42px; height: 42px; border: none; border-radius: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: transparent; color: #64748b; }
        .focus-trigger:hover { background: #111827; color: #fff; }
        .del:hover { background: #fff; color: #be123c; }
        .actions button:hover { transform: translateY(-1px); }
        @media (max-width: 860px) {
          .page-header, .focus-hub, .timer-box { flex-direction: column; display: flex; }
          .focus-hub { padding: 2rem; }
          .controls { flex-direction: row; }
          .task-card { grid-template-columns: 1fr; }
          .task-index { display: none; }
          .actions { width: fit-content; }
        }
      `}</style>
    </div>
  );
};

export default TasksPage;
