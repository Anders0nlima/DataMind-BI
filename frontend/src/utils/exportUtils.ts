import * as XLSX from "xlsx";

export interface ExportVisual {
  component_type: "CHART" | "TABLE" | "METRIC_CARD";
  spec: any;
}

/**
 * Exports all chart/table visuals from the Canvas to an XLSX file.
 * Each visual becomes a separate sheet tab.
 */
export function exportToXLSX(visuals: ExportVisual[]): void {
  const workbook = XLSX.utils.book_new();

  const exportableVisuals = visuals.filter(
    (v) => v.component_type === "CHART" || v.component_type === "TABLE"
  );

  if (exportableVisuals.length === 0) {
    alert("Nenhum gráfico ou tabela disponível para exportar.");
    return;
  }

  exportableVisuals.forEach((visual, idx) => {
    const spec = visual.spec;
    const data: Record<string, any>[] = spec.data ?? [];

    if (!data || data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths
    const colKeys = Object.keys(data[0] ?? {});
    worksheet["!cols"] = colKeys.map((key) => ({
      wch: Math.max(key.length, ...data.map((row) => String(row[key] ?? "").length)) + 2,
    }));

    const sheetLabel =
      visual.component_type === "TABLE"
        ? `Tabela ${idx + 1}`
        : `Gráfico ${idx + 1}`;

    const title = spec.title ?? sheetLabel;
    // Sheet names max 31 chars
    const safeName = title.replace(/[:\\/?*[\]]/g, "").substring(0, 31) || sheetLabel;

    XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
  });

  if (workbook.SheetNames.length === 0) {
    alert("Nenhum dado encontrado nos visuais.");
    return;
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  XLSX.writeFile(workbook, `DataMind_BI_${dateStr}.xlsx`);
}

/**
 * Captures the canvas area and downloads it as a PDF file using jsPDF + html2canvas.
 * Includes a header with the logo, "DataMind BI" name, and the generation date.
 */
export async function exportToPDF(): Promise<void> {
  const canvasEl = document.getElementById("canvas-print-area");
  if (!canvasEl) {
    alert("Nenhum conteúdo encontrado para exportar.");
    return;
  }

  // Apply export mode class
  canvasEl.classList.add("pdf-export-mode");
  
  // Await layout shift so the div grows to fit its content completely
  await new Promise(r => setTimeout(r, 100));

  try {
    // Dynamically import to keep bundle split
    const [jsPDFModule, htmlToImageModule] = await Promise.all([
      import("jspdf"),
      import("html-to-image"),
    ]);

    const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
    const { toPng } = htmlToImageModule;

    const imgData = await toPng(canvasEl, {
      backgroundColor: "#ffffff",
      pixelRatio: 2, // 2x for sharp resolution
    });

    // Create an image object to get the dimensions
    const img = new Image();
    img.src = imgData;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const imgWidth = img.width;
    const imgHeight = img.height;

    // A4 dimensions in mm
    const pdfW = 210;
    const headerH = 22; // mm reserved for the header
    const footerH = 10;
    const marginLR = 15;
    const contentW = pdfW - marginLR * 2;

    // Scale image to fit A4 width
    const scaledH = (imgHeight * contentW) / imgWidth;
    const pdfH = Math.max(297, scaledH + headerH + footerH + 10);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfW, pdfH] });

    // ── Header ──
    // Logo
    const logoImg = new Image();
    logoImg.src = "/logo_datamaind.png";
    await new Promise<void>((res) => { logoImg.onload = () => res(); logoImg.onerror = () => res(); });
    pdf.addImage(logoImg, "PNG", marginLR, 5, 12, 12);

    // Title text
    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59); // slate-800
    pdf.setFont("helvetica", "bold");
    pdf.text("DataMind BI", marginLR + 14, 12);

    // Date
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(`Relatório gerado em ${dateStr}`, marginLR + 14, 17);

    // Separator line
    pdf.setDrawColor(139, 92, 246); // brand purple
    pdf.setLineWidth(0.5);
    pdf.line(marginLR, headerH, pdfW - marginLR, headerH);

    // ── Content ──
    pdf.addImage(imgData, "PNG", marginLR, headerH + 4, contentW, scaledH);

    // ── Footer ──
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text("Processamento via DuckDB | Padrões metodológicos baseados em UFPA/IBGE", marginLR, pdfH - 5);

    // ── Download ──
    const now = new Date();
    const dateFile = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    pdf.save(`DataMind_BI_${dateFile}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
  } finally {
    // Restore styles
    canvasEl.classList.remove("pdf-export-mode");
  }
}

