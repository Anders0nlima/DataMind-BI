import { create } from 'zustand';

interface ConfigState {
  normaEstatistica: 'ibge' | 'abnt';
  casasDecimais: number;
  separadorDecimal: 'virgula' | 'ponto';
  
  setNormaEstatistica: (norma: 'ibge' | 'abnt') => void;
  setCasasDecimais: (casas: number) => void;
  setSeparadorDecimal: (sep: 'virgula' | 'ponto') => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  normaEstatistica: 'ibge',
  casasDecimais: 2,
  separadorDecimal: 'virgula',
  
  setNormaEstatistica: (norma) => set({ normaEstatistica: norma }),
  setCasasDecimais: (casas) => set({ casasDecimais: casas }),
  setSeparadorDecimal: (sep) => set({ separadorDecimal: sep }),
}));
