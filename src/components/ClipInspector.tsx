import React, { useState, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
} from 'lucide-react';
import { CameraMovement, CinematicStyle, TransitionType, VideoClip } from '../types/video';
import { CAMERA_MOVEMENTS, CINEMATIC_STYLES, TRANSITION_OPTIONS, SOUND_EFFECTS } from '../data/cinematicPresets';
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
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<number | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

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

  // Replace image from user file
  const handleUploadLocalImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (url) {
        onUpdateClip({
          ...clip,
          imageUrl: url,
          mediaType: 'image',
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Replace video from user file
  const handleUploadLocalVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdateClip({
      ...clip,
      videoUrl: url,
      imageUrl: url,
      mediaType: 'video',
      title: file.name.replace(/\.[^/.]+$/, ''),
    });
  };

  // In-drawer Mic voiceover recorder
  const startRecordingMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        handleFieldChange('voiceoverAudioUrl', url);
        if (!clip.voiceoverText) handleFieldChange('voiceoverText', 'Recorded voice narration');
      };
      mr.start();
      setIsRecordingMic(true);
      setRecSeconds(0);
      recTimerRef.current = window.setInterval(() => {
        setRecSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert('Microphone access denied or unavailable.');
    }
  };

  const stopRecordingMic = () => {
    if (mediaRecorderRef.current && isRecordingMic) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecordingMic(false);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    }
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
          handleFieldChange('mediaType', 'image');
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

  const isVideo = clip.mediaType === 'video' || Boolean(clip.videoUrl);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-neutral-950/95 border-l border-neutral-800 shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="h-16 border-b border-neutral-800 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white font-['Space_Grotesk'] uppercase tracking-wider">
            Clip Inspector #{clipIndex + 1}
          </h2>
          {isVideo && (
            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-[9px] font-mono font-bold text-white">
              VIDEO
            </span>
          )}
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
        {/* Frame / Video Preview & Replacement */}
        <div>
          <div className="relative rounded-xl overflow-hidden aspect-video bg-neutral-900 border border-neutral-800 mb-2">
            {isVideo ? (
              <video
                src={clip.videoUrl || clip.imageUrl}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={clip.imageUrl}
                alt={clip.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <span className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 border border-neutral-700">
              {clip.shotType}
            </span>
          </div>

          {/* Hidden inputs for uploading replacement media */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            onChange={handleUploadLocalImage}
            className="hidden"
          />
          <input
            type="file"
            ref={videoInputRef}
            accept="video/*"
            onChange={handleUploadLocalVideo}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white py-1.5 rounded-lg text-[11px] transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Replace Image</span>
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white py-1.5 rounded-lg text-[11px] transition"
            >
              <VideoIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Replace Video</span>
            </button>
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
          <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Animated Transition to Next Scene</span>
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

        {/* Sound Design Effect */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Sound Design Cue / SFX</span>
            </label>
            {clip.soundEffect && (
              <button
                type="button"
                onClick={() => audioSynthesizer.playSoundEffect('impact-boom')}
                className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Test SFX</span>
              </button>
            )}
          </div>
          <select
            value={clip.soundEffect || 'impact-boom'}
            onChange={(e) => handleFieldChange('soundEffect', e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-neutral-100 text-xs mb-1"
          >
            {SOUND_EFFECTS.map((s) => (
              <option key={s.id} value={s.label}>
                {s.label} ({s.category})
              </option>
            ))}
          </select>
        </div>

        {/* Voiceover Narration & Mic Recorder */}
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

          <div className="grid grid-cols-2 gap-2">
            {!isRecordingMic ? (
              <button
                type="button"
                onClick={startRecordingMic}
                className="flex items-center justify-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 py-1.5 rounded-lg text-xs font-medium transition"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Record Mic</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecordingMic}
                className="flex items-center justify-center gap-1.5 bg-red-600 text-white animate-pulse py-1.5 rounded-lg text-xs font-bold transition"
              >
                <span>Stop Rec ({recSeconds}s)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSynthesizeSpeech}
              disabled={!clip.voiceoverText || isSynthesizingVoice}
              className="flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40"
            >
              {isSynthesizingVoice ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Gemini TTS</span>
            </button>
          </div>
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
              max="0.5"
              step="0.02"
              value={clip.filter.filmGrain || 0}
              onChange={(e) => handleFilterChange('filmGrain', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Vignette */}
          <div>
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
              <span>Vignette Edge Falloff</span>
              <span className="font-mono text-amber-400">{Math.round((clip.filter.vignette || 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={clip.filter.vignette || 0}
              onChange={(e) => handleFilterChange('vignette', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
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
