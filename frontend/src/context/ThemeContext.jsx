import React, { createContext, useContext } from 'react';

// Deprecated: Dark mode removed. Single Light theme is standard.
const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  return <ThemeContext.Provider value={{ theme: 'light', isDark: false, setTheme: () => {}, toggleTheme: () => {} }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
