import { useState } from "react";
import { 
  BarChart2, TrendingUp, Table2, Search, Scale,
  FileText, FileSpreadsheet, Database
} from "lucide-react";
import { useConfigStore } from "../../store/useConfigStore";
import { FolderExplorer } from "./FolderExplorer";
import { DatasetDropzone } from "./DatasetDropzone";
import { SchemaInspector } from "./SchemaInspector";

interface LeftSidebarProps {
  isUploading: boolean;
  uploadError: string | null;
  schema: any;
  onUploadStart: () => void;
  onUploadComplete: (data: any) => void;
  onUploadError: (err: string) => void;
  onClearDataset: () => void;
  onAnalysisClick: (prompt: string) => void;
  onExport: (type: 'pdf' | 'xlsx') => void;
}

type TabType = 'ferramentas' | 'config' | 'historico';

const QUICK_ANALYSES = [
  {
    icon: BarChart2,
    label: 'Distribuição de Frequência',
    color: 'text-blue-400',
    prompt: 'Faça uma análise de distribuição de frequências para as variáveis qualitativas do dataset, gerando gráficos de coluna para cada uma.',
  },
  {
    icon: TrendingUp,
    label: 'Série Temporal',
    color: 'text-purple-400',
    prompt: 'Identifique variáveis que representam tempo no dataset e trace uma série temporal mostrando a evolução.',
  },
  {
    icon: Table2,
    label: 'Tabela Resumo IBGE',
    color: 'text-orange-400',
    prompt: 'Crie uma tabela resumo completa no formato IBGE com estatísticas descritivas do dataset (média, mínimo, máximo, frequências).',
  },
  {
    icon: Search,
    label: 'Detectar Outliers',
    color: 'text-red-400',
    prompt: 'Identifique e descreva quaisquer outliers presentes nas variáveis quantitativas do dataset.',
  },
  {
    icon: Scale,
    label: 'Comparar Grupos',
    color: 'text-teal-400',
    prompt: 'Compare as médias das variáveis quantitativas entre os grupos das variáveis qualitativas do dataset.',
  },
];

export function LeftSidebar({ 
  isUploading, uploadError, schema, 
  onUploadStart, onUploadComplete, onUploadError, onClearDataset,
  onAnalysisClick, onExport,
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ferramentas');
  const { normaEstatistica, casasDecimais, separadorDecimal, setNormaEstatistica, setCasasDecimais, setSeparadorDecimal } = useConfigStore();

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 border-r border-slate-800">
      
      {/* Tabs Header */}
      <div className="flex px-4 pt-2 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('ferramentas')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'ferramentas' ? 'text-brand-400 border-b-2 border-brand-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Ferramentas
        </button>
        <button
          onClick={() => setActiveTab('pastas')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'pastas' ? 'text-brand-400 border-b-2 border-brand-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Pastas
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'config' ? 'text-brand-400 border-b-2 border-brand-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Config.
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        
        {/* FERRAMENTAS TAB */}
        {activeTab === 'ferramentas' && (
          <div className="space-y-8">
            
            {/* DATASET */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Dataset</h3>
              
              {uploadError && (
                <div className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {uploadError}
                </div>
              )}

              {!schema ? (
                <DatasetDropzone 
                  isUploading={isUploading}
                  onUploadStart={onUploadStart}
                  onUploadComplete={onUploadComplete}
                  onError={onUploadError}
                />
              ) : (
                <div className="space-y-2">
                  <SchemaInspector schema={schema} />
                  <button 
                    onClick={onClearDataset}
                    className="w-full py-2 text-xs font-medium text-slate-400 hover:text-brand-400 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors bg-slate-900"
                  >
                    Trocar Dataset
                  </button>
                </div>
              )}
            </div>

            {/* ANÁLISES RÁPIDAS */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Análises Rápidas</h3>
              {!schema && (
                <p className="text-[11px] text-slate-500 italic">Carregue um dataset para habilitar as análises.</p>
              )}
              <div className="space-y-1">
                {QUICK_ANALYSES.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAnalysisClick(item.prompt)}
                    disabled={!schema}
                    title={!schema ? "Carregue um dataset primeiro" : item.label}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800 text-sm text-slate-300 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <item.icon className={`w-4 h-4 ${item.color} opacity-80 group-hover:opacity-100 group-disabled:opacity-40 shrink-0`} />
                    <span className="text-left leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* EXPORTAR */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Exportar</h3>
              {!schema && (
                <p className="text-[11px] text-slate-500 italic">Disponível após gerar análises.</p>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => onExport('pdf')}
                  disabled={!schema}
                  title={!schema ? "Gere análises primeiro" : "Baixar como PDF"}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800 text-sm text-slate-300 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <FileText className="w-4 h-4 text-red-400 opacity-80 group-hover:opacity-100 shrink-0" />
                  Relatório PDF
                </button>
                <button
                  onClick={() => onExport('xlsx')}
                  disabled={!schema}
                  title={!schema ? "Gere análises primeiro" : "Baixar como XLSX"}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800 text-sm text-slate-300 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-500 opacity-80 group-hover:opacity-100 shrink-0" />
                  Planilha XLSX
                </button>
              </div>
            </div>

          </div>
        )}

        {/* PASTAS TAB */}
        {activeTab === 'pastas' && (
          <div className="h-full flex-1 overflow-hidden pb-4">
            <FolderExplorer />
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Parâmetros</h3>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Norma estatística</label>
                <select 
                  value={normaEstatistica}
                  onChange={(e) => setNormaEstatistica(e.target.value as 'ibge' | 'abnt')}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <option value="ibge">UFPA/IBGE</option>
                  <option value="abnt">Padrão ABNT</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Casas decimais</label>
                <select 
                  value={casasDecimais}
                  onChange={(e) => setCasasDecimais(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Separador decimal</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setSeparadorDecimal('virgula')}
                    className={`py-2 border rounded-lg text-sm font-bold shadow-sm transition-colors ${
                      separadorDecimal === 'virgula' 
                        ? 'bg-slate-900 border-brand-500 text-brand-400' 
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    ,
                  </button>
                  <button 
                    onClick={() => setSeparadorDecimal('ponto')}
                    className={`py-2 border rounded-lg text-sm font-bold shadow-sm transition-colors ${
                      separadorDecimal === 'ponto' 
                        ? 'bg-slate-900 border-brand-500 text-brand-400' 
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    .
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-center shrink-0">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
          Respostas baseadas em DuckDB · UFPA/IBGE
        </span>
      </div>

    </div>
  );
}
