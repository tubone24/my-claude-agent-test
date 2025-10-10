'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/dark-mode-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    // マウント時にテーマを再適用（ハイドレーション後）
    setTheme(theme)
  }, [theme, setTheme])

  return <>{children}</>
}