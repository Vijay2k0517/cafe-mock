'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('isai-theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = saved ? saved === 'dark' : prefersDark
    setIsDark(initialDark)
    document.documentElement.classList.toggle('dark', initialDark)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('isai-theme', next ? 'dark' : 'light')
  }

  if (!mounted) return null

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={toggle}
      className="fixed right-4 bottom-4 z-[60] rounded-full px-3 py-2 text-sm font-medium shadow bg-white/80 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:opacity-90"
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  )
}


