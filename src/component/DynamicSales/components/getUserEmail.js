// src/components/Sales/getUserEmail.js

export function getLoggedInUserEmail() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userEmail') || null;
  }
  