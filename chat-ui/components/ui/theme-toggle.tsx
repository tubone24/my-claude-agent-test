'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/lib/dark-mode-store'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useThemeStore()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
}