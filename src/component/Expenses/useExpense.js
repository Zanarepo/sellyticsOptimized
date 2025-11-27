// src/components/Expenses/useExpense.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

export function useExpense(storeId) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: useCallback so dependency warning goes away
  const fetchExpenses = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expense_tracker')
        .select('*')
        .eq('store_id', storeId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      toast.error('Failed to load expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [storeId]); // only changes when storeId changes

  const addExpense = async (expenseData) => {
    try {
      const { data, error } = await supabase
        .from('expense_tracker')
        .insert([{ ...expenseData, store_id: storeId }])
        .select()
        .single();

      if (error) throw error;
      setExpenses(prev => [data, ...prev]);
      toast.success('Expense added successfully!');
      return data;
    } catch (err) {
      toast.error('Failed to add expense');
      throw err;
    }
  };

  const updateExpense = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('expense_tracker')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setExpenses(prev => prev.map(e => e.id === id ? data : e));
      toast.success('Expense updated!');
      return data;
    } catch (err) {
      toast.error('Failed to update expense');
      throw err;
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense permanently?')) return;
    try {
      const { error } = await supabase.from('expense_tracker').delete().eq('id', id);
      if (error) throw error;
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Expense deleted');
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  // NOW SAFE — no warnings, no loops
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
