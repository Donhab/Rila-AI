import React, { useState } from 'react';
import { Sparkles, Video, Wand2, Film, Clapperboard, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { CameraMovement, CinematicStyle, VideoClip } from '../types/video';
import { CAMERA_MOVEMENTS, CINEMATIC_STYLES } from '../data/cinematicPresets';
import { generateEpisodicStoryboard } from '../utils/storyboardGenerator';

interface PromptGeneratorProps {
  onAddGeneratedFilm: (title: string, clips: VideoClip[], style: CinematicStyle) => void;
  onAddSingleClip: (clip: VideoClip) => void;
  selectedStyle: CinematicStyle;
  onSelectStyle: (style: CinematicStyle) => void;
}

const SAMPLE_PROMPT_CHIPS = [
  'Cyberpunk detective pursuing a rogue AI through rain-soaked Neo Tokyo',
  'Astronaut discovering a glowing crystalline monolith on Titan',
  'Two twin-turbo sports cars racing through mountain pass hairpins at 2 AM',
  'Ancient samurai walking through a misty bamboo grove with falling crimson leaves',
  'Steampunk airship sailing into a massive electric thunderstorm over the Alps',
  'Mystical deep-sea research submarine encountering a bioluminescent leviathan',
];

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({
  onAddGeneratedFilm,
  onAddSingleClip,
  selectedStyle,
  onSelectStyle,
}) => {
  const [prompt, setPrompt] = useState('');
  const [generationMode, setGenerationMode] = useState<'film-60s' | 'single-clip'>('film-60s');
  const [selectedCamera, setSelectedCamera] = useState<CameraMovement>('dolly-in');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationStep, setGenerationStep] = useState<number>(0);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const activeStyleObj = CINEMATIC_STYLES.find((s) => s.id === selectedStyle);
      const res = await fetch('/api/gemini/prompt-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: activeStyleObj?.label || 'Cinematic Film',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.enhancedPrompt) {
          setPrompt(data.enhancedPrompt);
        }
        if (data.cameraMovement) {
          const matchCam = CAMERA_MOVEMENTS.find((c) =>
            data.cameraMovement.toLowerCase().includes(c.id.replace('-', ' '))
          );
          if (matchCam) setSelectedCamera(matchCam.id);
        }
      }
    } catch (e) {
      console.error('Enhance prompt failed:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerationStep(1);

    try {
      const activeStyle = CINEMATIC_STYLES.find((s) => s.id === selectedStyle) || CINEMATIC_STYLES[0];

      if (generationMode === 'film-60s') {
        // Multi-scene 60s+ episodic video generation
        setGenerationStatus('Rila AI Director crafting 6-scene episodic narrative arc (60s+)...');
        setGenerationStep(1);

        let storyboard: {
          title?: string;
          synopsis?: string;
          scenes?: {
            title?: string;
            shotType?: string;
            prompt?: string;
            cameraMovement?: string;
            duration?: number;
            voiceoverText?: string;
            soundEffect?: string;
            subtitleText?: string;
            imageUrl?: string;
          }[];
        } | null = null;

        try {
          const storyboardRes = await fetch('/api/gemini/storyboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              style: activeStyle.label,
              targetDuration: 60,
              sceneCount: 6,
            }),
          });

          if (storyboardRes.ok) {
            const data = await storyboardRes.json();
            if (data.scenes && data.scenes.length > 0) {
              storyboard = data;
            }
          }
        } catch (e) {
          console.warn('API storyboard call notice, using director engine:', e);
        }

        // Seamless built-in Rila Director Engine fallback if backend returns unconfigured or fails
        if (!storyboard || !storyboard.scenes || storyboard.scenes.length === 0) {
          setGenerationStatus('Rila AI Director designing episodic 6-scene cinematic arc...');
          storyboard = generateEpisodicStoryboard(prompt, selectedStyle);
        }

        const scenes = storyboard.scenes || [];
        setGenerationStatus(`Directing ${scenes.length} cinematic shots & camera choreography...`);
        setGenerationStep(2);

        // Generate visual frames and voiceovers for each scene
        const newClips: VideoClip[] = [];

        for (let i = 0; i < scenes.length; i++) {
          const sc = scenes[i];
          setGenerationStatus(`Synthesizing Visual Frame ${i + 1}/${scenes.length}: ${sc.title}...`);
          setGenerationStep(3);

          let imageUrl = sc.imageUrl || '';
          try {
            const frameRes = await fetch('/api/gemini/generate-frame', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: `${sc.prompt || prompt}, ${activeStyle.promptSuffix}`,
                aspectRatio: '16:9',
              }),
            });
            if (frameRes.ok) {
              const frameData = await frameRes.json();
              if (frameData.imageUrl) imageUrl = frameData.imageUrl;
            }
          } catch (e) {
            console.warn('Frame generation warning:', e);
          }

          if (!imageUrl) {
            imageUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80';
          }

          // Optional voiceover audio synthesis with Gemini TTS
          let voiceAudioUrl = '';
          if (sc.voiceoverText) {
            try {
              const speechRes = await fetch('/api/gemini/generate-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: sc.voiceoverText,
                  voiceName: 'Fenrir',
                  style: 'Cinematic narrator',
                }),
              });
              if (speechRes.ok) {
                const speechData = await speechRes.json();
                if (speechData.audioBase64) {
                  voiceAudioUrl = `data:audio/wav;base64,${speechData.audioBase64}`;
                }
              }
            } catch (err) {
              // TTS optional
            }
          }

          const transitions: VideoClip['transition'][] = ['crossfade', 'film-burn', 'wipe-left', 'zoom-glitch', 'dip-to-black'];
          const transitionType = i === scenes.length - 1 ? 'dip-to-black' : transitions[i % transitions.length];

          newClips.push({
            id: `clip-${Date.now()}-${i}`,
            title: sc.title || `Shot ${i + 1}`,
            shotType: sc.shotType || 'Cinematic Shot',
            prompt: sc.prompt || prompt,
            imageUrl,
            duration: sc.duration || 10,
            cameraMovement: (sc.cameraMovement as CameraMovement) || 'dolly-in',
            transition: transitionType,
            transitionDuration: 0.9,
            voiceoverText: sc.voiceoverText || '',
            voiceoverAudioUrl: voiceAudioUrl,
            soundEffect: sc.soundEffect || '',
            subtitleText: sc.subtitleText || sc.title?.split(':')[1]?.trim() || sc.title,
            filter: {
              brightness: 1,
              contrast: 1.15,
              saturation: 1.15,
              filmGrain: activeStyle.grain,
              vignette: 0.35,
              colorGrade: selectedStyle,
            },
            speed: 1,
          });
        }

        setGenerationStatus('Stitching clips into joined 60s+ timeline...');
        setGenerationStep(4);
        await new Promise((r) => setTimeout(r, 600));

        onAddGeneratedFilm(storyboard.title || 'Cinematic Epic', newClips, selectedStyle);
      } else {
        // Single clip generation
        setGenerationStatus('Generating cinematic single shot keyframe...');
        setGenerationStep(2);

        let imageUrl = '';
        try {
          const frameRes = await fetch('/api/gemini/generate-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `${prompt}, ${activeStyle.promptSuffix}`,
              aspectRatio: '16:9',
            }),
          });

          if (frameRes.ok) {
            const frameData = await frameRes.json();
            imageUrl = frameData.imageUrl;
          }
        } catch (e) {
          console.warn('Single frame call notice:', e);
        }

        if (!imageUrl) {
          imageUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80';
        }

        const newClip: VideoClip = {
          id: `clip-${Date.now()}`,
          title: prompt.slice(0, 30) + '...',
          shotType: 'Bespoke Shot',
          prompt,
          imageUrl,
          duration: 10,
          cameraMovement: selectedCamera,
          transition: 'crossfade',
          transitionDuration: 0.8,
          voiceoverText: prompt,
          filter: {
            brightness: 1,
            contrast: 1.15,
            saturation: 1.15,
            filmGrain: activeStyle.grain,
            vignette: 0.35,
            colorGrade: selectedStyle,
          },
          speed: 1,
        };

        onAddSingleClip(newClip);
      }
    } catch (err: unknown) {
      console.warn('Generation fallback activated:', err);
      // Emergency fallback generation so user is never blocked
      const fallback = generateEpisodicStoryboard(prompt, selectedStyle);
      const fallbackClips: VideoClip[] = fallback.scenes.map((s, idx) => ({
        id: `clip-${Date.now()}-${idx}`,
        title: s.title,
        shotType: s.shotType,
        prompt: s.prompt,
        imageUrl: s.imageUrl,
        duration: s.duration,
        cameraMovement: s.cameraMovement,
        transition: idx === fallback.scenes.length - 1 ? 'dip-to-black' : 'crossfade',
        transitionDuration: 0.8,
        voiceoverText: s.voiceoverText,
        subtitleText: s.subtitleText,
        soundEffect: s.soundEffect,
        filter: {
          brightness: 1,
          contrast: 1.15,
          saturation: 1.15,
          filmGrain: 0.15,
          vignette: 0.35,
          colorGrade: selectedStyle,
        },
        speed: 1,
      }));
      onAddGeneratedFilm(fallback.title, fallbackClips, selectedStyle);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      setGenerationStep(0);
    }
  };

  return (
    <div className="bg-neutral-900/90 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white font-['Space_Grotesk'] tracking-wide flex items-center gap-2">
              <span>Rila AI Video Generator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-semibold border border-amber-500/30">
                PROMPT STUDIO
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Insert your prompt below to create cinematic video clips with customizable styles
            </p>
          </div>
        </div>

        <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setGenerationMode('film-60s')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              generationMode === 'film-60s'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>60s+ Feature Film</span>
            <span className="text-[10px] bg-neutral-900/40 px-1.5 py-0.5 rounded ml-0.5">6 Scenes</span>
          </button>
          <button
            type="button"
            onClick={() => setGenerationMode('single-clip')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              generationMode === 'single-clip'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Single Shot (10s)</span>
          </button>
        </div>
      </div>

      {/* Prominent Prompt Insertion Space */}
      <div className="relative mb-3 z-10">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1.5 px-1">
          <span className="flex items-center gap-1.5 font-semibold text-amber-400 uppercase tracking-wider">
            <Film className="w-3.5 h-3.5" />
            <span>Insert Video Prompt Here</span>
          </span>
          {prompt.length > 0 && (
            <button
              type="button"
              onClick={() => setPrompt('')}
              className="text-neutral-500 hover:text-neutral-300 transition"
            >
              Clear
            </button>
          )}
        </div>

        <div className="relative rounded-2xl p-0.5 bg-gradient-to-r from-amber-500/50 via-orange-500/30 to-amber-500/50 focus-within:from-amber-400 focus-within:to-orange-400 shadow-lg shadow-amber-500/5 transition">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              generationMode === 'film-60s'
                ? 'Insert your prompt here... (e.g., "A lone cybernetic samurai standing on a rain-slicked skyscraper balcony looking over Neo-Tokyo at midnight" or "Deep space mission discovering a giant glowing crystalline monolith orbiting Saturn")'
                : 'Insert your single scene prompt here... (e.g., "Extreme macro close-up of a cybernetic eye reflecting streaming neon code")'
            }
            className="w-full bg-neutral-950 border-0 rounded-2xl px-4 py-3.5 text-sm sm:text-base text-neutral-100 placeholder:text-neutral-500 focus:outline-none resize-none transition leading-relaxed"
          />

          {/* Prompt Action Toolbar inside box */}
          <div className="flex items-center justify-between px-3 py-2 bg-neutral-950/80 rounded-b-2xl border-t border-neutral-900 text-xs">
            <span className="text-[11px] font-mono text-neutral-500">
              {prompt.length} characters • Powered by Rila AI & Gemini 3.8
            </span>

            {/* AI Prompt Enhancer Action */}
            <button
              type="button"
              onClick={handleEnhancePrompt}
              disabled={!prompt.trim() || isEnhancing || isGenerating}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-amber-300 hover:text-amber-200 disabled:opacity-40 disabled:pointer-events-none px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
              title="Enhance this prompt with Hollywood cinematic camera angles, lighting and lens direction"
            >
              {isEnhancing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isEnhancing ? 'Enhancing...' : '✨ Enhance with AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Inspiration Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none text-[11px] relative z-10">
        <span className="text-neutral-400 whitespace-nowrap text-[10px] font-mono uppercase tracking-wider font-semibold">
          Try Prompt:
        </span>
        {SAMPLE_PROMPT_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setPrompt(chip)}
            className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-300 hover:border-amber-500/40 transition text-xs font-medium"
          >
            {chip.slice(0, 42)}...
          </button>
        ))}
      </div>

      {/* Cinematic Style Selector Bar */}
      <div className="mb-4">
        <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
          Cinematic Style & Visual Grade
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {CINEMATIC_STYLES.map((st) => {
            const isSelected = selectedStyle === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onSelectStyle(st.id)}
                className={`flex flex-col text-left p-2 rounded-xl border transition relative overflow-hidden group ${
                  isSelected
                    ? 'border-amber-500 bg-neutral-900 shadow-md shadow-amber-500/10'
                    : 'border-neutral-800/80 bg-neutral-950/50 hover:bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <div
                  className="w-full h-1.5 rounded-full mb-1.5"
                  style={{ backgroundColor: st.color }}
                />
                <span className="font-semibold text-xs text-neutral-200 group-hover:text-white truncate">
                  {st.label.split(' ')[0]}
                </span>
                <span className="text-[10px] text-neutral-400 truncate">
                  {st.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Movement Selector (if single clip mode) */}
      {generationMode === 'single-clip' && (
        <div className="mb-4">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
            Camera Movement
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CAMERA_MOVEMENTS.map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => setSelectedCamera(cam.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                  selectedCamera === cam.id
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 font-semibold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generation Button & Live Director Terminal */}
      <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-neutral-400 flex items-center gap-2">
          {generationMode === 'film-60s' ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full 60s+ multi-scene narrative sequence with synced timeline</span>
            </span>
          ) : (
            <span>Generates an individual 10s shot clip to add to sequence</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:pointer-events-none text-neutral-950 font-extrabold px-6 py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/25 active:scale-[0.98]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
              <span>Directing Video...</span>
            </>
          ) : (
            <>
              <Film className="w-4 h-4" />
              <span>
                {generationMode === 'film-60s' ? 'Generate 60s+ Video with Rila AI' : 'Generate Shot with Rila AI'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Live AI Director Progress Console */}
      {isGenerating && (
        <div className="mt-4 p-3.5 bg-neutral-950 border border-amber-500/30 rounded-xl text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-amber-400 font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Rila AI Director Console
            </span>
            <span>Step {generationStep} / 4</span>
          </div>
          <p className="text-neutral-300">{generationStatus}</p>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${generationStep * 25}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
