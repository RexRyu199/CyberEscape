import { create } from 'zustand';

export const useGameStore = create((set) => ({
  user: null,         // usuario de Firebase Auth
  profile: null,      // perfil de Firestore
  loading: true,
  themeId: 'matrix',  // al cambiar, la app se vuelve a pintar con el tema nuevo
  isAnonymous: true,  // true = invitado (su progreso aún no está protegido)

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setThemeId: (themeId) => set({ themeId }),
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),
}));