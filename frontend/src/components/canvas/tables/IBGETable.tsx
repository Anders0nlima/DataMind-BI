export interface TableColumnDef {
  header: string;
  accessor_key: string;
}

export interface IBGETableSpec {
  title: string;
  columns: TableColumnDef[];
  data: any[];
  source_footer: string;
  has_vertical_borders?: false;
}

interface IBGETableProps {
  spec: IBGETableSpec;
}

/**
 * IBGETable: A React component that strictly enforces IBGE 1993 Tabular Standards.
 * 
 * Rules applied:
 * 1. Title at the top, clear and descriptive.
 * 2. NO vertical borders separating columns.
 * 3. Horizontal borders only at:
 *    - The very top of the table.
 *    - Separating the header from the data.
 *    - The very bottom of the table data.
 * 4. Source citation at the footer.
 */
export function IBGETable({ spec }: IBGETableProps) {
  return (
    <div className="w-full flex flex-col items-center my-6 text-slate-200">
      
      {/* ── IBGE Rule 1: Title ────────────────────────────────────────── */}
      <div className="w-full text-center mb-4">
        <h3 className="text-lg font-semibold tracking-wide text-slate-100">
          {spec.title}
        </h3>
      </div>

      {/* ── IBGE Table Structure ──────────────────────────────────────── */}
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          
          <thead className="text-xs uppercase text-slate-400 bg-slate-900/40">
            <tr>
              {spec.columns.map((col, idx) => (
                <th 
                  key={col.accessor_key} 
                  scope="col" 
                  className={`px-6 py-4 font-semibold border-y-2 border-slate-600 ${idx === 0 ? "pl-2" : ""} ${idx === spec.columns.length - 1 ? "pr-2" : ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {spec.data.map((row, rowIdx) => (
              <tr 
                key={`row-${rowIdx}`} 
                className={`hover:bg-slate-800/30 transition-colors ${rowIdx === spec.data.length - 1 ? "border-b-2 border-slate-600" : "border-b border-slate-700/50"}`}
              >
                {spec.columns.map((col, colIdx) => {
                  const val = row[col.accessor_key];
                  const displayVal = typeof val === "number" ? val.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : val;
                  
                  return (
                    <td 
                      key={`${rowIdx}-${col.accessor_key}`}
                      className={`px-6 py-3 border-l-0 border-r-0 ${colIdx === 0 ? "pl-2 font-medium text-slate-300" : ""} ${colIdx === spec.columns.length - 1 ? "pr-2" : ""}`}
                    >
                      {displayVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          
        </table>
      </div>

      {/* ── IBGE Rule 4: Source Footer ────────────────────────────────── */}
      <div className="w-full mt-3 text-left">
        <p className="text-xs text-slate-500 italic">
          <span className="font-semibold not-italic">Fonte:</span> {spec.source_footer}
        </p>
      </div>

    </div>
  );
}
