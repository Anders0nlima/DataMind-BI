import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { ArrowRight, Bot, User, Loader2 } from "lucide-react";
import { sendChatQuerySSE, type SSEEvent } from "../../services/sseClient";
import { useConfigStore } from "../../store/useConfigStore";
import { useChatStore } from "../../store/useChatStore";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

interface ConversationalBIProps {
  onIsGeneratingChange?: (isGenerating: boolean) => void;
}

export interface ConversationalBIRef {
  sendQuery: (query: string) => void;
}

export const ConversationalBI = forwardRef<ConversationalBIRef, ConversationalBIProps>(
  function ConversationalBIInner({ onIsGeneratingChange }: ConversationalBIProps, ref) {
  
  const { 
    chats, 
    activeChatId, 
    addMessage, 
    setVisuals, 
    autoCreateChatAndFolder 
  } = useChatStore();
  
  const { casasDecimais, separadorDecimal } = useConfigStore();

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [
    { id: 'welcome', role: 'ai', content: 'Crie ou selecione uma pasta para começar.' }
  ];
  const datasetPath = activeChat?.datasetPath || null;
  const datasetSchema = activeChat?.datasetSchema || null;

  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamStatus]);

  // Remove local useEffect for welcome messages since it's state-driven

  // Expose sendQuery for parent components (sidebar quick analysis buttons)
  useImperativeHandle(ref, () => ({
    sendQuery: (query: string) => handleSend(query),
  }));

  const handleSend = async (query: string = inputValue) => {
    if (!query.trim() || isStreaming) return;

    let targetChatId = activeChatId;
    let targetDataset = datasetPath;
    let targetSchema = datasetSchema;

    if (!targetChatId) {
      // Auto-create flow
      targetChatId = autoCreateChatAndFolder(query.trim());
      // The store just created a chat, but it won't have a dataset yet unless they upload one
      // Wait, if there's no dataset, we should warn them instead of sending the query.
    }

    if (!targetDataset || !targetSchema) {
      // They need to upload a dataset first for this chat
      alert("Por favor, faça o upload de um dataset para este chat primeiro.");
      return;
    }

    const userQ = query.trim();
    setInputValue("");
    
    addMessage(targetChatId, { id: Date.now().toString(), role: "user", content: userQ });
    
    setIsStreaming(true);
    if (onIsGeneratingChange) onIsGeneratingChange(true);
    setStreamStatus("Inicializando pipeline...");

    const formatInstruction = `\n\n[INSTRUÇÃO DE SISTEMA OBRIGATÓRIA]: Formate rigorosamente todos os números nas respostas e tabelas usando exatamente ${casasDecimais} casas decimais e utilizando o caractere "${separadorDecimal === 'virgula' ? ',' : '.'}" como separador decimal.`;
    const finalQuery = userQ + formatInstruction;

    try {
      await sendChatQuerySSE(targetDataset, targetSchema, finalQuery, (event: SSEEvent) => {
        if (event.status === 'processing') {
          setStreamStatus(event.message);
        } 
        else if (event.status === 'completed') {
          addMessage(targetChatId!, { id: Date.now().toString(), role: "ai", content: event.response.narration });
          
          if (event.response.visuals) {
            setVisuals(targetChatId!, event.response.visuals);
          }
          
          setStreamStatus(null);
          setIsStreaming(false);
          if (onIsGeneratingChange) onIsGeneratingChange(false);
        }
        else if (event.status === 'error') {
          addMessage(targetChatId!, { id: Date.now().toString(), role: "ai", content: `**Erro:** ${event.message}` });
          setStreamStatus(null);
          setIsStreaming(false);
          if (onIsGeneratingChange) onIsGeneratingChange(false);
        }
      });
    } catch (err: any) {
      addMessage(targetChatId!, { id: Date.now().toString(), role: "ai", content: `**Erro de conexão:** Não foi possível conectar ao servidor. (${err.message})` });
      setStreamStatus(null);
      setIsStreaming(false);
      if (onIsGeneratingChange) onIsGeneratingChange(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-950">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 max-w-[95%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`
              w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1
              ${msg.role === 'user' ? 'bg-brand-500 shadow-sm' : 'bg-brand-900/30'}
            `}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-brand-400" />}
            </div>
            <div className={`
              p-4 text-sm rounded-2xl leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-brand-500 text-white rounded-tr-sm shadow-sm' 
                : 'bg-slate-900 text-slate-300 border border-slate-800 rounded-tl-sm shadow-sm'}
            `}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {/* Streaming Status Indicator */}
        {isStreaming && streamStatus && (
          <div className="flex gap-3 max-w-[95%]">
            <div className="w-7 h-7 rounded-lg bg-brand-900/30 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-brand-400" />
            </div>
            <div className="p-3 text-sm rounded-2xl bg-slate-900 text-slate-400 border border-slate-800 rounded-tl-sm flex items-center gap-2 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
              {streamStatus}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        
        {/* Sugestões */}
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Sugestões</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Resumir o dataset",
              "Média por categoria",
              "Detectar outliers"
            ].map((sug, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(sug)}
                disabled={!datasetSchema || isStreaming}
                className="px-3 py-1.5 text-xs font-medium text-brand-400 bg-brand-900/20 border border-brand-500/20 rounded-full hover:bg-brand-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={datasetSchema ? "Ex: Qual a média de faturamento?" : "Aguardando dataset..."}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-4 pr-12 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-slate-500 disabled:opacity-50"
            disabled={!datasetSchema || isStreaming}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!datasetSchema || isStreaming || !inputValue.trim()}
            className="absolute right-2 top-2 p-2 bg-brand-900/30 text-brand-400 hover:bg-brand-500 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-3">
          O processamento é local (DuckDB) e não envia dados para a IA.{' '}
          <button 
            onClick={() => useConfigStore.getState().setMethodologyOpen(true)}
            className="text-brand-400 hover:text-brand-300 hover:underline transition-colors focus:outline-none"
          >
            Saiba como funciona
          </button>
        </p>
      </div>
    </>
  );
  }
);
