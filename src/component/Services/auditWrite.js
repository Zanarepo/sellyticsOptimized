import { supabase } from '../../supabaseClient';

export async function auditWrite(callback) {
  await supabase.rpc('set_performer', {
    p_store_id: Number(localStorage.getItem('store_id')),
    p_user_id: Number(localStorage.getItem('user_id')),
  });

  return await callback();
}
