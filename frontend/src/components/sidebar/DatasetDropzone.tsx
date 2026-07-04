import { useState, useRef } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

interface DatasetDropzoneProps {
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadComplete: (data: { dataset_path: string; schema: any }) => void;
  onError: (error: string) => void;
}

export function DatasetDropzone({ isUploading, onUploadStart, onUploadComplete, onError }: DatasetDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      onError("Por favor, envie apenas arquivos CSV ou XLSX.");
      return;
    }

    onUploadStart();
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/analytics/datasets/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Erro no upload.");
      }

      const data = await res.json();
      onUploadComplete(data);
    } catch (err: any) {
      onError(err.message);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`
        relative p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer
        ${isDragOver ? "border-blue-500 bg-blue-500/10" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"}
        ${isUploading ? "pointer-events-none opacity-70" : ""}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept=".csv, .xlsx"
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />

      {isUploading ? (
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      ) : (
        <div className="p-3 bg-slate-800 rounded-full">
          <UploadCloud className="w-6 h-6 text-blue-400" />
        </div>
      )}
      
      <div>
        <h4 className="text-sm font-medium text-slate-200">
          {isUploading ? "Processando e validando..." : "Faça upload do Dataset"}
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Arraste um CSV ou XLSX até aqui.
        </p>
      </div>
    </div>
  );
}
