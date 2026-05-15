'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface Task {
  id: number;
  text: string;
  category: string;
  priority: string;
  done: boolean;
}

interface JournalEntry {
  id: number;
  date: string;
  content: string;
  tags: string[];
}

interface AppContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  journalEntries: JournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  addTask: (text: string, category?: string, priority?: string) => Promise<void>;
  updateTask: (id: number, changes: Partial<Omit<Task, 'id'>>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  addJournal: (content: string, tags?: string[]) => Promise<void>;
  deleteJournal: (id: number) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  login: (pwd: string) => boolean;
  isCloudSyncEnabled: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 检查是否配置了真实的 Supabase
  const isSupabaseReady = isSupabaseConfigured;

  const loadCloudData = useCallback(async () => {
    const [{ data: tasksData, error: tasksError }, { data: journalsData, error: journalsError }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('journals').select('*').order('created_at', { ascending: false }),
    ]);

    if (tasksError) console.error('加载云端任务失败:', tasksError.message);
    if (journalsError) console.error('加载云端随记失败:', journalsError.message);
    if (tasksData) setTasks(tasksData);
    if (journalsData) setJournalEntries(journalsData);
  }, []);

  useEffect(() => {
    // 检查本地登录状态
    const auth = localStorage.getItem('nexus_auth');
    if (auth === 'true') setIsAuthenticated(true);
    const loadData = async () => {
      setLoading(true);
      if (isSupabaseReady) {
        // 从 Supabase 加载网络上的最新数据
        await loadCloudData();
      } else {
        // 回退到 LocalStorage
        const savedTasks = localStorage.getItem('nexus_tasks');
        const savedJournal = localStorage.getItem('nexus_journal');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
      }
      setLoading(false);
    };

    loadData();
  }, [isSupabaseReady, loadCloudData]);

  useEffect(() => {
    if (!isSupabaseReady) return;

    const tasksChannel = supabase
      .channel('nexus-tasks-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadCloudData();
      })
      .subscribe();

    const journalsChannel = supabase
      .channel('nexus-journals-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journals' }, () => {
        loadCloudData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(journalsChannel);
    };
  }, [isSupabaseReady, loadCloudData]);

  // 同步到 LocalStorage (作为备份)
  useEffect(() => {
    if (!loading && !isSupabaseReady) {
      localStorage.setItem('nexus_tasks', JSON.stringify(tasks));
      localStorage.setItem('nexus_journal', JSON.stringify(journalEntries));
    }
  }, [tasks, journalEntries, loading, isSupabaseReady]);


  const addJournal = async (content: string, tags = ['随记']) => {
    const now = new Date();
    const dateStr = `今天, ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    
    if (isSupabaseReady) {
      const { data, error } = await supabase
        .from('journals')
        .insert([{ content, date: dateStr, tags }])
        .select();
      if (error) {
        console.error('添加云端随记失败:', error.message);
        return;
      }
      if (data) setJournalEntries(prev => [data[0], ...prev]);
    } else {
      const newEntry = { id: Date.now(), date: dateStr, content, tags };
      setJournalEntries(prev => [newEntry, ...prev]);
    }
  };

  const addTask = async (text: string, category = '研究', priority = '中') => {
    if (!text.trim()) return;
    let task = { id: Date.now(), text, category, priority, done: false };
    if (isSupabaseReady) {
      const { data, error } = await supabase.from('tasks')
        .insert([{ text, category, priority, done: false }])
        .select();
      if (error) {
        console.error('添加云端任务失败:', error.message);
        return;
      }
      if (data && data.length > 0) {
        task.id = data[0].id;
      }
      setTasks(prev => [task, ...prev.filter(item => item.id !== task.id)]);
      return;
    }
    setTasks(prev => {
      const updated = [task, ...prev];
      localStorage.setItem('nexus_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTask = async (id: number, changes: Partial<Omit<Task, 'id'>>) => {
    if (isSupabaseReady) {
      const { error } = await supabase.from('tasks').update(changes).eq('id', id);
      if (error) {
        console.error('更新云端任务失败:', error.message);
        return;
      }
    }

    setTasks(prev => {
      const updated = prev.map(task => task.id === id ? { ...task, ...changes } : task);
      if (!isSupabaseReady) localStorage.setItem('nexus_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTask = async (id: number) => {
    if (isSupabaseReady) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('删除云端任务失败:', error.message);
        return;
      }
    }

    setTasks(prev => {
      const updated = prev.filter(task => task.id !== id);
      if (!isSupabaseReady) localStorage.setItem('nexus_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteJournal = async (id: number) => {
    if (isSupabaseReady) {
      const { error } = await supabase.from('journals').delete().eq('id', id);
      if (error) {
        console.error('删除云端随记失败:', error.message);
        return;
      }
    }

    setJournalEntries(prev => {
      const updated = prev.filter(entry => entry.id !== id);
      if (!isSupabaseReady) localStorage.setItem('nexus_journal', JSON.stringify(updated));
      return updated;
    });
  };

  const login = (pwd: string) => {
    if (pwd === '888888') { // 这里设置您的门禁密码
      setIsAuthenticated(true);
      localStorage.setItem('nexus_auth', 'true');
      return true;
    }
    return false;
  };

  return (
    <AppContext.Provider value={{ 
      tasks, setTasks, 
      journalEntries, setJournalEntries,
      addTask, updateTask, deleteTask,
      addJournal, deleteJournal,
      loading,
      isAuthenticated,
      login,
      isCloudSyncEnabled: isSupabaseReady
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
