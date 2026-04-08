// All data access goes through Supabase directly.
// This file only provides a helper to call Supabase Edge Functions.
import { supabase } from '@/lib/supabase';

export async function invokeFunction<T = any>(name: string, body?: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw { response: { data: { message: error.message } } };
  return data as T;
}
