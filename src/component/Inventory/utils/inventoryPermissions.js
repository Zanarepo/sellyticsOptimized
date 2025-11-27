/**
 * Inventory permissions based on store_users.role
 * Roles: 'owner', 'manager', 'staff'
 */

/**
 * Can the user adjust stock levels (increase/decrease)?
 * @param {object} user - current logged-in user
 * @returns {boolean}
 */
export function canAdjustStock(user) {
    if (!user || !user.role) return false;
    return ['owner', 'manager'].includes(user.role.toLowerCase());
  }
  
  /**
   * Can the user delete inventory items?
   * Only the owner can delete items
   * @param {object} user
   * @returns {boolean}
   */
  export function canDeleteInventory(user) {
    if (!user || !user.role) return false;
    return user.role.toLowerCase() === 'owner';
  }
  
  /**
   * Can the user view inventory insights?
   * Owner, manager, and staff can view
   * @param {object} user
   * @returns {boolean}
   */
  export function canViewInsights(user) {
    if (!user || !user.role) return false;
    return ['owner', 'manager', 'staff'].includes(user.role.toLowerCase());
  }
  
  /**
   * Can the user set inventory preferences (thresholds, safety stock, etc)?
   * Only owner and manager
   * @param {object} user
   * @returns {boolean}
   */
  export function canSetPreferences(user) {
    if (!user || !user.role) return false;
    return ['owner', 'manager'].includes(user.role.toLowerCase());
  }
  