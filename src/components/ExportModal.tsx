import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Film,
  CheckCircle2,
  Loader2,
  Sparkles,
  Smartphone,
  Monitor,
  Square,
  Clapperboard,
  Sliders,
  Check,
} from 'lucide-react';
import { AspectRatio, VideoClip } from '../types/video';
import { cinematicRenderer, getResolutionDimensions } from '../utils/cinematicRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: VideoClip[];
  aspectRatio: AspectRatio;
  onAspectRatioChange: (aspectRatio: AspectRatio) => void;
  soundtrack: string;
  projectTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  clips,
  aspectRatio,
  onAspectRatioChange,
  soundtrack,
  projectTitle,
}) => {
  if (!isOpen) return null;

  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRenderTime, setCurrentRenderTime] = useState(0);
  const [exportedBlobUrl, setExportedBlobUrl] = useState<string | null>(null);
  const [exportedBlobSize, setExportedBlobSize] = useState<string>('');
  const [copiedShare, setCopiedShare] = useState(false);

  const totalDuration = cinematicRenderer.getTotalDuration(clips);
  const dims = getResolutionDimensions(resolution, aspectRatio);

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setExportedBlobUrl(null);

    try {
      const blob = await cinematicRenderer.exportVideo(
        clips,
        aspectRatio,
        resolution,
        fps,
        soundtrack,
        (pct, cTime) => {
          setProgress(pct);
          setCurrentRenderTime(cTime);
        }
      );

      const url = URL.createObjectURL(blob);
      setExportedBlobUrl(url);
      const mb = (blob.size / (1024 * 1024)).toFixed(1);
      setExportedBlobSize(`${mb} MB`);
    } catch (err: unknown) {
      console.error('Export render error:', err);
      alert('Video export error: ' + ((err as Error).message || 'Renderer failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedBlobUrl) return;
    const a = document.createElement('a');
    a.href = exportedBlobUrl;
    const cleanTitle = projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'rila_ai_video';
    a.download = `${cleanTitle}_${resolution}_${aspectRatio.replace(':', 'x')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share && exportedBlobUrl) {
      try {
        const response = await fetch(exportedBlobUrl);
        const blob = await response.blob();
        const file = new File([blob], `${projectTitle || 'Rila_AI_Video'}.webm`, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: projectTitle || 'Rila AI Video',
            text: 'Created with Rila AI Video Generator',
            files: [file],
          });
          return;
        }
      } catch {
        // fallback
      }
    }

    // Fallback: Copy notification
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Space_Grotesk'] uppercase tracking-wider">
                High-Definition Video Export
              </h2>
              <p className="text-[11px] text-neutral-400">
                Join & render {clips.length} clips ({totalDuration.toFixed(1)}s) for social sharing
              </p>
            </div>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-300">
          {!exportedBlobUrl ? (
            <>
              {/* Social Media Aspect Ratio Presets */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Social Media Target Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => onAspectRatioChange('9:16')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      aspectRatio === '9:16'
                        ? 'bg-amber-500/10 border-amber-500 text-white font-semibold shadow'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mb-1.5 text-amber-400" />
                    <span className="text-xs">Reels / TikTok</span>
                    <span className="text-[10px] text-neutral-500 font-mono">9:16 Vertical</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAspectRatioChange('16:9')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      aspectRatio === '16:9'
                        ? 'bg-amber-500/10 border-amber-500 text-white font-semibold shadow'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Monitor className="w-5 h-5 mb-1.5 text-amber-400" />
                    <span className="text-xs">YouTube Cinema</span>
                    <span className="text-[10px] text-neutral-500 font-mono">16:9 Widescreen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAspectRatioChange('1:1')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      aspectRatio === '1:1'
                        ? 'bg-amber-500/10 border-amber-500 text-white font-semibold shadow'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Square className="w-5 h-5 mb-1.5 text-amber-400" />
                    <span className="text-xs">Instagram Feed</span>
                    <span className="text-[10px] text-neutral-500 font-mono">1:1 Square</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAspectRatioChange('21:9')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      aspectRatio === '21:9'
                        ? 'bg-amber-500/10 border-amber-500 text-white font-semibold shadow'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Clapperboard className="w-5 h-5 mb-1.5 text-amber-400" />
                    <span className="text-xs">Cinemascope</span>
                    <span className="text-[10px] text-neutral-500 font-mono">21:9 Ultra-Wide</span>
                  </button>
                </div>
              </div>

              {/* Resolution & FPS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Resolution Quality
                  </label>
                  <div className="flex rounded-xl bg-neutral-900 p-1 border border-neutral-800 text-xs font-mono">
                    {(['720p', '1080p', '4k'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setResolution(r)}
                        className={`flex-1 py-1.5 rounded-lg text-center font-bold transition ${
                          resolution === r
                            ? 'bg-amber-500 text-neutral-950 shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                    Render Canvas: {dims.width} × {dims.height} px
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Framerate
                  </label>
                  <div className="flex rounded-xl bg-neutral-900 p-1 border border-neutral-800 text-xs font-mono">
                    {[30, 60].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFps(f)}
                        className={`flex-1 py-1.5 rounded-lg text-center font-bold transition ${
                          fps === f
                            ? 'bg-amber-500 text-neutral-950 shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {f} FPS
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                    High Bitrate Codec (VP9 / WebM / MP4)
                  </span>
                </div>
              </div>

              {/* Joined Film Overview Summary */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Video Duration:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {totalDuration.toFixed(1)} seconds {totalDuration >= 60 ? '(60s+ Verified)' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Clips Joined:</span>
                  <span className="font-mono text-white">{clips.length} Scenes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Audio Track:</span>
                  <span className="font-mono text-amber-400">{soundtrack} (Mixed Web Audio)</span>
                </div>
              </div>

              {/* Exporting Progress Bar */}
              {isExporting && (
                <div className="p-4 bg-neutral-900 border border-amber-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2 text-amber-400 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      Rendering HD Frames & Audio Stream...
                    </span>
                    <span className="text-white font-bold">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>
                      Processed: {currentRenderTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                    </span>
                    <span>High Bitrate Hardware Accelerated</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Finished Export State */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                  Video Successfully Rendered!
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Ready for seamless download and social media sharing
                </p>
              </div>

              {/* Video Player Preview of Exported File */}
              <div className="rounded-xl overflow-hidden border border-neutral-800 bg-black aspect-video max-w-sm mx-auto shadow-xl">
                <video
                  src={exportedBlobUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-center gap-3 text-xs font-mono text-neutral-400">
                <span>{dims.width} × {dims.height} ({resolution.toUpperCase()})</span>
                <span>•</span>
                <span>{totalDuration.toFixed(1)}s</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{exportedBlobSize}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-16 border-t border-neutral-800 px-6 flex items-center justify-between bg-neutral-950">
          {!exportedBlobUrl ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="text-neutral-400 hover:text-white text-xs font-medium transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartExport}
                disabled={isExporting}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                    <span>Rendering ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Start HD Export</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExportedBlobUrl(null)}
                className="text-neutral-400 hover:text-white text-xs font-medium transition"
              >
                Re-export Settings
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 px-4 py-2 rounded-xl text-xs font-medium transition"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Ready to Share</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-amber-400" />
                      <span>Social Share</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-bold px-5 py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-500/25 active:scale-95"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Video</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
