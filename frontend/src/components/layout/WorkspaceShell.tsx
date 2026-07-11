import { useState, useRef } from "react";
import { Database, MessageSquare, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LeftSidebar } from "../sidebar/LeftSidebar";
import { ConversationalBI, type ConversationalBIRef } from "../chat/ConversationalBI";
import { GenerativeCanvas } from "../canvas/GenerativeCanvas";
import { exportToXLSX, exportToPDF } from "../../utils/exportUtils";
import { useChatStore } from "../../store/useChatStore";

type PanelView = 'both' | 'canvas' | 'chat';

/* -- Mini Rail Button with tooltip -- */
function MiniRailButton({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="group relative w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
    >
      {icon}
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-700 text-slate-100 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
        {title}
      </span>
    </button>
  );
}

export function WorkspaceShell() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { chats, activeChatId, setDataset, setVisuals, createFolder, createChat } = useChatStore();
  
  const activeChat = chats.find(c => c.id === activeChatId);
  const schema = activeChat?.datasetSchema || null;
  const _datasetPath = activeChat?.datasetPath || null;
  const visuals = activeChat?.visuals || [];

  const chatRef = useRef<ConversationalBIRef>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelView, setPanelView] = useState<PanelView>('both');

  const handleAnalysisClick = (prompt: string) => {
    if (chatRef.current) chatRef.current.sendQuery(prompt);
    // Switch to both panels so user can see the result
    if (panelView === 'canvas') setPanelView('both');
  };

  const handleExport = async (type: 'pdf' | 'xlsx') => {
    if (type === 'xlsx') exportToXLSX(visuals);
    else await exportToPDF();
  };

  const handleUploadComplete = (data: { dataset_path: string; schema: any }) => {
    setIsUploading(false);
    setUploadError(null);
    
    if (activeChatId) {
      setDataset(activeChatId, data.dataset_path, data.schema);
      setVisuals(activeChatId, []);
    } else {
      // Auto-create chat if they upload without a chat open
      const folderId = createFolder("Novas Análises");
      const chatId = createChat(folderId, data.schema.table_name || "Dataset");
      setDataset(chatId, data.dataset_path, data.schema);
    }
  };

  const handleClearDataset = () => {
    if (activeChatId) {
      setDataset(activeChatId, '', null);
      setVisuals(activeChatId, []);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">

      {/* -- LEFT PANEL: Sidebar (expanded or mini rail) --------------------- */}
      <aside
        className="flex-shrink-0 flex flex-col z-20 transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: sidebarOpen ? '320px' : '56px' }}
      >
        {sidebarOpen ? (
          /* -- EXPANDED -- */
          <div className="flex flex-col h-full w-full">
            <div className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-r border-slate-800 shrink-0">
              <div className="flex items-center gap-0">
                <img src="/logo_datamaind.png" alt="DataMind BI" className="w-14 h-14 object-contain" />
                <span className="font-bold text-slate-100 tracking-tight ml-1">DataMind BI</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Ocultar barra lateral"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <LeftSidebar
                isUploading={isUploading}
                uploadError={uploadError}
                schema={schema}
                onUploadStart={() => { setIsUploading(true); setUploadError(null); }}
                onUploadComplete={handleUploadComplete}
                onUploadError={(err) => { setIsUploading(false); setUploadError(err); }}
                onClearDataset={handleClearDataset}
                onAnalysisClick={handleAnalysisClick}
                onExport={handleExport}
              />
            </div>
          </div>
        ) : (
          /* -- COLLAPSED MINI RAIL -- */
          <div className="flex flex-col h-full w-full bg-slate-900 border-r border-slate-800">
            {/* Brand icon */}
            <div className="h-16 flex items-center justify-center border-b border-slate-800 shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                title="DataMind BI  Expandir"
                className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <img src="/logo_datamaind.png" alt="DataMind BI" className="w-14 h-14 object-contain" />
              </button>
            </div>

            {/* Icon nav rail */}
            <nav className="flex-1 flex flex-col items-center py-3 gap-1">
              <MiniRailButton
                title="Ferramentas"
                onClick={() => setSidebarOpen(true)}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                }
              />
              <MiniRailButton
                title="Config."
                onClick={() => setSidebarOpen(true)}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                }
              />
              <MiniRailButton
                title="Historico"
                onClick={() => setSidebarOpen(true)}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                    <path d="M12 7v5l4 2"/>
                  </svg>
                }
              />
              <MiniRailButton
                title="Dataset"
                onClick={() => setSidebarOpen(true)}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/>
                    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
                  </svg>
                }
              />
            </nav>

            {/* Expand button */}
            <div className="flex items-center justify-center border-t border-slate-800 py-3 shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Mostrar barra lateral"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* -- MAIN AREA: Canvas + Chat ---------------------------------------- */}
      <div className="flex flex-1 overflow-hidden">

        {/* -- CENTER: Canvas ---------------------------------------------- */}
        {(panelView === 'both' || panelView === 'canvas') && (
          <main className="flex-1 flex flex-col relative bg-slate-950 min-w-0">
            <header className="h-16 flex items-center justify-between px-6 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md w-full shrink-0">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                <h2 className="text-sm font-semibold text-slate-200">Canvas Generativo</h2>
              </div>

              {/* -- Panel View Toggle -- */}
              <div className="flex items-center gap-1 bg-slate-800/70 rounded-lg p-1">
                <button
                  onClick={() => setPanelView('canvas')}
                  title="Somente Canvas"
                  className={`p-1.5 rounded-md transition-colors ${panelView === 'canvas' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>
                </button>
                <button
                  onClick={() => setPanelView('both')}
                  title="Canvas e Chat"
                  className={`p-1.5 rounded-md transition-colors ${panelView === 'both' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/></svg>
                </button>
                <button
                  onClick={() => setPanelView('chat')}
                  title="Somente Chat"
                  className={`p-1.5 rounded-md transition-colors ${(panelView as PanelView) === 'chat' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
                </button>
              </div>
            </header>

            {/* Hidden print header (visible only on print) */}
            <div id="print-header" style={{display: 'none'}} className="hidden">
              <img src="/logo_datamaind.png" alt="DataMind BI" style={{width: 48, height: 48}} />
              <div>
                <strong style={{fontSize: 18, color: '#1e293b'}}>DataMind BI</strong>
                <span style={{fontSize: 12, color: '#64748b', marginLeft: 8}}>
                  Relatório gerado em {new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'})}
                </span>
              </div>
            </div>

            <div id="canvas-print-area" className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <GenerativeCanvas visuals={visuals} isGenerating={isGenerating} hasDataset={!!schema} />
            </div>
          </main>
        )}

        {/* -- RIGHT: Chat ------------------------------------------------- */}
        {(panelView === 'both' || panelView === 'chat') && (
          <aside className={`flex-shrink-0 border-l border-slate-800 bg-slate-900 flex flex-col z-20 ${panelView === 'chat' ? 'flex-1' : 'w-[400px]'}`}>
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                {panelView === 'chat' && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Mostrar barra lateral"
                  >
                    <PanelLeftOpen className="w-5 h-5" />
                  </button>
                )}
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 leading-tight">Interprete Senior</h2>
                  <span className="text-[10px] text-slate-400 font-medium">BI Assistant</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {panelView === 'chat' && (
                  <div className="flex items-center gap-1 bg-slate-800/70 rounded-lg p-1">
                    <button
                      onClick={() => setPanelView('canvas')}
                      title="Somente Canvas"
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>
                    </button>
                    <button
                      onClick={() => setPanelView('both')}
                      title="Canvas e Chat"
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/></svg>
                    </button>
                    <button
                      onClick={() => setPanelView('chat')}
                      title="Somente Chat"
                      className="p-1.5 rounded-md bg-slate-700 text-slate-100 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
                    </button>
                  </div>
                )}
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              </div>
            </div>

            <ConversationalBI
              ref={chatRef}
              onIsGeneratingChange={setIsGenerating}
            />
          </aside>
        )}

      </div>
    </div>
  );
}
