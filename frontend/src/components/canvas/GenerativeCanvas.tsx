import { DynamicChart, type GenerativeChartSpec } from "./charts/DynamicChart";
import { IBGETable, type IBGETableSpec } from "./tables/IBGETable";
import { BarChart3 } from "lucide-react";

export interface GenerativeUIPayload {
  component_type: "CHART" | "TABLE" | "METRIC_CARD";
  spec: any;
}

interface GenerativeCanvasProps {
  visuals: GenerativeUIPayload[];
}

export function GenerativeCanvas({ visuals }: GenerativeCanvasProps) {
  if (!visuals || visuals.length === 0) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      {visuals.map((visual, idx) => {
        if (visual.component_type === "CHART") {
          return (
            <div key={`visual-${idx}`} className="w-full">
              <DynamicChart spec={visual.spec as GenerativeChartSpec} />
            </div>
          );
        }
        
        if (visual.component_type === "TABLE") {
          return (
            <div key={`visual-${idx}`} className="w-full">
              <IBGETable spec={visual.spec as IBGETableSpec} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
