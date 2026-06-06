import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase 환경 변수가 정의되지 않았습니다. (.env 파일에 VITE_SUPABASE_URL 및 VITE_SUPABASE_ANON_KEY를 추가해 주세요.) 로컬 목업 데이터 모드로 작동합니다.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
