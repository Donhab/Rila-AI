import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Mic,
  Volume2,
  Play,
  Pause,
  Sparkles,
  Plus,
  Check,
  Film,
  Loader2,
  RefreshCw,
  FolderOpen,
  Radio,
  Sliders,
} from 'lucide-react';
import { CameraMovement, CinematicStyle, TransitionType, VideoClip } from '../types/video';
import {
  STOCK_IMAGES,
  STOCK_VIDEOS,
  SOUND_EFFECTS,
  SOUNDTRACK_OPTIONS,
  CINEMATIC_STYLES,
  CAMERA_MOVEMENTS,
  TRANSITION_OPTIONS,
  StockMediaItem,
  SoundEffectItem,
} from '../data/cinematicPresets';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClip: (clip: VideoClip) => void;
  onReplaceSelectedVisual?: (url: string, isVideo?: boolean) => void;
  onSetCustomSoundtrack?: (url: string, name: string) => void;
  onAttachVoiceoverToSelected?: (audioUrl: string, text?: string) => void;
  onAttachSoundEffectToSelected?: (sfxId: string) => void;
  selectedClip: VideoClip | null;
  selectedStyle: CinematicStyle;
}

export const AddMediaModal: React.FC<AddMediaModalProps> = ({
  isOpen,
  onClose,
  onAddClip,
  onReplaceSelectedVisual,
  onSetCustomSoundtrack,
  onAttachVoiceoverToSelected,
  onAttachSoundEffectToSelected,
  selectedClip,
  selectedStyle,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'sound'>('image');
  const [imageSubTab, setImageSubTab] = useState<'upload' | 'ai' | 'stock'>('upload');
  const [videoSubTab, getVideoSubTab] = useState<'upload' | 'url' | 'stock'>('upload');
  const [soundSubTab, setSoundSubTab] = useState<'upload' | 'record' | 'sfx' | 'tts'>('upload');

  // Image Upload & AI state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [imageTitle, setImageTitle] = useState<string>('Custom Scene');
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [imageDuration, setImageDuration] = useState<number>(10);
  const [imageCamera, setImageCamera] = useState<CameraMovement>('dolly-in');
  const [imageTransition, setImageTransition] = useState<TransitionType>('film-burn');
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState<boolean>(false);
  const [targetAction, setTargetAction] = useState<'new-clip' | 'replace-active'>(
    selectedClip ? 'replace-active' : 'new-clip'
  );

  // Video Upload & URL state
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('Custom Video Scene');
  const [videoDuration, setVideoDuration] = useState<number>(10);
  const [videoCamera, setVideoCamera] = useState<CameraMovement>('dolly-in');
  const [videoTransition, setVideoTransition] = useState<TransitionType>('whip-pan');

  // Sound & Audio states
  const [customAudioUrl, setCustomAudioUrl] = useState<string>('');
  const [customAudioName, setCustomAudioName] = useState<string>('My Custom Soundtrack.mp3');
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);

  // Mic Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // TTS state
  const [ttsText, setTtsText] = useState<string>(selectedClip?.voiceoverText || '');
  const [isSynthesizingTts, setIsSynthesizingTts] = useState<boolean>(false);

  // Success indicator
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle local image file upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setUploadedImageUrl(result);
        setImageTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle local video file upload
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));

    // Detect duration if possible
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      if (tempVideo.duration && !isNaN(tempVideo.duration)) {
        setVideoDuration(Math.min(30, Math.round(tempVideo.duration)));
      }
    };
  };

  // Handle custom soundtrack file upload
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setCustomAudioName(file.name);
  };

  // AI Image generation using Gemini
  const handleGenerateAiFrame = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingAiImage(true);
    try {
      const activeStyleObj = CINEMATIC_STYLES.find((s) => s.id === selectedStyle) || CINEMATIC_STYLES[0];
      const res = await fetch('/api/gemini/generate-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${imagePrompt}, ${activeStyleObj.promptSuffix}`,
          aspectRatio: '16:9',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setUploadedImageUrl(data.imageUrl);
          setImageTitle(imagePrompt.slice(0, 30));
          showToast('AI Image successfully synthesized!');
        }
      }
    } catch (err) {
      console.error('AI frame generation error:', err);
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  // Apply Image (either as new scene clip or replacing active visual)
  const handleApplyImage = (urlToUse?: string, titleToUse?: string) => {
    const finalUrl = urlToUse || uploadedImageUrl;
    if (!finalUrl) return;

    if (targetAction === 'replace-active' && onReplaceSelectedVisual && selectedClip) {
      onReplaceSelectedVisual(finalUrl, false);
      showToast('Scene visual replaced with image!');
      onClose();
      return;
    }

    const newClip: VideoClip = {
      id: `clip-img-${Date.now()}`,
      title: titleToUse || imageTitle || 'New Image Scene',
      shotType: 'Cinematic Visual Shot',
      prompt: imagePrompt || titleToUse || 'Cinematic visual frame',
      imageUrl: finalUrl,
      mediaType: 'image',
      duration: imageDuration,
      cameraMovement: imageCamera,
      transition: imageTransition,
      transitionDuration: 0.9,
      voiceoverText: '',
      subtitleText: titleToUse || imageTitle,
      filter: {
        brightness: 1,
        contrast: 1.15,
        saturation: 1.15,
        filmGrain: 0.15,
        vignette: 0.35,
        colorGrade: selectedStyle,
      },
      speed: 1,
    };

    onAddClip(newClip);
    showToast('New image scene added to timeline with animated camera!');
    onClose();
  };

  // Apply Video (either as new scene clip or replacing active visual)
  const handleApplyVideo = (urlToUse?: string, titleToUse?: string, durationToUse?: number) => {
    const finalUrl = urlToUse || uploadedVideoUrl;
    if (!finalUrl) return;

    if (targetAction === 'replace-active' && onReplaceSelectedVisual && selectedClip) {
      onReplaceSelectedVisual(finalUrl, true);
      showToast('Scene visual replaced with video clip!');
      onClose();
      return;
    }

    const newClip: VideoClip = {
      id: `clip-vid-${Date.now()}`,
      title: titleToUse || videoTitle || 'Video Clip Scene',
      shotType: 'Motion Video Clip',
      prompt: titleToUse || videoTitle,
      imageUrl: finalUrl,
      videoUrl: finalUrl,
      mediaType: 'video',
      duration: durationToUse || videoDuration || 10,
      cameraMovement: videoCamera,
      transition: videoTransition,
      transitionDuration: 0.9,
      voiceoverText: '',
      subtitleText: titleToUse || videoTitle,
      filter: {
        brightness: 1,
        contrast: 1.1,
        saturation: 1.1,
        filmGrain: 0.1,
        vignette: 0.25,
        colorGrade: selectedStyle,
      },
      speed: 1,
    };

    onAddClip(newClip);
    showToast('New video clip scene added to timeline!');
    onClose();
  };

  // Start Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access denied or not available.');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Attach Mic Recording to Selected Clip
  const handleAttachRecordedVoice = () => {
    if (recordedAudioUrl && onAttachVoiceoverToSelected) {
      onAttachVoiceoverToSelected(recordedAudioUrl, 'Recorded Mic Narration');
      showToast('Microphone narration attached to active scene!');
      onClose();
    }
  };

  // Apply Custom Soundtrack
  const handleApplyCustomSoundtrack = () => {
    if (customAudioUrl && onSetCustomSoundtrack) {
      onSetCustomSoundtrack(customAudioUrl, customAudioName);
      audioSynthesizer.startSoundtrack('custom', customAudioUrl);
      showToast(`Custom soundtrack "${customAudioName}" activated!`);
      onClose();
    }
  };

  // Synthesize TTS
  const handleSynthesizeTts = async () => {
    if (!ttsText.trim()) return;
    setIsSynthesizingTts(true);
    try {
      const res = await fetch('/api/gemini/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsText,
          voiceName: 'Fenrir',
          style: 'Cinematic narrator',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
          if (onAttachVoiceoverToSelected) {
            onAttachVoiceoverToSelected(audioUrl, ttsText);
          }
          audioSynthesizer.playVoiceover(audioUrl);
          showToast('Gemini TTS voice narration attached to scene!');
          onClose();
        }
      }
    } catch (err) {
      console.error('TTS synthesis failed:', err);
    } finally {
      setIsSynthesizingTts(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Toast Alert */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-neutral-950 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top">
            <Check className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk'] tracking-wide">
                ADD MEDIA ASSETS & ANIMATIONS
              </h2>
              <p className="text-xs text-neutral-400">
                Insert custom images, videos, audio tracks, sound effects, or mic voiceovers into your film
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

        {/* Main Category Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'image'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Add Images</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'video'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <VideoIcon className="w-4 h-4" />
            <span>Add Video Clips</span>
          </button>

          <button
            onClick={() => setActiveTab('sound')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'sound'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Add Sounds & Voice</span>
          </button>
        </div>

        {/* Sub-Target Selector (New Clip vs Replace Selected Scene) */}
        {selectedClip && activeTab !== 'sound' && (
          <div className="bg-neutral-950/70 border-b border-neutral-800 px-5 py-2.5 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              Active Scene Selected: <strong className="text-white">#{selectedClip.title}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetAction('replace-active')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  targetAction === 'replace-active'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                Replace Active Scene Visual
              </button>
              <button
                type="button"
                onClick={() => setTargetAction('new-clip')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  targetAction === 'new-clip'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                + Add as New Timeline Scene
              </button>
            </div>
          </div>
        )}

        {/* Modal Body Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800">
          {/* TAB 1: ADD IMAGE */}
          {activeTab === 'image' && (
            <div className="space-y-5">
              {/* Image Subtabs */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImageSubTab('upload')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    imageSubTab === 'upload'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                  Upload Image File
                </button>

                <button
                  type="button"
                  onClick={() => setImageSubTab('ai')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    imageSubTab === 'ai'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
                  Generate AI Image
                </button>

                <button
                  type="button"
                  onClick={() => setImageSubTab('stock')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    imageSubTab === 'stock'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 inline mr-1.5" />
                  4K Cinema Stock Library
                </button>
              </div>

              {/* Subtab: Upload Image */}
              {imageSubTab === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-neutral-700 hover:border-amber-500/60 rounded-2xl p-6 text-center bg-neutral-950/40 hover:bg-neutral-900/40 transition">
                    <input
                      type="file"
                      id="image-file-input"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="image-file-input" className="cursor-pointer block">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-200 mb-1">
                        Click or drag image file here (PNG, JPG, WebP)
                      </p>
                      <p className="text-xs text-neutral-500">
                        Supports high resolution photos, concept art, and illustrations
                      </p>
                    </label>
                  </div>

                  {uploadedImageUrl && (
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center gap-4">
                      <img
                        src={uploadedImageUrl}
                        alt="Preview"
                        className="w-24 h-16 object-cover rounded-lg border border-neutral-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{imageTitle}</p>
                        <p className="text-[11px] text-emerald-400 font-mono">Image loaded & ready</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtab: AI Image Generator */}
              {imageSubTab === 'ai' && (
                <div className="space-y-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      AI Image Prompt
                    </label>
                    <textarea
                      rows={3}
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="e.g. Cyberpunk ronin standing in neon rain over a soaring skyscraper terrace, cinematic lighting..."
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAiFrame}
                    disabled={isGeneratingAiImage || !imagePrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50"
                  >
                    {isGeneratingAiImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Synthesizing Scene Visual with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Scene Image with Gemini</span>
                      </>
                    )}
                  </button>

                  {uploadedImageUrl && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800">
                      <img src={uploadedImageUrl} alt="Generated" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-amber-400 font-mono">
                        AI Generated
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtab: Stock Images */}
              {imageSubTab === 'stock' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {STOCK_IMAGES.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleApplyImage(item.url, item.title)}
                      className="group cursor-pointer rounded-xl border border-neutral-800 hover:border-amber-500/80 bg-neutral-950 overflow-hidden transition relative"
                    >
                      <div className="aspect-video relative overflow-hidden bg-neutral-900">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition" />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-400">
                          {item.category}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-neutral-200 group-hover:text-amber-300 truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-neutral-500">Click to use scene</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Animation & Camera Controls for new clip */}
              {targetAction === 'new-clip' && uploadedImageUrl && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Automatic Scene Animations</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Camera Motion</label>
                      <select
                        value={imageCamera}
                        onChange={(e) => setImageCamera(e.target.value as CameraMovement)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white"
                      >
                        {CAMERA_MOVEMENTS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Animated Transition</label>
                      <select
                        value={imageTransition}
                        onChange={(e) => setImageTransition(e.target.value as TransitionType)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white"
                      >
                        {TRANSITION_OPTIONS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Scene Duration</label>
                      <input
                        type="number"
                        min={3}
                        max={30}
                        value={imageDuration}
                        onChange={(e) => setImageDuration(Math.max(3, parseInt(e.target.value) || 10))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {uploadedImageUrl && (
                <button
                  type="button"
                  onClick={() => handleApplyImage()}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
                >
                  {targetAction === 'replace-active'
                    ? 'Replace Selected Scene Visual'
                    : 'Add Animated Image Scene to Timeline'}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: ADD VIDEO CLIPS */}
          {activeTab === 'video' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => getVideoSubTab('upload')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    videoSubTab === 'upload'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                  Upload Video File (MP4/WebM)
                </button>

                <button
                  type="button"
                  onClick={() => getVideoSubTab('url')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    videoSubTab === 'url'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
                  Video URL / Stream
                </button>

                <button
                  type="button"
                  onClick={() => getVideoSubTab('stock')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    videoSubTab === 'stock'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 inline mr-1.5" />
                  Cinematic Video Loops
                </button>
              </div>

              {/* Upload Video Subtab */}
              {videoSubTab === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-neutral-700 hover:border-amber-500/60 rounded-2xl p-6 text-center bg-neutral-950/40 hover:bg-neutral-900/40 transition">
                    <input
                      type="file"
                      id="video-file-input"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="video-file-input" className="cursor-pointer block">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                        <VideoIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-200 mb-1">
                        Upload Video Clip (MP4, WebM, MOV)
                      </p>
                      <p className="text-xs text-neutral-500">
                        Plays seamlessly in the canvas timeline with animated transitions and color grading
                      </p>
                    </label>
                  </div>

                  {uploadedVideoUrl && (
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center gap-4">
                      <video
                        src={uploadedVideoUrl}
                        className="w-28 h-18 object-cover rounded-lg border border-neutral-700"
                        muted
                        autoPlay
                        loop
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{videoTitle}</p>
                        <p className="text-[11px] text-emerald-400 font-mono">
                          Video synchronized • {videoDuration}s duration
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Video URL Subtab */}
              {videoSubTab === 'url' && (
                <div className="space-y-3 bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
                  <label className="block text-xs font-mono uppercase text-neutral-400">
                    Paste Direct Video URL (MP4 / WebM)
                  </label>
                  <input
                    type="url"
                    value={uploadedVideoUrl}
                    onChange={(e) => setUploadedVideoUrl(e.target.value)}
                    placeholder="https://example.com/cinematic-clip.mp4"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  {uploadedVideoUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden border border-neutral-800 mt-2">
                      <video src={uploadedVideoUrl} controls className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* Stock Video Loops Subtab */}
              {videoSubTab === 'stock' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {STOCK_VIDEOS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleApplyVideo(item.url, item.title, item.duration)}
                      className="group cursor-pointer rounded-xl border border-neutral-800 hover:border-amber-500/80 bg-neutral-950 overflow-hidden transition relative"
                    >
                      <div className="aspect-video relative overflow-hidden bg-neutral-900">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-amber-500/90 text-neutral-950 flex items-center justify-center">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                          {item.duration}s
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-neutral-200 group-hover:text-amber-300 truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-neutral-500">{item.category} • Click to insert</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Animation controls for video clip */}
              {uploadedVideoUrl && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Transition Animation</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Animated Transition</label>
                      <select
                        value={videoTransition}
                        onChange={(e) => setVideoTransition(e.target.value as TransitionType)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white"
                      >
                        {TRANSITION_OPTIONS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Clip Duration</label>
                      <input
                        type="number"
                        min={3}
                        max={30}
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(Math.max(3, parseInt(e.target.value) || 10))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {uploadedVideoUrl && (
                <button
                  type="button"
                  onClick={() => handleApplyVideo()}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
                >
                  {targetAction === 'replace-active'
                    ? 'Replace Selected Scene Visual'
                    : 'Add Video Scene to Timeline'}
                </button>
              )}
            </div>
          )}

          {/* TAB 3: ADD SOUNDS & AUDIO */}
          {activeTab === 'sound' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSoundSubTab('upload')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    soundSubTab === 'upload'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                  Upload Custom Audio Track
                </button>

                <button
                  type="button"
                  onClick={() => setSoundSubTab('record')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    soundSubTab === 'record'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
                  Record Mic Voiceover
                </button>

                <button
                  type="button"
                  onClick={() => setSoundSubTab('sfx')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    soundSubTab === 'sfx'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 inline mr-1.5" />
                  Cinematic Sound FX Library
                </button>

                <button
                  type="button"
                  onClick={() => setSoundSubTab('tts')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    soundSubTab === 'tts'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
                  Gemini TTS Voice
                </button>
              </div>

              {/* Subtab: Upload Custom Audio Track */}
              {soundSubTab === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-neutral-700 hover:border-amber-500/60 rounded-2xl p-6 text-center bg-neutral-950/40 hover:bg-neutral-900/40 transition">
                    <input
                      type="file"
                      id="audio-file-input"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="audio-file-input" className="cursor-pointer block">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                        <Music className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-200 mb-1">
                        Upload Custom Music or Soundtrack (MP3, WAV, AAC)
                      </p>
                      <p className="text-xs text-neutral-500">
                        Plays as the continuous background score mixed into the export stream
                      </p>
                    </label>
                  </div>

                  {customAudioUrl && (
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-semibold text-white">{customAudioName}</span>
                        </div>
                        <audio src={customAudioUrl} controls className="h-8" />
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyCustomSoundtrack}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-xl text-xs transition"
                      >
                        Set as Project Soundtrack
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Subtab: Record Mic Voiceover */}
              {soundSubTab === 'record' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-center space-y-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition mb-3 ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-500/20'
                          : 'bg-neutral-900 border border-neutral-800 text-amber-400'
                      }`}
                    >
                      <Mic className="w-8 h-8" />
                    </div>

                    <div className="font-mono text-xl font-bold text-white mb-1">
                      {Math.floor(recordingSeconds / 60)
                        .toString()
                        .padStart(2, '0')}
                      :{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </div>

                    <p className="text-xs text-neutral-400 mb-4">
                      {isRecording
                        ? 'Recording live audio from your microphone...'
                        : 'Record scene dialogue, voiceover narration, or atmospheric sounds'}
                    </p>

                    <div className="flex items-center gap-3">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-2"
                        >
                          <Mic className="w-4 h-4" />
                          <span>Start Recording</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition flex items-center gap-2"
                        >
                          <span>Stop Recording</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {recordedAudioUrl && !isRecording && (
                    <div className="pt-4 border-t border-neutral-800/80 space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <audio src={recordedAudioUrl} controls className="h-9" />
                      </div>

                      {selectedClip ? (
                        <button
                          type="button"
                          onClick={handleAttachRecordedVoice}
                          className="w-full max-w-sm mx-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-xl text-xs transition"
                        >
                          Attach Recorded Voiceover to Active Scene (#{selectedClip.title})
                        </button>
                      ) : (
                        <p className="text-xs text-amber-400">
                          Select a scene in the timeline to attach this voiceover!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab: Sound Effects Library */}
              {soundSubTab === 'sfx' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                    <span>HOLLYWOOD CINEMATIC SOUND FX</span>
                    <span>Click preview to hear procedural Web Audio</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SOUND_EFFECTS.map((sfx) => {
                      const isPlaying = playingSfxId === sfx.id;
                      return (
                        <div
                          key={sfx.id}
                          className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between hover:border-neutral-700 transition"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white truncate">
                                {sfx.label}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-amber-400 font-mono">
                                {sfx.duration}s
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                              {sfx.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setPlayingSfxId(sfx.id);
                                audioSynthesizer.playSoundEffect(sfx.id);
                                setTimeout(() => setPlayingSfxId(null), sfx.duration * 1000);
                              }}
                              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
                              title="Play preview"
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </button>

                            {selectedClip && onAttachSoundEffectToSelected && (
                              <button
                                type="button"
                                onClick={() => {
                                  onAttachSoundEffectToSelected(sfx.label);
                                  showToast(`Attached "${sfx.label}" to active scene!`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition"
                              >
                                Attach
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subtab: TTS Voice Narration */}
              {soundSubTab === 'tts' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Narration Dialogue Text (Fenrir Cinematic Voice)
                    </label>
                    <textarea
                      rows={3}
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder="Enter dramatic dialogue or film narration for the scene..."
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSynthesizeTts}
                    disabled={isSynthesizingTts || !ttsText.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50"
                  >
                    {isSynthesizingTts ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Synthesizing Voice Audio with Gemini TTS...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Synthesize & Attach Voiceover</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>High-Definition Canvas Renderer & Procedural Web Audio Synced</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
