import React, { useState } from 'react';
import {
  Film,
  Music,
  Mic,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Scissors,
  Zap,
  Volume2,
  Clock,
  ArrowRightLeft,
  Sliders,
  Image as ImageIcon,
  Video as VideoIcon,
  Wand2,
  Check,
} from 'lucide-react';
import { TransitionType, VideoClip } from '../types/video';
import {
  TRANSITION_OPTIONS,
  SOUNDTRACK_OPTIONS,
  autoAssignAnimationsAndTransitions,
} from '../data/cinematicPresets';

interface TimelineEditorProps {
  clips: VideoClip[];
  onClipsChange: (clips: VideoClip[]) => void;
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
  currentTime: number;
  onSeek: (time: number) => void;
  soundtrack: string;
  onSoundtrackChange: (track: string) => void;
  onOpenExport: () => void;
  onOpenAddMedia?: (tab?: 'image' | 'video' | 'sound') => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  clips,
  onClipsChange,
  selectedClipId,
  onSelectClip,
  currentTime,
  onSeek,
  soundtrack,
  onSoundtrackChange,
  onOpenExport,
  onOpenAddMedia,
}) => {
  const [autoAnimateToast, setAutoAnimateToast] = useState<string | null>(null);

  const totalDuration = clips.reduce((sum, c) => sum + (c.duration / (c.speed || 1)), 0);

  // Automatically add beautiful animations and animated transitions to all video scenes
  const handleAutoAssignTransitions = (mode: 'variety' | 'action' | 'ambient' = 'variety') => {
    const updated = autoAssignAnimationsAndTransitions(clips, mode);
    onClipsChange(updated);
    const modeLabel =
      mode === 'action'
        ? 'Action Cuts (Whip Pan, Zoom Glitch, Blur)'
        : mode === 'ambient'
        ? 'Ambient Cinema (Film Burn, Light Leak, Dissolve)'
        : 'Cinematic Variety (Film Burns, Light Leaks, Whip Pans, Glitches)';
    setAutoAnimateToast(`Auto-assigned ${modeLabel} across all ${clips.length} scenes!`);
    setTimeout(() => setAutoAnimateToast(null), 3500);
  };

  // Reorder clip left / right
  const moveClip = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= clips.length) return;
    const updated = [...clips];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onClipsChange(updated);
  };

  // Adjust duration (+/- 1s)
  const adjustDuration = (index: number, delta: number) => {
    const updated = [...clips];
    const newDur = Math.max(3, Math.min(30, updated[index].duration + delta));
    updated[index] = { ...updated[index], duration: newDur };
    onClipsChange(updated);
  };

  // Duplicate clip
  const duplicateClip = (index: number) => {
    const original = clips[index];
    const cloned: VideoClip = {
      ...original,
      id: `clip-${Date.now()}`,
      title: `${original.title} (Copy)`,
    };
    const updated = [...clips];
    updated.splice(index + 1, 0, cloned);
    onClipsChange(updated);
    onSelectClip(cloned.id);
  };

  // Delete clip
  const deleteClip = (index: number) => {
    if (clips.length <= 1) {
      alert('Your film must have at least one scene clip.');
      return;
    }
    const updated = clips.filter((_, i) => i !== index);
    onClipsChange(updated);
    if (selectedClipId === clips[index].id) {
      onSelectClip(updated[0].id);
    }
  };

  // Change transition between clips
  const setTransition = (index: number, trans: TransitionType) => {
    const updated = [...clips];
    updated[index] = { ...updated[index], transition: trans };
    onClipsChange(updated);
  };

  // Add a blank/curated new clip
  const handleAddNewClip = () => {
    const newClip: VideoClip = {
      id: `clip-${Date.now()}`,
      title: `Scene ${clips.length + 1}: Continuation`,
      shotType: 'Cinematic Medium Shot',
      prompt: 'Cinematic continuation shot, 35mm lens, atmospheric rim lighting, ultra detailed',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      duration: 10,
      cameraMovement: 'dolly-in',
      transition: 'crossfade',
      transitionDuration: 0.8,
      voiceoverText: 'And in the quiet moments that followed, the horizon shifted forever.',
      subtitleText: 'Continuation',
      filter: {
        brightness: 1,
        contrast: 1.15,
        saturation: 1.15,
        filmGrain: 0.15,
        vignette: 0.35,
        colorGrade: 'anamorphic-35mm',
      },
      speed: 1,
    };
    onClipsChange([...clips, newClip]);
    onSelectClip(newClip.id);
  };

  // Scale entire timeline to target total duration
  const scaleToTargetDuration = (targetTotal: number) => {
    if (!clips.length || targetTotal <= 0) return;
    const currentTotal = clips.reduce((sum, c) => sum + c.duration, 0);
    if (currentTotal <= 0) return;
    const ratio = targetTotal / currentTotal;
    let accumulated = 0;
    const updated = clips.map((clip, idx) => {
      if (idx === clips.length - 1) {
        const remaining = Math.max(2, targetTotal - accumulated);
        return { ...clip, duration: remaining };
      }
      const newDur = Math.max(2, Math.round(clip.duration * ratio));
      accumulated += newDur;
      return { ...clip, duration: newDur };
    });
    onClipsChange(updated);
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative">
      {/* Auto-Animate Toast */}
      {autoAnimateToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-xl flex items-center gap-1.5 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{autoAnimateToast}</span>
        </div>
      )}

      {/* Header: Clip Joiner Status & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800/80 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-neutral-200 font-bold text-xs sm:text-sm font-['Space_Grotesk']">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>TIMELINE EDITOR & CLIP JOINER</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300">
              {clips.length} Clips Joined
            </span>
            <span
              className={`px-2 py-0.5 rounded border font-semibold ${
                totalDuration >= 60
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-800 text-amber-400'
              }`}
            >
              {totalDuration.toFixed(1)}s Total
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Duration Scaler */}
          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-mono">
            <span className="px-2 text-neutral-500 text-[10px] uppercase">Set Length:</span>
            {[30, 60, 90, 120].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => scaleToTargetDuration(d)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  Math.round(totalDuration) === d
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title={`Scale all clips so total duration is ${d}s`}
              >
                {d}s
              </button>
            ))}
          </div>

          {/* Auto-Animate & Animated Transitions Menu */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => handleAutoAssignTransitions('variety')}
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
              title="Automatically add animated transitions and camera movements"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>✨ Auto-Animate Transitions</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl p-1.5 shadow-2xl z-40 w-56 text-xs">
              <button
                type="button"
                onClick={() => handleAutoAssignTransitions('variety')}
                className="text-left px-2.5 py-1.5 hover:bg-neutral-900 rounded-lg text-neutral-200 hover:text-amber-400 transition"
              >
                ✨ Cinematic Variety (Film Burns, Leaks, Whip Pans)
              </button>
              <button
                type="button"
                onClick={() => handleAutoAssignTransitions('action')}
                className="text-left px-2.5 py-1.5 hover:bg-neutral-900 rounded-lg text-neutral-200 hover:text-amber-400 transition"
              >
                ⚡ Action Cuts (Whip Pan, Zoom Glitch, Blur)
              </button>
              <button
                type="button"
                onClick={() => handleAutoAssignTransitions('ambient')}
                className="text-left px-2.5 py-1.5 hover:bg-neutral-900 rounded-lg text-neutral-200 hover:text-amber-400 transition"
              >
                🌌 Ambient Cinema (Slow Dissolves & Light Leaks)
              </button>
            </div>
          </div>

          {/* Quick Add Media Buttons */}
          {onOpenAddMedia && (
            <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onOpenAddMedia('image')}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-900 text-xs transition"
                title="Add custom image or generate AI image"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Image</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAddMedia('video')}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-900 text-xs transition"
                title="Add custom video clip or video loop"
              >
                <VideoIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Video</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAddMedia('sound')}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-900 text-xs transition"
                title="Add soundtrack, record voiceover, or sound effects"
              >
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Sound</span>
              </button>
            </div>
          )}

          <button
            onClick={handleAddNewClip}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Shot</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Join & Export Video</span>
          </button>
        </div>
      </div>

      {/* TRACK 1: Video Clips Sequencer */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
          <span className="flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>VIDEO CLIPS TRACK</span>
          </span>
          <span className="text-[11px] text-neutral-500">
            Click a clip to inspect / trim • Click transition pills to modify
          </span>
        </div>

        {/* Scrollable Clips Sequence */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-neutral-950">
          {clips.map((clip, index) => {
            const isSelected = selectedClipId === clip.id;
            return (
              <React.Fragment key={clip.id}>
                {/* Clip Card */}
                <div
                  onClick={() => onSelectClip(clip.id)}
                  className={`relative flex-shrink-0 w-48 sm:w-56 rounded-xl border transition cursor-pointer overflow-hidden group select-none ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/40 bg-neutral-900 shadow-xl'
                      : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-900/60'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="h-24 w-full relative bg-neutral-900 overflow-hidden">
                    <img
                      src={clip.imageUrl}
                      alt={clip.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Clip Order Badge */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-amber-400 border border-neutral-700">
                      #{index + 1}
                    </div>

                    {/* Media Type Badge if video */}
                    {(clip.mediaType === 'video' || clip.videoUrl) && (
                      <div className="absolute top-2 left-10 px-1.5 py-0.5 rounded bg-blue-600/90 backdrop-blur-md text-[9px] font-mono font-bold text-white border border-blue-400">
                        VIDEO
                      </div>
                    )}

                    {/* Duration pill */}
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-white border border-neutral-700">
                      {clip.duration}s
                    </div>

                    {/* Camera Movement Tag */}
                    <div className="absolute bottom-2 left-2 text-[10px] text-neutral-300 font-mono truncate max-w-[85%]">
                      {clip.cameraMovement}
                    </div>
                  </div>

                  {/* Clip Info & In-Place Trimmer */}
                  <div className="p-2.5">
                    <h3 className="font-semibold text-xs text-neutral-200 truncate group-hover:text-amber-300">
                      {clip.title}
                    </h3>
                    <p className="text-[10px] text-neutral-400 truncate mb-2">
                      {clip.shotType}
                    </p>

                    {/* Clip Tool Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-neutral-400">
                      {/* Duration trimmer buttons */}
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustDuration(index, -1);
                          }}
                          className="w-5 h-5 rounded bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white"
                          title="Decrease duration by 1s"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-amber-400 font-semibold">
                          {clip.duration}s
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustDuration(index, 1);
                          }}
                          className="w-5 h-5 rounded bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white"
                          title="Increase duration by 1s"
                        >
                          +
                        </button>
                      </div>

                      {/* Reorder / Duplicate / Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveClip(index, 'left');
                          }}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                          title="Move Left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveClip(index, 'right');
                          }}
                          disabled={index === clips.length - 1}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                          title="Move Right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateClip(index);
                          }}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-400"
                          title="Duplicate Shot"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteClip(index);
                          }}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400"
                          title="Delete Clip"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transition Node Pill (between clips) */}
                {index < clips.length - 1 && (
                  <div className="flex flex-col items-center justify-center flex-shrink-0 px-1">
                    <select
                      value={clip.transition}
                      onChange={(e) => setTransition(index, e.target.value as TransitionType)}
                      className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-amber-300 rounded-lg px-2 py-1 text-[10px] font-mono focus:outline-none transition cursor-pointer"
                      title="Select Transition between clips"
                    >
                      {TRANSITION_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id} className="bg-neutral-950 text-white">
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[9px] text-neutral-600 mt-1 font-mono">0.8s</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Append Clip Button */}
          <button
            onClick={handleAddNewClip}
            className="flex-shrink-0 w-32 h-36 rounded-xl border border-dashed border-neutral-800 hover:border-amber-500/60 bg-neutral-950/40 hover:bg-neutral-900/60 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-amber-400 transition"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">Add Shot</span>
          </button>
        </div>
      </div>

      {/* TRACK 2 & 3: Audio Soundtrack & Voiceover Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-neutral-800/80">
        {/* Soundtrack Selector */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-mono text-neutral-300">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>CINEMATIC SOUNDTRACK</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                Web Audio Synth
              </span>
            </div>

            <select
              value={soundtrack}
              onChange={(e) => onSoundtrackChange(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50 mb-2.5"
            >
              {SOUNDTRACK_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} — {opt.mood}
                </option>
              ))}
            </select>
          </div>

          {onOpenAddMedia && (
            <div className="flex items-center gap-2 pt-1 border-t border-neutral-900 text-xs">
              <button
                type="button"
                onClick={() => onOpenAddMedia('sound')}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>Upload Custom Music</span>
              </button>
              <span className="text-neutral-700">•</span>
              <button
                type="button"
                onClick={() => onOpenAddMedia('sound')}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
              >
                <Volume2 className="w-3 h-3" />
                <span>Sound FX Library</span>
              </button>
            </div>
          )}
        </div>

        {/* Voiceover Dubbing Status */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-mono text-neutral-300 mb-1">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span>NARRATION & DIALOGUE DUBBING</span>
              </span>
              <p className="text-[11px] text-neutral-400">
                {clips.filter((c) => c.voiceoverText).length} of {clips.length} scenes voiced
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-neutral-500 block">Gemini 3.8 Flash TTS</span>
              <span className="text-xs font-bold text-amber-400">Fenrir Cinematic Voice</span>
            </div>
          </div>

          {onOpenAddMedia && (
            <div className="flex items-center gap-2 pt-1 border-t border-neutral-900 text-xs">
              <button
                type="button"
                onClick={() => onOpenAddMedia('sound')}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
              >
                <Mic className="w-3 h-3" />
                <span>Record Mic Voiceover</span>
              </button>
              <span className="text-neutral-700">•</span>
              <button
                type="button"
                onClick={() => onOpenAddMedia('sound')}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Generate TTS Narration</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
