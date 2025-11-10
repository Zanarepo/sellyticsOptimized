// src/utils/adminAuth.js

/**
 * Checks if current user is admin using localStorage
 * Returns { isAdmin: boolean, adminId: string|null, email: string|null }
 */
export const getAdminStatus = () => {
    const adminId = localStorage.getItem('admin_id');
    const userEmail = localStorage.getItem('user_email');
  
    const isAdmin = !!adminId && !!userEmail;
  
    return {
      isAdmin,
      adminId,
      email: userEmail,
    };
  };
  
  /**
   * Clear admin session
   */
  export const clearAdminSession = () => {
    localStorage.removeItem('admin_id');
    localStorage.removeItem('user_email');
    // Keep store/owner if needed elsewhere
  };