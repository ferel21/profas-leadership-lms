"use client";

import { Presentation } from "lucide-react";
import { ExportActionButton } from "@/components/ui/ExportActionButton";
import { generateExecutiveSlideDeck, SlideDeckOptions } from "@/services/export/pptxGenerator";

interface ExportDeckButtonProps extends SlideDeckOptions {
  className?: string;
  label?: string;
}

export function ExportDeckButton({
  className,
  label = "Unduh Slide Deck Presentation (16:9 PDF)",
  ...options
}: ExportDeckButtonProps) {
  return (
    <ExportActionButton
      variant="presentation"
      icon={Presentation}
      label={label}
      successLabel="Slide Deck Terunduh!"
      title="Unduh Executive Slide Deck & Presentation Outline dengan rasio layar lebar 16:9"
      className={className}
      errorMessage="Terjadi kesalahan saat menghasilkan slide deck presentasi."
      onExport={() => generateExecutiveSlideDeck(options)}
    />
  );
}
