import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';

interface DisplaySettings {
  background_color?: string;
  text_color?: string;
  [key: string]: any;
}

interface ThemeContextType {
  settings: DisplaySettings | null;
  isLoading: boolean;
  applyCustomColors: (element?: HTMLElement) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appliedColors, setAppliedColors] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings/display"],
    queryFn: settingsApi.getDisplay,
    refetchInterval: 30000
  });

  const applyCustomColors = (element: HTMLElement = document.documentElement) => {
    if (!settings) return;

    const {
      background_color = "#FFF8E1",
      text_color = "#212529"
    } = settings;

    // Apply CSS custom properties for global theming
    element.style.setProperty('--theme-bg-primary', background_color);
    element.style.setProperty('--theme-text-primary', text_color);
    
    // Apply to body and root elements
    document.body.style.backgroundColor = background_color || "#FFF8E1";
    document.body.style.color = text_color || "#212529";
    
    // Update CSS variables that can be used in Tailwind
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --theme-bg-primary: ${background_color};
        --theme-text-primary: ${text_color};
      }
      .theme-bg-primary { background-color: ${background_color} !important; }
      .theme-text-primary { color: ${text_color} !important; }
      .bg-gold-50 { background-color: ${background_color} !important; }
      .text-gray-900 { color: ${text_color} !important; }
    `;
    
    // Remove previous theme styles and add new ones
    const existingStyle = document.getElementById('dynamic-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    style.id = 'dynamic-theme-styles';
    document.head.appendChild(style);
  };

  useEffect(() => {
    if (settings && !appliedColors) {
      applyCustomColors();
      setAppliedColors(true);
    }
  }, [settings, appliedColors]);

  // Re-apply colors when settings change
  useEffect(() => {
    if (settings) {
      applyCustomColors();
    }
  }, [settings]);

  return (
    <ThemeContext.Provider value={{ settings: settings || null, isLoading, applyCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
};