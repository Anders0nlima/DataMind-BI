import { Table, Hash, Type, BarChart2 } from "lucide-react";

interface ColumnSchema {
  name: string;
  sql_type: string;
  variable_type: string;
}

interface SchemaInspectorProps {
  schema: {
    table_name: string;
    total_rows: number;
    columns: ColumnSchema[];
  };
}

export function SchemaInspector({ schema }: SchemaInspectorProps) {
  const getIconForType = (type: string) => {
    switch (type) {
      case "QUALITATIVE_NOMINAL":
      case "QUALITATIVE_ORDINAL":
        return <Type className="w-4 h-4 text-emerald-400" />;
      case "QUANTITATIVE_DISCRETE":
        return <Hash className="w-4 h-4 text-blue-400" />;
      case "QUANTITATIVE_CONTINUOUS":
        return <BarChart2 className="w-4 h-4 text-purple-400" />;
      default:
        return <Hash className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "QUALITATIVE_NOMINAL":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "QUALITATIVE_ORDINAL":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "QUANTITATIVE_DISCRETE":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "QUANTITATIVE_CONTINUOUS":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const formatTypeLabel = (type: string) => {
    return type.replace("QUALITATIVE_", "QUAL.").replace("QUANTITATIVE_", "QUANT.");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-200 truncate max-w-[120px]" title={schema.table_name}>
            {schema.table_name}
          </span>
        </div>
        <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded-md text-slate-400">
          {schema.total_rows.toLocaleString('pt-BR')} linhas
        </span>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Variáveis Inferidas (UFPA)
        </h4>
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {schema.columns.map((col, idx) => (
            <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-2 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200 truncate" title={col.name}>
                  {col.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {col.sql_type}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {getIconForType(col.variable_type)}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getBadgeColor(col.variable_type)}`}>
                  {formatTypeLabel(col.variable_type)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
