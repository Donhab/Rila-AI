import React from 'react';
import { X, Film, Sparkles, Clock, Check, ArrowRight } from 'lucide-react';
import { PrebuiltProject, SAMPLE_PROJECTS } from '../data/cinematicPresets';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: PrebuiltProject) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Space_Grotesk'] uppercase tracking-wider">
                60s+ Cinematic Film Templates
              </h2>
              <p className="text-[11px] text-neutral-400">
                Pre-directed multi-scene episodic projects ready to customize, edit, and join
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-300">
          {SAMPLE_PROJECTS.map((proj) => (
            <div
              key={proj.id}
              className="bg-neutral-900/60 border border-neutral-800 hover:border-amber-500/50 rounded-2xl p-4 transition group flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
            >
              {/* Left Details */}
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition font-['Space_Grotesk']">
                    {proj.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono font-medium">
                    {proj.duration}s Feature
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                    {proj.aspectRatio}
                  </span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  {proj.synopsis}
                </p>

                {/* Thumbnails strip */}
                <div className="flex items-center gap-1.5 pt-1">
                  {proj.clips.map((clip, i) => (
                    <div
                      key={clip.id}
                      className="w-12 h-8 rounded-md overflow-hidden bg-neutral-800 border border-neutral-700/60 relative"
                      title={clip.title}
                    >
                      <img
                        src={clip.imageUrl}
                        alt={clip.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/80 px-0.5 rounded text-white font-mono">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                  <span className="text-[10px] text-neutral-500 ml-1 font-mono">
                    {proj.clips.length} episodic scenes
                  </span>
                </div>
              </div>

              {/* Load Button */}
              <button
                type="button"
                onClick={() => {
                  onSelectProject(proj);
                  onClose();
                }}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md shadow-amber-500/20 active:scale-95"
              >
                <span>Load Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
