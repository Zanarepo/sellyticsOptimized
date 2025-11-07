import { supabase } from '../../supabaseClient';
import { auditWrite } from './auditWrite';

export const db = {
  insert: async (table, values) =>
    auditWrite(() =>
      supabase.from(table).insert(values)
    ),

  update: async (table, values, filter) =>
    auditWrite(() =>
      supabase.from(table).update(values).match(filter)
    ),

  delete: async (table, filter) =>
    auditWrite(() =>
      supabase.from(table).delete().match(filter)
    ),
};
