import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      credentials: null, // { username, password } for Basic auth

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setCredentials: (credentials) => set({ credentials }),

      login: ({ user, token, credentials }) =>
        set({ user, token: token || null, credentials: credentials || null }),

      logout: () =>
        set({ user: null, token: null, credentials: null }),

      isAuthenticated: () => {
        const { user } = get()
        return !!user
      },

      getRole: () => get().user?.role || null,
      getUserId: () => get().user?.id || null,
    }),
    {
      name: 'lendbridge-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        credentials: state.credentials,
      }),
    }
  )
)
