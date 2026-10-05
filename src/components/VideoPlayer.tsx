import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SlidersHorizontal,
  Subtitles,
  Gauge,
  Film,
  Camera,
  Layers,
} from 'lucide-react';
import { AspectRatio, VideoClip } from '../types/video';
import { cinematicRenderer } from '../utils/cinematicRenderer';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface VideoPlayerProps {
  clips: VideoClip[];
  aspectRatio: AspectRatio;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onPlayPauseToggle: (playing: boolean) => void;
  soundtrack: string;
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  clips,
  aspectRatio,
  currentTime,
  onTimeUpdate,
  isPlaying,
  onPlayPauseToggle,
  soundtrack,
  selectedClipId,
  onSelectClip,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastActiveClipIdRef = useRef<string>('');

  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showAudioControls, setShowAudioControls] = useState(false);

  const totalDuration = cinematicRenderer.getTotalDuration(clips);

  // Preload images whenever clips change
  useEffect(() => {
    cinematicRenderer.preloadClipImages(clips);
  }, [clips]);

  // Audio start / stop when isPlaying changes
  useEffect(() => {
    if (isPlaying) {
      audioSynthesizer.init();
      if (!isMuted) {
        audioSynthesizer.startSoundtrack(soundtrack);
      }
    } else {
      audioSynthesizer.stopSoundtrack();
      audioSynthesizer.stopVoiceover();
    }
    return () => {
      audioSynthesizer.stopSoundtrack();
      audioSynthesizer.stopVoiceover();
    };
  }, [isPlaying, soundtrack, isMuted]);

  // Main animation render loop
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying && totalDuration > 0) {
        const nextTime = currentTime + dt * playbackSpeed;
        if (nextTime >= totalDuration) {
          onTimeUpdate(0);
          onPlayPauseToggle(false);
        } else {
          onTimeUpdate(nextTime);
        }
      }

      // Check for clip change to trigger transition SFX & voiceover
      if (isPlaying && clips.length > 0) {
        const active = cinematicRenderer.getActiveClipAtTime(clips, currentTime);
        if (active && active.currentClip.id !== lastActiveClipIdRef.current) {
          lastActiveClipIdRef.current = active.currentClip.id;
          if (!isMuted) {
            audioSynthesizer.playTransitionSFX(active.currentClip.transition);
            if (active.currentClip.voiceoverAudioUrl) {
              audioSynthesizer.playVoiceover(active.currentClip.voiceoverAudioUrl);
            }
          }
        }
      }

      // Render frame
      if (canvasRef.current) {
        cinematicRenderer.renderFrame(
          canvasRef.current,
          clips,
          currentTime,
          aspectRatio,
          showSubtitles
        );
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentTime, totalDuration, playbackSpeed, clips, aspectRatio, showSubtitles, isMuted, onTimeUpdate, onPlayPauseToggle]);

  // Spacebar play/pause shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        onPlayPauseToggle(!isPlaying);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onPlayPauseToggle]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = pos * totalDuration;
    onTimeUpdate(seekTime);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      audioSynthesizer.stopSoundtrack();
      audioSynthesizer.stopVoiceover();
    } else if (isPlaying) {
      audioSynthesizer.startSoundtrack(soundtrack);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTimecode = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Determine container aspect ratio class
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[580px] max-w-[340px]';
      case '1:1':
        return 'aspect-square max-h-[520px] max-w-[520px]';
      case '21:9':
        return 'aspect-[21/9] max-h-[480px] w-full max-w-[850px]';
      case '16:9':
      default:
        return 'aspect-video max-h-[520px] w-full max-w-[820px]';
    }
  };

  const activeInfo = cinematicRenderer.getActiveClipAtTime(clips, currentTime);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-3 sm:p-4 backdrop-blur-md relative select-none"
    >
      {/* Aspect Ratio Framing Box */}
      <div className={`relative mx-auto rounded-xl overflow-hidden bg-black shadow-2xl border border-neutral-800/80 flex items-center justify-center ${getAspectRatioClasses()}`}>
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          onClick={() => onPlayPauseToggle(!isPlaying)}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Top Overlay Badge: Active Shot & Camera Motion */}
        {activeInfo && (
          <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
            <span className="bg-black/75 backdrop-blur-md border border-neutral-700/60 text-neutral-200 px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 shadow">
              <Film className="w-3 h-3 text-amber-400" />
              <span>{activeInfo.currentClip.title}</span>
            </span>
            <span className="bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 shadow">
              <Camera className="w-2.5 h-2.5" />
              <span>{activeInfo.currentClip.cameraMovement.replace('-', ' ')}</span>
            </span>
          </div>
        )}

        {/* Transitioning Indicator */}
        {activeInfo && activeInfo.transitionProgress !== null && (
          <div className="absolute top-3 right-3 bg-red-500/20 border border-red-500/40 text-red-300 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider backdrop-blur-md animate-pulse">
            TRANSITION: {activeInfo.currentClip.transition.toUpperCase()}
          </div>
        )}

        {/* Big Center Play Button Overlay on Pause */}
        {!isPlaying && (
          <button
            onClick={() => onPlayPauseToggle(true)}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-amber-500/90 hover:bg-amber-400 text-neutral-950 flex items-center justify-center shadow-2xl shadow-amber-500/40 transition hover:scale-105 active:scale-95"
            aria-label="Play Video"
          >
            <Play className="w-8 h-8 fill-neutral-950 ml-1" />
          </button>
        )}
      </div>

      {/* Scrubber Timeline Bar */}
      <div className="w-full max-w-[850px] mt-3">
        <div
          onClick={handleSeek}
          className="h-2.5 bg-neutral-900 rounded-full cursor-pointer relative overflow-hidden group border border-neutral-800"
        >
          {/* Clip segments marks */}
          {clips.map((clip, i) => {
            const startRatio = clips.slice(0, i).reduce((s, c) => s + c.duration, 0) / (totalDuration || 1);
            return (
              <div
                key={clip.id}
                className="absolute top-0 bottom-0 w-px bg-neutral-700/80 z-10"
                style={{ left: `${startRatio * 100}%` }}
              />
            );
          })}

          {/* Progress Bar Fill */}
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 rounded-full relative"
            style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
          </div>
        </div>
      </div>

      {/* Video Control Bar */}
      <div className="w-full max-w-[850px] mt-2 flex items-center justify-between gap-3 text-neutral-300">
        {/* Left: Play/Pause, Rewind, Timecode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPlayPauseToggle(!isPlaying)}
            className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-amber-400 hover:text-white transition active:scale-95"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => onTimeUpdate(0)}
            className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-200 transition"
            title="Rewind to start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="font-mono text-xs text-neutral-400 ml-1.5 flex items-center gap-1">
            <span className="text-white font-semibold">{formatTimecode(currentTime)}</span>
            <span className="text-neutral-600">/</span>
            <span>{formatTimecode(totalDuration)}</span>
          </div>
        </div>

        {/* Right Controls: Speed, Subtitles, Volume, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Speed Button */}
          <button
            onClick={() => {
              const speeds = [0.5, 1, 1.5, 2];
              const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
              setPlaybackSpeed(speeds[nextIdx]);
            }}
            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono font-medium text-neutral-300 transition"
            title="Playback Speed"
          >
            {playbackSpeed}x
          </button>

          {/* Subtitles Toggle */}
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
              showSubtitles
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}
            title="Toggle Subtitles & Narration"
          >
            <Subtitles className="w-3.5 h-3.5" />
          </button>

          {/* Audio Mute & Volume */}
          <button
            onClick={toggleMute}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
              isMuted
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
