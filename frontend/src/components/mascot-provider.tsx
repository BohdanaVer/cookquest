/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'

const DEFAULT_MASCOT = 'broccoli'
const STORAGE_KEY = 'cq_mascot'

interface AppContextValue {
  activeMascot: string
  setActiveMascot: (key: string) => void
  balance: number
  setBalance: (b: number | ((prev: number) => number)) => void
}

const AppContext = createContext<AppContextValue>({
  activeMascot: DEFAULT_MASCOT,
  setActiveMascot: () => {},
  balance: 0,
  setBalance: () => {},
})

export function MascotProvider({ children }: { children: ReactNode }) {
  const [activeMascot, setActiveMascotState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_MASCOT
  })
  
  const [balance, setBalance] = useState(0)

  function setActiveMascot(key: string) {
    localStorage.setItem(STORAGE_KEY, key)
    setActiveMascotState(key)
  }

  return (
    <AppContext.Provider value={{ activeMascot, setActiveMascot, balance, setBalance }}>
      {children}
    </AppContext.Provider>
  )
}

export function useActiveMascot() { return useContext(AppContext).activeMascot }
export function useSetActiveMascot() { return useContext(AppContext).setActiveMascot }
export function useBalance() { return useContext(AppContext).balance }
export function useSetBalance() { return useContext(AppContext).setBalance }