/**
 * Authentication Service (Mock Frontend Architecture)
 *
 * Provides mock authentication, onboarding session management, and user profiles.
 * To be replaced with real backend authentication endpoints in future phases.
 */

import { MOCK_USER } from '../data/mockUser.js';
import { storageService } from './storageService.js';

export function computeInitials(name) {
  if (!name || typeof name !== 'string') return 'SA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SA';
  if (parts.length === 1) {
    const single = parts[0];
    return single.length >= 2 ? single.slice(0, 2).toUpperCase() : single.toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatNameFromEmail(email) {
  if (!email || typeof email !== 'string') return 'Sakshi';
  const username = email.split('@')[0] || '';
  if (!username) return 'Sakshi';
  const cleaned = username.replace(/[0-9_.-]+/g, ' ').trim();
  if (!cleaned) return 'Sakshi';
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function notifyUserChanged(user) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('migraineguardian_user_updated', { detail: user }));
  }
}

function getRegisteredAccounts() {
  return storageService.getItem('migraineguardian_accounts', {});
}

function saveRegisteredAccount(user) {
  if (!user || !user.email) return;
  const accounts = getRegisteredAccounts();
  const key = user.email.toLowerCase().trim();
  accounts[key] = user;
  storageService.setItem('migraineguardian_accounts', accounts);
}

export const authService = {
  getCurrentUser: () => {
    const cachedUser = storageService.getItem('migraineguardian_user', null);
    if (cachedUser) {
      // Migrate old legacy name 'Elena Vance' if still in local storage
      const name = (!cachedUser.name || cachedUser.name === 'Elena Vance')
        ? (formatNameFromEmail(cachedUser.email) || MOCK_USER.name)
        : cachedUser.name;

      const user = {
        ...MOCK_USER,
        ...cachedUser,
        name,
        initials: computeInitials(name),
      };
      return user;
    }
    return MOCK_USER;
  },

  login: async (emailInput, password) => {
    // Simulated network delay
    await new Promise((res) => setTimeout(res, 300));

    const email = emailInput?.trim() || '';
    const normalizedKey = email.toLowerCase();
    const accounts = getRegisteredAccounts();
    const existingAccount = accounts[normalizedKey];

    let user;
    if (existingAccount) {
      user = {
        ...MOCK_USER,
        ...existingAccount,
        initials: computeInitials(existingAccount.name || formatNameFromEmail(email)),
      };
    } else {
      const derivedName = formatNameFromEmail(email) || 'Sakshi';
      const currentUser = authService.getCurrentUser();
      user = {
        ...MOCK_USER,
        ...currentUser,
        id: currentUser?.id || `usr_${Date.now().toString(36)}`,
        name: derivedName,
        email: email || currentUser.email || 'sakshi@serene-health.org',
        initials: computeInitials(derivedName),
      };
    }

    saveRegisteredAccount(user);
    storageService.setItem('migraineguardian_user', user);
    storageService.setItem('migraineguardian_authenticated', true);
    notifyUserChanged(user);
    return { success: true, user };
  },

  signup: async ({ name, email, password }) => {
    await new Promise((res) => setTimeout(res, 300));

    const cleanEmail = email?.trim() || 'sakshi@serene-health.org';
    const displayName = name?.trim() || formatNameFromEmail(cleanEmail) || 'Sakshi';

    const newUser = {
      ...MOCK_USER,
      id: `usr_${Date.now().toString(36)}`,
      name: displayName,
      email: cleanEmail,
      initials: computeInitials(displayName),
    };

    saveRegisteredAccount(newUser);
    storageService.setItem('migraineguardian_user', newUser);
    storageService.setItem('migraineguardian_authenticated', true);
    notifyUserChanged(newUser);
    return { success: true, user: newUser };
  },

  logout: async () => {
    await new Promise((res) => setTimeout(res, 200));
    storageService.removeItem('migraineguardian_authenticated');
    return { success: true };
  },

  updateUserProfile: async (updates) => {
    const current = authService.getCurrentUser();
    const updated = {
      ...current,
      ...updates,
    };
    if (updates.name) {
      updated.name = updates.name.trim();
      updated.initials = computeInitials(updated.name);
    }
    saveRegisteredAccount(updated);
    storageService.setItem('migraineguardian_user', updated);
    notifyUserChanged(updated);
    return updated;
  },
};

