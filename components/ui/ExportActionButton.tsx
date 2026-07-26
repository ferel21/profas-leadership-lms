"use client";

import { useState } from "react";
import { Download, CheckCircle2, Loader2, type LucideIcon } from "lucide-react";

export type ExportButtonVariant =
  | "presentation"
  | "spreadsheet"
  | "document-dark"
  | "document-accent";

interface VariantStyle {
  idle: string;
  success: string;
  idleIconClassName: string;
  successIconClassName: string;
  fontWeight: string;
}

const VARIANT_STYLES: Record<ExportButtonVariant, VariantStyle> = {
  presentation: {
    idle: "bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] border-blue-500/30 text-blue-100 hover:text-white hover:shadow-blue-500/10 hover:-translate-y-0.5",
    success: "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-purple-500/10",
    idleIconClassName: "text-teal-400",
    successIconClassName: "text-purple-400",
    fontWeight: "font-bold",
  },
  spreadsheet: {
    idle: "bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] border-blue-500/30 text-white hover:shadow-blue-500/10 hover:-translate-y-0.5",
    success: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10",
    idleIconClassName: "text-white",
    successIconClassName: "text-emerald-400",
    fontWeight: "font-medium",
  },
  "document-dark": {
    idle: "bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-200 hover:text-white hover:shadow-slate-900/20 hover:-translate-y-0.5",
    success: "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-blue-500/10",
    idleIconClassName: "text-blue-400",
    successIconClassName: "text-blue-400",
    fontWeight: "font-bold",
  },
  "document-accent": {
    idle: "bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] border-blue-500/30 text-blue-100 hover:text-white hover:shadow-blue-500/10 hover:-translate-y-0.5",
    success: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10",
    idleIconClassName: "text-emerald-400",
    successIconClassName: "text-emerald-400",
    fontWeight: "font-bold",
  },
};

interface ExportActionButtonProps {
  variant: ExportButtonVariant;
  icon: LucideIcon;
  label: string;
  successLabel: string;
  title: string;
  errorMessage: string;
  className?: string;
  onExport: () => void | Promise<void>;
}

/**
 * Shared state machine + markup for every "unduh/export" button (deck, reports,
 * syllabus, transcript). Feature-specific buttons only supply the export call and
 * a visual variant — this is where the loading/success/error behavior lives once.
 */
export function ExportActionButton({
  variant,
  icon: Icon,
  label,
  successLabel,
  title,
  errorMessage,
  className = "",
  onExport,
}: ExportActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const style = VARIANT_STYLES[variant];

  const handleClick = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      await onExport();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(errorMessage, error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${style.fontWeight} text-sm transition-all duration-300 shadow-sm border ${
        success ? style.success : style.idle
      } backdrop-blur-md ${className}`}
      title={title}
    >
      {loading ? (
        <Loader2 className={`w-4 h-4 animate-spin ${style.idleIconClassName}`} />
      ) : success ? (
        <CheckCircle2 className={`w-4 h-4 ${style.successIconClassName}`} />
      ) : (
        <Icon className={`w-4 h-4 ${style.idleIconClassName}`} />
      )}
      <span>{success ? successLabel : label}</span>
      {!loading && !success && <Download className="w-3.5 h-3.5 opacity-75" />}
    </button>
  );
}
