import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'your_anon_key_here' &&
  supabaseAnonKey !== 'placeholder'
);

// 安全初始化：如果缺少凭据，使用占位符防止应用崩溃
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder';

if (!isSupabaseConfigured) {
  console.warn('Supabase 配置缺失或使用了占位符。系统将自动切换到本地存储 (LocalStorage) 模式。');
}

export const supabase = createClient(safeUrl, safeKey);
