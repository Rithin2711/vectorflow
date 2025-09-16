import { create } from 'zustand';

export const useTheme = create((set, get) => ({
  theme: 'light',
  // PUBLIC_INTERFACE
  toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
}));
