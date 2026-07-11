import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FontSize = 'small' | 'medium' | 'large';
type Contrast = 'normal' | 'high';
type ColorBlindness = 'none' | 'deuteranopia' | 'protanopia';

interface AppState {
  // Accessibility
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  
  contrast: Contrast;
  setContrast: (contrast: Contrast) => void;
  
  colorBlindness: ColorBlindness;
  setColorBlindness: (mode: ColorBlindness) => void;
  
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
  
  resetAccessibility: () => void;
}

const getFontScale = (size: FontSize) => {
  switch(size) {
    case 'small': return '0.875rem'; // 14px
    case 'large': return '1.125rem'; // 18px
    case 'medium':
    default: return '1rem'; // 16px
  }
};

const getContrastFilter = (contrast: Contrast) => {
  return contrast === 'high' ? 'contrast(125%)' : 'none';
};

const getColorBlindnessFilter = (mode: ColorBlindness) => {
  switch(mode) {
    case 'deuteranopia': return 'url(#deuteranopia-filter)';
    case 'protanopia': return 'url(#protanopia-filter)';
    case 'none':
    default: return 'none';
  }
};

// Function to apply accessibility CSS variables to the document root
const applyAccessibilityVars = (state: Partial<AppState>) => {
  const root = document.documentElement;
  
  // Force dark mode at the root level for consistency, although we are also hardcoding the classes.
  root.classList.add('dark');
  
  if (state.fontSize) root.style.setProperty('--font-scale', getFontScale(state.fontSize));
  if (state.contrast) root.style.setProperty('--contrast-filter', getContrastFilter(state.contrast));
  if (state.colorBlindness) root.style.setProperty('--color-blind-filter', getColorBlindnessFilter(state.colorBlindness));
  
  if (state.reduceMotion !== undefined) {
    if (state.reduceMotion) {
      root.style.setProperty('--tw-translate-x', '0');
      root.style.setProperty('--tw-translate-y', '0');
      root.style.setProperty('--tw-scale-x', '1');
      root.style.setProperty('--tw-scale-y', '1');
      root.style.setProperty('transition', 'none');
    } else {
      root.style.removeProperty('transition');
    }
  }
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      fontSize: 'medium',
      setFontSize: (fontSize) => {
        set({ fontSize });
        applyAccessibilityVars({ fontSize });
      },
      
      contrast: 'normal',
      setContrast: (contrast) => {
        set({ contrast });
        applyAccessibilityVars({ contrast });
      },
      
      colorBlindness: 'none',
      setColorBlindness: (colorBlindness) => {
        set({ colorBlindness });
        applyAccessibilityVars({ colorBlindness });
      },
      
      reduceMotion: false,
      setReduceMotion: (reduceMotion) => {
        set({ reduceMotion });
        applyAccessibilityVars({ reduceMotion });
      },
      
      resetAccessibility: () => {
        const defaults = {
          fontSize: 'medium' as FontSize,
          contrast: 'normal' as Contrast,
          colorBlindness: 'none' as ColorBlindness,
          reduceMotion: false,
        };
        set(defaults);
        applyAccessibilityVars(defaults);
      }
    }),
    {
      name: 'datamind-storage',
      onRehydrateStorage: () => (state) => {
        // Apply settings when local storage is loaded on app boot
        applyAccessibilityVars(state || {});
      }
    }
  )
);
