import { useState } from "react";
import { BarChart3, Database, MessageSquare, Settings } from "lucide-react";
import { DatasetDropzone } from "../sidebar/DatasetDropzone";
import { SchemaInspector } from "../sidebar/SchemaInspector";

export function WorkspaceShell() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [_datasetPath, setDatasetPath] = useState<string | null>(null);

  const handleUploadComplete = (data: { dataset_path: string; schema: any }) => {
    setIsUploading(false);
    setUploadError(null);
    setDatasetPath(data.dataset_path);
    setSchema(data.schema);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* ── LEFT PANEL: Sidebar / Input ─────────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-800/60 bg-slate-900/50 flex flex-col backdrop-blur-xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2 text-brand-400 font-bold tracking-wide">
            <Database className="w-5 h-5 text-blue-500" />
            <span>DataMind BI</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dataset</h3>
            
            {uploadError && (
              <div className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                {uploadError}
              </div>
            )}

            {!schema ? (
              <DatasetDropzone 
                isUploading={isUploading}
                onUploadStart={() => { setIsUploading(true); setUploadError(null); }}
                onUploadComplete={handleUploadComplete}
                onError={(err: string) => { setIsUploading(false); setUploadError(err); }}
              />
            ) : (
              <SchemaInspector schema={schema} />
            )}
            
            {schema && (
              <button 
                onClick={() => { setSchema(null); setDatasetPath(null); }}
                className="w-full mt-2 py-2 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
              >
                Trocar Dataset
              </button>
            )}
          </div>
          
          <div className="space-y-3 pt-4 border-t border-slate-800/60">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configurações</h3>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer text-sm text-slate-300 transition-colors">
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Parâmetros Estatísticos</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── CENTER PANEL: Main Canvas ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md absolute top-0 w-full z-10">
          <h2 className="text-lg font-medium text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Canvas Generativo
          </h2>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 pt-24">
          <div className="h-full border border-slate-800/50 rounded-2xl bg-slate-900/30 flex items-center justify-center backdrop-blur-sm shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-blue-500/20">
                <BarChart3 className="w-8 h-8 text-blue-400 opacity-80" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Faça o upload de um dataset para gerar relatórios visuais</p>
                <p className="text-slate-600 text-xs mt-1">Aderência estrita às normas da UFPA/IBGE</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── RIGHT PANEL: AI Chat Interface ──────────────────────────────── */}
      <aside className="w-96 flex-shrink-0 border-l border-slate-800/60 bg-slate-900/50 flex flex-col backdrop-blur-xl shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 shrink-0">
          <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            Senior Code Interpreter
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end gap-4">
          <div className="bg-slate-800/60 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-300 border border-slate-700/50">
            Olá! Sou seu assistente de BI. Faça o upload de um dataset para começar.
          </div>
        </div>
        
        <div className="p-4 bg-slate-900 border-t border-slate-800/60">
          <div className="relative">
            <input 
              type="text" 
              placeholder={schema ? "Ex: Qual a média de faturamento?" : "Aguardando dataset..."}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500 disabled:opacity-50"
              disabled={!schema}
            />
            <button 
              disabled={!schema}
              className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
            >
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
