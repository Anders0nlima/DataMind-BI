import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export interface ChartSeries {
  name: string;
  data_key: string;
}

export interface GenerativeChartSpec {
  chart_type: "LINE" | "COLUMN" | "HORIZONTAL_BAR" | "PIE";
  title: string;
  x_axis_key: string;
  series: ChartSeries[];
  data: any[];
  aspect_ratio?: string;
}

interface DynamicChartProps {
  spec: GenerativeChartSpec;
}

// B2B Brand Colors for charts
const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e"];

export function DynamicChart({ spec }: DynamicChartProps) {
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-300 font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400">{entry.name}:</span>
              <span className="text-slate-200 font-semibold">{entry.value.toLocaleString('pt-BR')}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (spec.chart_type) {
      case "COLUMN":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spec.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey={spec.x_axis_key} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickMargin={10} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {spec.series.map((s, idx) => (
                <Bar key={s.data_key} dataKey={s.data_key} name={s.name} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case "HORIZONTAL_BAR":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spec.data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis type="category" dataKey={spec.x_axis_key} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={100} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {spec.series.map((s, idx) => (
                <Bar key={s.data_key} dataKey={s.data_key} name={s.name} fill={COLORS[idx % COLORS.length]} radius={[0, 4, 4, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "LINE":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spec.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey={spec.x_axis_key} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickMargin={10} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {spec.series.map((s, idx) => (
                <Line 
                  key={s.data_key} 
                  type="monotone" 
                  dataKey={s.data_key} 
                  name={s.name} 
                  stroke={COLORS[idx % COLORS.length]} 
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "PIE":
        // For PIE charts, Recharts uses 'nameKey' and 'dataKey'. 
        // We map the first series as the values, and x_axis_key as the labels.
        const pieDataKey = spec.series[0]?.data_key || "value";
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Pie
                data={spec.data}
                dataKey={pieDataKey}
                nameKey={spec.x_axis_key}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={60}
                paddingAngle={2}
              >
                {spec.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-500">
            Tipo de gráfico não suportado: {spec.chart_type}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-96 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 flex flex-col shadow-xl">
      <h3 className="text-lg font-medium text-slate-200 mb-4 text-center">
        {spec.title}
      </h3>
      <div className="flex-1 w-full h-full min-h-[300px]">
        {renderChart()}
      </div>
    </div>
  );
}
