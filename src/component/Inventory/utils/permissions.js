// src/inventory/utils/permissions.js

/**
 * Inventory Role Definitions:
 * - owner: full access to inventory, products, stock adjustments
 * - manager: can adjust stock, view insights, but cannot delete products
 * - staff: can view inventory, cannot adjust stock
 */

export const ROLES = {
    OWNER: 'owner',
    MANAGER: 'manager',
    STAFF: 'staff',
  };
  
  /**
   * Check if user is store owner
   * @param {Object} user - store user object
   * @returns {boolean}
   */
  export function isOwner(user) {
    return user?.role?.toLowerCase() === ROLES.OWNER;
  }
  
  /**
   * Check if user is manager
   * @param {Object} user - store user object
   * @returns {boolean}
   */
  export function isManager(user) {
    return user?.role?.toLowerCase() === ROLES.MANAGER;
  }
  
  /**
   * Can adjust inventory (increase or decrease stock)
   * @param {Object} user
   * @returns {boolean}
   */
  export function canAdjustStock(user) {
    return isOwner(user) || isManager(user);
  }
  
  /**
   * Can delete inventory items
   * Only owner allowed
   * @param {Object} user
   * @returns {boolean}
   */
  export function canDeleteInventory(user) {
    return isOwner(user);
  }
  
  /**
   * Can view sales/product insights
   * Owner & Manager
   * @param {Object} user
   * @returns {boolean}
   */
  export function canViewInsights(user) {
    return isOwner(user) || isManager(user) || user?.role?.toLowerCase() === ROLES.STAFF;
  }
  
  /**
   * Can manage preferences (inventory thresholds, page size, low stock alerts)
   * Only owner & manager
   * @param {Object} user
   * @returns {boolean}
   */
  export function canManagePreferences(user) {
    return isOwner(user) || isManager(user);
  }
  