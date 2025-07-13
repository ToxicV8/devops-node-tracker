import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/theme'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200"
      aria-label="Theme umschalten"
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
      <Sun className="absolute left-1.5 h-4 w-4 text-yellow-500" />
      <Moon className="absolute right-1.5 h-4 w-4 text-blue-500" />
    </button>
  )
}

export default ThemeToggle 