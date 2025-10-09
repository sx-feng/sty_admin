import { ref, watchEffect } from 'vue'
const THEME_KEY = 'sty-admin-theme'

export function useTheme(){
  const theme = ref(localStorage.getItem(THEME_KEY) || 'dark') // dark / light
  watchEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme.value)
    localStorage.setItem(THEME_KEY, theme.value)
  })
  const toggle = () => theme.value = (theme.value === 'dark' ? 'light' : 'dark')
  return { theme, toggle }
}
