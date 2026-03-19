import { useAuthStore } from '@/stores/authStore'

export function useUserId(): string {
  const user = useAuthStore((s) => s.user)
  if (!user) throw new Error('Not authenticated')
  return user.id
}
