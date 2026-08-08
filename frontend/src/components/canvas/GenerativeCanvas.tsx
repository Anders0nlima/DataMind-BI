import { DynamicChart, type GenerativeChartSpec } from "./charts/DynamicChart";
import { IBGETable, type IBGETableSpec } from "./tables/IBGETable";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export interface GenerativeUIPayload {
  component_type: "CHART" | "TABLE" | "METRIC_CARD";
  spec: any;
}

interface GenerativeCanvasProps {
  visuals: GenerativeUIPayload[];
  isGenerating?: boolean;
  hasDataset?: boolean;
}

export function GenerativeCanvas({ visuals, isGenerating, hasDataset }: GenerativeCanvasProps) {
  if (isGenerating || !visuals || visuals.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex items-center justify-center mx-auto">
            <img 
              src={isGenerating ? "/logo-loading-animated2.svg" : "/logo_datamaind.png"} 
              alt="DataMind BI" 
              className={`w-64 h-auto object-contain transition-all duration-700 ${isGenerating ? 'animate-pulse drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]' : ''}`} 
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">
              {isGenerating 
                ? "Processando análise..." 
                : hasDataset 
                  ? "Análise concluída (Texto)" 
                  : "Faça upload de um dataset"}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed transition-opacity">
              {isGenerating 
                ? "Nossa IA está extraindo insights e montando a sua visualização..."
                : hasDataset
                  ? "Nenhum gráfico ou tabela foi necessário para esta pergunta. Leia a resposta no chat ao lado."
                  : "Envie um arquivo CSV ou XLSX para gerar relatórios e visualizações conforme as normas UFPA/IBGE."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      {visuals.map((visual, idx) => {
        if (visual.component_type === "CHART") {
          return (
            <motion.div 
              key={`visual-${idx}`} 
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: idx * 0.1 }}
            >
              <DynamicChart spec={visual.spec as GenerativeChartSpec} />
            </motion.div>
          );
        }
        
        if (visual.component_type === "TABLE") {
          return (
            <motion.div 
              key={`visual-${idx}`} 
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: idx * 0.1 }}
            >
              <IBGETable spec={visual.spec as IBGETableSpec} />
            </motion.div>
          );
        }

        return null;
      })}
    </div>
  );
}
