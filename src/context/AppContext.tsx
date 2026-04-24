'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  addJournal: (content: string, tags?: string[]) => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 检查是否配置了真实的 Supabase
  const isSupabaseReady = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_anon_key_here';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (isSupabaseReady) {
        // 从 Supabase 加载
        const { data: tasksData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        const { data: journalsData } = await supabase.from('journals').select('*').order('created_at', { ascending: false });
        if (tasksData) setTasks(tasksData);
        if (journalsData) setJournalEntries(journalsData);
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
  }, [isSupabaseReady]);

  // 同步到 LocalStorage (作为备份)
  useEffect(() => {
    if (!loading && !isSupabaseReady) {
      localStorage.setItem('nexus_tasks', JSON.stringify(tasks));
      localStorage.setItem('nexus_journal', JSON.stringify(journalEntries));
    }
  }, [tasks, journalEntries, loading, isSupabaseReady]);

  const addTask = async (text: string, category = '研究', priority = '中') => {
    if (isSupabaseReady) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ text, category, priority, done: false }])
        .select();
      if (data) setTasks(prev => [data[0], ...prev]);
    } else {
      const newTask = { id: Date.now(), text, category, priority, done: false };
      setTasks(prev => [newTask, ...prev]);
    }
  };

  const addJournal = async (content: string, tags = ['随记']) => {
    const now = new Date();
    const dateStr = `今天, ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    
    if (isSupabaseReady) {
      const { data } = await supabase
        .from('journals')
        .insert([{ content, date: dateStr, tags }])
        .select();
      if (data) setJournalEntries(prev => [data[0], ...prev]);
    } else {
      const newEntry = { id: Date.now(), date: dateStr, content, tags };
      setJournalEntries(prev => [newEntry, ...prev]);
    }
  };

  return (
    <AppContext.Provider value={{ 
      tasks, setTasks, 
      journalEntries, setJournalEntries,
      addTask, addJournal,
      loading
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
