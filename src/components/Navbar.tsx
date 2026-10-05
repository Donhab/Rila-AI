import React from 'react';
import { Film, Download, Sparkles, FolderOpen, Sliders, Layers, Plus } from 'lucide-react';
import { AspectRatio } from '../types/video';

interface NavbarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  totalDuration: number;
  clipCount: number;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (aspectRatio: AspectRatio) => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenAddMedia?: () => void;
  onTogglePromptDrawer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onTitleChange,
  totalDuration,
  clipCount,
  aspectRatio,
  onAspectRatioChange,
  onOpenTemplates,
  onOpenExport,
  onOpenAddMedia,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-neutral-950">
            <Film className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-sm sm:text-base text-white font-['Space_Grotesk']">
                RILA <span className="text-amber-400">AI</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20 uppercase tracking-wider font-semibold">
                Video
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 hidden sm:block">AI Video Generator Studio</p>
          </div>
        </div>

        <div className="h-6 w-px bg-neutral-800 hidden sm:block" />

        {/* Project Name editable */}
        <div className="flex items-center gap-2 min-w-0 max-w-[200px] sm:max-w-xs">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent hover:bg-neutral-900 focus:bg-neutral-900 border border-transparent hover:border-neutral-800 focus:border-amber-500/50 rounded px-2 py-1 text-sm font-medium text-neutral-200 focus:outline-none truncate w-full transition"
            placeholder="Untitled Film Project..."
          />
        </div>
      </div>

      {/* Center Duration & Clips Info */}
      <div className="hidden lg:flex items-center gap-3 bg-neutral-900/80 border border-neutral-800/80 px-3.5 py-1.5 rounded-full text-xs">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>{clipCount} Clips</span>
        </div>
        <div className="h-3 w-px bg-neutral-800" />
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-400">Total:</span>
          <span className={`font-mono font-semibold ${totalDuration >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {formatTime(totalDuration)}
          </span>
          {totalDuration >= 60 && (
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 rounded-full font-medium">
              60s+ Feature
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Aspect Ratio Selector */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs font-mono">
          {(['16:9', '9:16', '1:1', '21:9'] as AspectRatio[]).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onAspectRatioChange(ratio)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                aspectRatio === ratio
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title={`Switch aspect ratio to ${ratio}`}
            >
              {ratio}
            </button>
          ))}
        </div>

        {/* Add Media Button */}
        {onOpenAddMedia && (
          <button
            onClick={onOpenAddMedia}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
            title="Add images, videos, sounds, or voiceovers"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Add Media</span>
          </button>
        )}

        {/* Templates Button */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
          title="Browse 60s+ starter film templates"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Templates</span>
        </button>

        {/* Export & Download Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Export Video</span>
          <span className="hidden md:inline text-[9px] bg-neutral-950/30 px-1 rounded text-neutral-950 font-mono">
            HD
          </span>
        </button>
      </div>
    </header>
  );
};
