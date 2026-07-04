import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { sendChatQuerySSE, type SSEEvent } from "../../services/sseClient";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

interface ConversationalBIProps {
  datasetPath: string | null;
  datasetSchema: any | null;
}

export function ConversationalBI({ datasetPath, datasetSchema }: ConversationalBIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Olá! Sou seu assistente de BI. Faça o upload de um dataset para começar."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamStatus]);

  // Update welcome message when schema is ready
  useEffect(() => {
    if (datasetSchema) {
      setMessages([{
        id: "ready",
        role: "ai",
        content: `Dataset **${datasetSchema.table_name}** carregado! Como posso ajudar a extrair insights?`
      }]);
    } else {
      setMessages([{
        id: "welcome",
        role: "ai",
        content: "Olá! Sou seu assistente de BI. Faça o upload de um dataset para começar."
      }]);
    }
  }, [datasetSchema]);

  const handleSend = async () => {
    if (!inputValue.trim() || !datasetPath || !datasetSchema || isStreaming) return;

    const userQ = inputValue.trim();
    setInputValue("");
    
    // Add User Message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: "user", content: userQ }]);
    
    setIsStreaming(true);
    setStreamStatus("Inicializando pipeline...");

    try {
      await sendChatQuerySSE(datasetPath, datasetSchema, userQ, (event: SSEEvent) => {
        if (event.status === 'processing') {
          // Update the live status badge
          setStreamStatus(event.message);
        } 
        else if (event.status === 'completed') {
          // Stream done, append the final AI response
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now().toString(), 
              role: "ai", 
              content: event.response.narration 
            }
          ]);
          setStreamStatus(null);
          setIsStreaming(false);
        }
        else if (event.status === 'error') {
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now().toString(), 
              role: "ai", 
              content: `**Erro:** ${event.message}` 
            }
          ]);
          setStreamStatus(null);
          setIsStreaming(false);
        }
      });
    } catch (err: any) {
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          role: "ai", 
          content: `**Erro de conexão:** Não foi possível conectar ao servidor. (${err.message})` 
        }
      ]);
      setStreamStatus(null);
      setIsStreaming(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center shrink-0
              ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'}
            `}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-400" />}
            </div>
            <div className={`
              p-3 text-sm rounded-2xl
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'bg-slate-800/60 text-slate-300 border border-slate-700/50 rounded-tl-sm'}
            `}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {/* Streaming Status Indicator */}
        {isStreaming && streamStatus && (
          <div className="flex gap-3 max-w-[90%]">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="p-3 text-sm rounded-2xl bg-slate-800/40 text-slate-400 border border-slate-700/30 rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              {streamStatus}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-slate-900 border-t border-slate-800/60 shrink-0">
        <div className="relative">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={datasetSchema ? "Ex: Qual a média de faturamento?" : "Aguardando dataset..."}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500 disabled:opacity-50"
            disabled={!datasetSchema || isStreaming}
          />
          <button 
            onClick={handleSend}
            disabled={!datasetSchema || isStreaming || !inputValue.trim()}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-3">
          Respostas baseadas puramente no banco de dados DuckDB.
        </p>
      </div>
    </>
  );
}
