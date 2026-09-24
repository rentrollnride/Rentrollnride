import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getValidSession, signIn, signOut, type AdminSession } from "@/lib/supabase-auth"
import { useQueryClient } from "@tanstack/react-query"

type AuthContextValue = {
  session: AdminSession | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    getValidSession().then(setSession).finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        login: async (email, password) => setSession(await signIn(email, password)),
        logout: async () => {
          setSession(null)
          queryClient.clear()
          await signOut()
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}