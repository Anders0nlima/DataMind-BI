import { create } from 'zustand';

interface ConfigState {
  normaEstatistica: 'ibge' | 'abnt';
  casasDecimais: number;
  separadorDecimal: 'virgula' | 'ponto';
  isMethodologyOpen: boolean;

  setNormaEstatistica: (norma: 'ibge' | 'abnt') => void;
  setCasasDecimais: (casas: number) => void;
  setSeparadorDecimal: (separador: 'virgula' | 'ponto') => void;
  setMethodologyOpen: (open: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  normaEstatistica: 'ibge',
  casasDecimais: 2,
  separadorDecimal: 'virgula',
  isMethodologyOpen: false,
  
  setNormaEstatistica: (norma) => set({ normaEstatistica: norma }),
  setCasasDecimais: (casas) => set({ casasDecimais: casas }),
  setSeparadorDecimal: (separador) => set({ separadorDecimal: separador }),
  setMethodologyOpen: (open) => set({ isMethodologyOpen: open }),
}));
