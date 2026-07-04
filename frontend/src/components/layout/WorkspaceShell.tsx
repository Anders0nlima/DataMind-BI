import { BarChart3, Database, MessageSquare, Settings } from "lucide-react";

export function WorkspaceShell() {
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* ── LEFT PANEL: Sidebar / Input ─────────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-800/60 bg-slate-900/50 flex flex-col backdrop-blur-xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2 text-brand-400 font-bold tracking-wide">
            <Database className="w-5 h-5 text-blue-500" />
            <span>DataMind BI</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dataset</h3>
            <div className="p-4 border border-slate-800 rounded-xl bg-slate-900 shadow-sm flex flex-col gap-3">
              <div className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-800 rounded-lg hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors cursor-pointer">
                Upload CSV or XLSX
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settings</h3>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer text-sm text-slate-300 transition-colors">
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Statistical Parameters</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── CENTER PANEL: Main Canvas ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md absolute top-0 w-full z-10">
          <h2 className="text-lg font-medium text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Generative Canvas
          </h2>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 pt-24">
          <div className="h-full border border-slate-800/50 rounded-2xl bg-slate-900/30 flex items-center justify-center backdrop-blur-sm shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-blue-500/20">
                <BarChart3 className="w-8 h-8 text-blue-400 opacity-80" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Upload a dataset to generate visual reports</p>
                <p className="text-slate-600 text-xs mt-1">Strict adherence to UFPA/IBGE standards</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── RIGHT PANEL: AI Chat Interface ──────────────────────────────── */}
      <aside className="w-96 flex-shrink-0 border-l border-slate-800/60 bg-slate-900/50 flex flex-col backdrop-blur-xl shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60">
          <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            Senior Code Interpreter
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end gap-4">
          {/* Welcome Message */}
          <div className="bg-slate-800/60 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-300 border border-slate-700/50">
            Olá! Sou seu assistente de BI. Faça uma pergunta sobre seus dados.
          </div>
        </div>
        
        <div className="p-4 bg-slate-900 border-t border-slate-800/60">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ex: Qual a média de faturamento?" 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500"
              disabled
            />
            <button className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-3">
            Respostas baseadas puramente no banco de dados DuckDB.
          </p>
        </div>
      </aside>

    </div>
  );
}
