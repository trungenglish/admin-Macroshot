import { createContext, useContext, useMemo, useState } from 'react';

const ThemeContext = createContext({ mode: 'light', setMode: () => {} });

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
