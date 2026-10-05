import React, { useState } from 'react';
import {
  X,
  Camera,
  Film,
  Sparkles,
  Sliders,
  Volume2,
  Mic,
  Clock,
  RefreshCw,
  Loader2,
  Eye,
  Check,
} from 'lucide-react';
import { CameraMovement, CinematicStyle, TransitionType, VideoClip } from '../types/video';
import { CAMERA_MOVEMENTS, CINEMATIC_STYLES, TRANSITION_OPTIONS } from '../data/cinematicPresets';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface ClipInspectorProps {
  clip: VideoClip | null;
  onUpdateClip: (updated: VideoClip) => void;
  onClose: () => void;
  clipIndex: number;
}

export const ClipInspector: React.FC<ClipInspectorProps> = ({
  clip,
  onUpdateClip,
  onClose,
  clipIndex,
}) => {
  if (!clip) return null;

  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);

  const handleFieldChange = <K extends keyof VideoClip>(field: K, value: VideoClip[K]) => {
    onUpdateClip({ ...clip, [field]: value });
  };

  const handleFilterChange = (filterKey: keyof VideoClip['filter'], val: number | CinematicStyle) => {
    onUpdateClip({
      ...clip,
      filter: {
        ...clip.filter,
        [filterKey]: val,
      },
    });
  };

  // Regenerate visual frame with Gemini
  const handleRegenerateFrame = async () => {
    setIsRegeneratingImage(true);
    try {
      const res = await fetch('/api/gemini/generate-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: clip.prompt,
          aspectRatio: '16:9',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          handleFieldChange('imageUrl', data.imageUrl);
        }
      }
    } catch (e) {
      console.error('Frame regeneration failed:', e);
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  // Synthesize voiceover audio with Gemini TTS
  const handleSynthesizeSpeech = async () => {
    if (!clip.voiceoverText) return;
    setIsSynthesizingVoice(true);
    try {
      const res = await fetch('/api/gemini/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clip.voiceoverText,
          voiceName: 'Fenrir',
          style: 'Cinematic narrator',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const url = `data:audio/wav;base64,${data.audioBase64}`;
          handleFieldChange('voiceoverAudioUrl', url);
          audioSynthesizer.playVoiceover(url);
        }
      }
    } catch (e) {
      console.error('TTS speech failed:', e);
    } finally {
      setIsSynthesizingVoice(false);
    }
  };

  const handlePreviewVoice = () => {
    if (clip.voiceoverAudioUrl) {
      setIsPlayingAudioPreview(true);
      audioSynthesizer.playVoiceover(clip.voiceoverAudioUrl);
      setTimeout(() => setIsPlayingAudioPreview(false), 3000);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-neutral-950/95 border-l border-neutral-800 shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="h-16 border-b border-neutral-800 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white font-['Space_Grotesk'] uppercase tracking-wider">
            Clip Inspector #{clipIndex + 1}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body Scroll */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-neutral-300 scrollbar-thin scrollbar-thumb-neutral-800">
        {/* Frame Preview & Regenerate */}
        <div>
          <div className="relative rounded-xl overflow-hidden aspect-video bg-neutral-900 border border-neutral-800 mb-2">
            <img
              src={clip.imageUrl}
              alt={clip.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <span className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 border border-neutral-700">
              {clip.shotType}
            </span>
          </div>

          <button
            onClick={handleRegenerateFrame}
            disabled={isRegeneratingImage}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-amber-400 py-2 rounded-xl text-xs font-medium transition"
          >
            {isRegeneratingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isRegeneratingImage ? 'Synthesizing New Frame...' : 'Regenerate Scene Visual with AI'}</span>
          </button>
        </div>

        {/* Title & Shot Type */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Scene Title
            </label>
            <input
              type="text"
              value={clip.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Shot Classification
            </label>
            <input
              type="text"
              value={clip.shotType}
              onChange={(e) => handleFieldChange('shotType', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-neutral-100"
            />
          </div>
        </div>

        {/* Camera Movement */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Camera Movement Choreography</span>
          </label>
          <select
            value={clip.cameraMovement}
            onChange={(e) => handleFieldChange('cameraMovement', e.target.value as CameraMovement)}
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-neutral-100"
          >
            {CAMERA_MOVEMENTS.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.label} — {cam.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Duration & Speed */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Duration (sec)</span>
            </label>
            <input
              type="number"
              min={3}
              max={30}
              value={clip.duration}
              onChange={(e) => handleFieldChange('duration', Math.max(3, parseInt(e.target.value) || 10))}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-neutral-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Playback Speed
            </label>
            <select
              value={clip.speed || 1}
              onChange={(e) => handleFieldChange('speed', parseFloat(e.target.value))}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-neutral-100 font-mono"
            >
              <option value="0.5">0.5x Slow-Motion</option>
              <option value="0.75">0.75x Cinematic</option>
              <option value="1">1.0x Realtime</option>
              <option value="1.5">1.5x Fast</option>
              <option value="2">2.0x Timelapse</option>
            </select>
          </div>
        </div>

        {/* Transition To Next Clip */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
            Transition to Next Scene
          </label>
          <select
            value={clip.transition}
            onChange={(e) => handleFieldChange('transition', e.target.value as TransitionType)}
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-neutral-100"
          >
            {TRANSITION_OPTIONS.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.label} ({tr.desc})
              </option>
            ))}
          </select>
        </div>

        {/* Voiceover Narration & TTS */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>Voiceover Narration</span>
            </label>
            {clip.voiceoverAudioUrl && (
              <button
                type="button"
                onClick={handlePreviewVoice}
                className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" />
                <span>Play Voice</span>
              </button>
            )}
          </div>

          <textarea
            rows={2}
            value={clip.voiceoverText || ''}
            onChange={(e) => handleFieldChange('voiceoverText', e.target.value)}
            placeholder="Enter scene dialogue or voiceover narration line..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 resize-none focus:outline-none focus:border-amber-500"
          />

          <button
            type="button"
            onClick={handleSynthesizeSpeech}
            disabled={!clip.voiceoverText || isSynthesizingVoice}
            className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40"
          >
            {isSynthesizingVoice ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isSynthesizingVoice ? 'Synthesizing with Gemini TTS...' : 'Generate Voice Audio (Gemini TTS)'}</span>
          </button>
        </div>

        {/* Subtitle / Lower-Third Caption */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
            Lower-Third Location / Tagline
          </label>
          <input
            type="text"
            value={clip.subtitleText || ''}
            onChange={(e) => handleFieldChange('subtitleText', e.target.value)}
            placeholder="e.g. Sector 7 — 02:43 AM"
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-neutral-100"
          />
        </div>

        {/* Color Grading & Cinematic Filter Sliders */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-300 font-bold">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>COLOR GRADE & OPTICAL LOOK</span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>Color Grade Style</span>
            </div>
            <select
              value={clip.filter.colorGrade}
              onChange={(e) => handleFilterChange('colorGrade', e.target.value as CinematicStyle)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-100 text-xs"
            >
              {CINEMATIC_STYLES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Film Grain */}
          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>35mm Film Grain</span>
              <span className="font-mono text-amber-400">{Math.round((clip.filter.filmGrain || 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.02"
              value={clip.filter.filmGrain || 0}
              onChange={(e) => handleFilterChange('filmGrain', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Vignette */}
          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>Lens Vignetting</span>
              <span className="font-mono text-amber-400">{Math.round((clip.filter.vignette || 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.7"
              step="0.05"
              value={clip.filter.vignette || 0}
              onChange={(e) => handleFilterChange('vignette', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>Dynamic Contrast</span>
              <span className="font-mono text-amber-400">{clip.filter.contrast.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={clip.filter.contrast}
              onChange={(e) => handleFilterChange('contrast', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="h-16 border-t border-neutral-800 px-5 flex items-center justify-between">
        <span className="text-[11px] text-neutral-500 font-mono">Changes apply to live canvas</span>
        <button
          onClick={onClose}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs transition"
        >
          Done Editing
        </button>
      </div>
    </div>
  );
};
