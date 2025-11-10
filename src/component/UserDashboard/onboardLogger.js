// src/utils/onboardLogger.js
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

/**
 * Logs an onboarding action to the `onboard_logs` table.
 * Only logs if `adminId` is provided (i.e., admin is onboarding).
 */
export const logOnboardAction = async ({
  adminId,
  storeId,
  productId,
  activityType,
  details = {},
}) => {
  if (!adminId) return; // Only log when admin is acting

  const { error } = await supabase.from('onboard_logs').insert({
    admin_id: adminId,
    store_id: storeId,
    product_id: productId || null,
    activity_type: activityType,
    details: details,
  });

  if (error) {
    console.error('Failed to log onboard action:', error);
    // Don't block the main action — just warn
    toast.warn('Action completed, but failed to log history.');
  }
};

/**
 * Checks if the current admin is allowed to edit/delete.
 * Returns `true` if allowed, `false` if blocked.
 * Only applies restrictions if `adminId` is provided (admin context).
 */
export const canEditOrDelete = ({ adminId, adminRole }) => {
  if (!adminId) return true; // Regular store owner → full access

  if (adminRole === 'superadmin') return true;

  toast.error('Only superadmins can edit or delete products during onboarding.');
  return false;
};