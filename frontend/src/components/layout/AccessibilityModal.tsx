import { X, Check } from "lucide-react";
import { useStore } from "../../store/useStore";

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityModal({ isOpen, onClose }: AccessibilityModalProps) {
  const { 
    fontSize, setFontSize, 
    contrast, setContrast, 
    colorBlindness, setColorBlindness, 
    reduceMotion, setReduceMotion,
    resetAccessibility 
  } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <span className="text-brand-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><path d="m3 11 8-2 8 2"/><path d="m12 9v12"/><path d="m8 21 4-6 4 6"/></svg>
            </span>
            Acessibilidade
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Tamanho do texto */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Tamanho do texto</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'small', label: 'Pequeno', size: 'text-sm' },
                { id: 'medium', label: 'Médio', size: 'text-base' },
                { id: 'large', label: 'Grande', size: 'text-lg' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFontSize(opt.id as any)}
                  className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${
                    fontSize === opt.id 
                      ? 'border-brand-500 bg-brand-900/20 text-brand-400' 
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className={`font-semibold ${opt.size}`}>A</span>
                  <span className="text-xs mt-1">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contraste */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Contraste</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'high', label: 'Alto' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setContrast(opt.id as any)}
                  className={`py-2 rounded-xl border-2 transition-all font-medium text-sm ${
                    contrast === opt.id 
                      ? 'border-brand-500 bg-brand-900/20 text-brand-400' 
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modo daltonismo */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Modo daltonismo</label>
            <div className="space-y-2">
              {[
                { id: 'none', label: 'Nenhum' },
                { id: 'deuteranopia', label: 'Deuteranopia (verde-vermelho)' },
                { id: 'protanopia', label: 'Protanopia (vermelho-verde)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setColorBlindness(opt.id as any)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl border-2 transition-all ${
                    colorBlindness === opt.id 
                      ? 'border-brand-500 bg-brand-900/20 text-brand-400' 
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                    colorBlindness === opt.id ? 'border-brand-500 bg-brand-500' : 'border-slate-600'
                  }`}>
                    {colorBlindness === opt.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reduzir movimento */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <label className="text-sm font-medium text-slate-300 block">Reduzir movimento</label>
              <span className="text-xs text-slate-400">Desativa animações e transições</span>
            </div>
            <button 
              onClick={() => setReduceMotion(!reduceMotion)}
              className={`w-11 h-6 rounded-full relative transition-colors ${reduceMotion ? 'bg-brand-500' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${reduceMotion ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button 
              onClick={resetAccessibility}
              className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Restaurar padrões
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
