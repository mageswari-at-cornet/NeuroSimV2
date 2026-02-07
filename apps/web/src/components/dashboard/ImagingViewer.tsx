import { useState } from "react";
import { cn } from "../../lib/utils";
import { ImageOff, ZoomIn, ZoomOut, Move, RefreshCw } from "lucide-react";

interface ImagingViewerProps {
  className?: string;
}

type Modality = "ctp" | "cta";

const modalities: { value: Modality; label: string }[] = [
  { value: "ctp", label: "CTP" },
  { value: "cta", label: "CTA" },
];

export function ImagingViewer({ className }: ImagingViewerProps) {
  const [activeModality, setActiveModality] = useState<Modality>("ctp");
  const [zoom, setZoom] = useState(100);

  return (
    <div className={cn("chart-container flex flex-col", className)}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neuro-text-primary">Imaging</h3>
        <div className="flex items-center gap-1">
          {modalities.map((mod) => (
            <button
              key={mod.value}
              onClick={() => setActiveModality(mod.value)}
              className={cn(
                "tab-btn",
                activeModality === mod.value && "active"
              )}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image display area */}
      <div className="flex-1 min-h-[160px] bg-neuro-bg-secondary rounded-lg border border-neuro-border-subtle relative overflow-hidden flex items-center justify-center">
        {/* Image display based on modality */}
        {activeModality === "ctp" ? (
          <img
            src="/images/ctp.png"
            alt="CT Perfusion Scan"
            className="max-w-[60%] max-h-[60%] object-contain"
          />
        ) : activeModality === "cta" ? (
          <img
            src="/images/cta.png"
            alt="CT Angiography"
            className="max-w-[60%] max-h-[50%] object-contain"
          />
        ) : (
          /* Placeholder content for other modalities */
          <div className="text-center p-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-neuro-bg-tertiary flex items-center justify-center">
              <ImageOff className="w-10 h-10 text-neuro-text-tertiary" />
            </div>
            <p className="text-sm text-neuro-text-secondary mb-2">
              CT Angiography
            </p>
            <p className="text-xs text-neuro-text-tertiary max-w-xs">
              Connect to PACS to view actual imaging data.
              This is a placeholder for demonstration purposes.
            </p>
          </div>
        )}

        {/* Zoom controls overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 25))}
            className="p-1.5 rounded bg-neuro-bg-tertiary/80 text-neuro-text-secondary hover:text-neuro-text-primary transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-neuro-text-secondary px-2 min-w-[50px] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 25))}
            className="p-1.5 rounded bg-neuro-bg-tertiary/80 text-neuro-text-secondary hover:text-neuro-text-primary transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1">
          <button className="p-1.5 rounded bg-neuro-bg-tertiary/80 text-neuro-text-secondary hover:text-neuro-text-primary transition-colors">
            <Move className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-1.5 rounded bg-neuro-bg-tertiary/80 text-neuro-text-secondary hover:text-neuro-text-primary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
