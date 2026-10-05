import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { PromptGenerator } from './components/PromptGenerator';
import { VideoPlayer } from './components/VideoPlayer';
import { TimelineEditor } from './components/TimelineEditor';
import { ClipInspector } from './components/ClipInspector';
import { ExportModal } from './components/ExportModal';
import { TemplatesModal } from './components/TemplatesModal';
import { AspectRatio, CinematicStyle, VideoClip } from './types/video';
import { SAMPLE_PROJECTS, PrebuiltProject } from './data/cinematicPresets';
import { cinematicRenderer } from './utils/cinematicRenderer';
import { Sparkles, SlidersHorizontal, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Initial default project: 62s Cyberpunk Neon Odyssey with 6 sequential scenes
  const defaultProject = SAMPLE_PROJECTS[0];

  const [projectTitle, setProjectTitle] = useState<string>(defaultProject.title);
  const [clips, setClips] = useState<VideoClip[]>(defaultProject.clips);
  const [selectedStyle, setSelectedStyle] = useState<CinematicStyle>(defaultProject.style);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultProject.aspectRatio);
  const [soundtrack, setSoundtrack] = useState<string>('cyberpunk-synth');

  // Player state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Inspector & Modal states
  const [selectedClipId, setSelectedClipId] = useState<string | null>(defaultProject.clips[0].id);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState<boolean>(false);

  const totalDuration = cinematicRenderer.getTotalDuration(clips);

  // Load a generated 60s+ episodic film from PromptGenerator
  const handleAddGeneratedFilm = (title: string, newClips: VideoClip[], style: CinematicStyle) => {
    setProjectTitle(title);
    setClips(newClips);
    setSelectedStyle(style);
    setCurrentTime(0);
    setIsPlaying(true);
    if (newClips.length > 0) {
      setSelectedClipId(newClips[0].id);
    }
  };

  // Add single clip to timeline
  const handleAddSingleClip = (newClip: VideoClip) => {
    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  // Select prebuilt template project
  const handleSelectProject = (project: PrebuiltProject) => {
    setProjectTitle(project.title);
    setClips(project.clips);
    setSelectedStyle(project.style);
    setAspectRatio(project.aspectRatio);
    setCurrentTime(0);
    setIsPlaying(false);
    if (project.clips.length > 0) {
      setSelectedClipId(project.clips[0].id);
    }
    // Set appropriate default soundtrack for template
    if (project.id.includes('cyberpunk')) setSoundtrack('cyberpunk-synth');
    else if (project.id.includes('space') || project.id.includes('titan')) setSoundtrack('epic-orchestral');
    else if (project.id.includes('race') || project.id.includes('drift')) setSoundtrack('tension-pulse');
  };

  // Update a single clip from Inspector
  const handleUpdateClip = (updated: VideoClip) => {
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;
  const selectedClipIndex = clips.findIndex((c) => c.id === selectedClipId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-amber-500 selection:text-black">
      {/* Top Studio Navbar */}
      <Navbar
        title={projectTitle}
        onTitleChange={setProjectTitle}
        totalDuration={totalDuration}
        clipCount={clips.length}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Main Studio Workspace */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl mx-auto w-full space-y-5">
        {/* Top Feature Banner & Verification Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-neutral-200">
              Rila AI Video Generator • 60s+ Multi-Scene Cinematic Engine Active
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300">
              Style: <strong className="text-amber-400 font-semibold">{selectedStyle}</strong>
            </span>
            <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300">
              Aspect: <strong className="text-amber-400 font-semibold">{aspectRatio}</strong>
            </span>
            <span className="bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded text-emerald-400 font-bold">
              Duration: {totalDuration.toFixed(1)}s (≥ 60s Feature)
            </span>
          </div>
        </div>

        {/* Space to Insert Prompt: Rila AI Video Generator */}
        <PromptGenerator
          onAddGeneratedFilm={handleAddGeneratedFilm}
          onAddSingleClip={handleAddSingleClip}
          selectedStyle={selectedStyle}
          onSelectStyle={setSelectedStyle}
        />

        {/* Video Preview Player */}
        <VideoPlayer
          clips={clips}
          aspectRatio={aspectRatio}
          currentTime={currentTime}
          onTimeUpdate={setCurrentTime}
          isPlaying={isPlaying}
          onPlayPauseToggle={setIsPlaying}
          soundtrack={soundtrack}
          selectedClipId={selectedClipId}
          onSelectClip={(id) => {
            setSelectedClipId(id);
            setIsInspectorOpen(true);
          }}
        />

        {/* Multi-Track Timeline & Clip Joiner */}
        <TimelineEditor
          clips={clips}
          onClipsChange={setClips}
          selectedClipId={selectedClipId}
          onSelectClip={(id) => {
            setSelectedClipId(id);
            setIsInspectorOpen(true);
          }}
          currentTime={currentTime}
          onSeek={(time) => {
            setCurrentTime(time);
          }}
          soundtrack={soundtrack}
          onSoundtrackChange={setSoundtrack}
          onOpenExport={() => setIsExportModalOpen(true)}
        />
      </main>

      {/* Slide-in Clip Inspector Drawer */}
      {isInspectorOpen && selectedClip && (
        <ClipInspector
          clip={selectedClip}
          onUpdateClip={handleUpdateClip}
          onClose={() => setIsInspectorOpen(false)}
          clipIndex={selectedClipIndex >= 0 ? selectedClipIndex : 0}
        />
      )}

      {/* High-Definition Export & Social Sharing Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        clips={clips}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        soundtrack={soundtrack}
        projectTitle={projectTitle}
      />

      {/* Prebuilt 60s+ Starter Films Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectProject={handleSelectProject}
      />
    </div>
  );
}
