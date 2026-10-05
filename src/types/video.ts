export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9';

export type CinematicStyle = 
  | 'anamorphic-35mm'
  | 'cyberpunk-neon'
  | 'imax-photoreal'
  | 'vintage-70s'
  | 'studio-ghibli'
  | 'sci-fi-dystopia'
  | 'wes-anderson'
  | 'noir-monochrome'
  | 'dark-fantasy';

export type CameraMovement = 
  | 'dolly-in'
  | 'dolly-out'
  | 'pan-left'
  | 'pan-right'
  | 'tilt-up'
  | 'tilt-down'
  | 'orbit-cw'
  | 'tracking-forward'
  | 'drone-crane'
  | 'static-tripod';

export type TransitionType = 
  | 'crossfade'
  | 'dip-to-black'
  | 'dip-to-white'
  | 'wipe-left'
  | 'zoom-glitch'
  | 'film-burn'
  | 'cut';

export interface VideoClip {
  id: string;
  title: string;
  shotType: string;
  prompt: string;
  imageUrl: string;
  duration: number; // in seconds, default 6-12s
  cameraMovement: CameraMovement;
  transition: TransitionType;
  transitionDuration: number; // e.g. 0.8s
  voiceoverText?: string;
  voiceoverAudioUrl?: string;
  soundEffect?: string;
  subtitleText?: string;
  filter: {
    brightness: number;
    contrast: number;
    saturation: number;
    filmGrain: number;
    vignette: number;
    colorGrade: CinematicStyle;
  };
  speed: number; // 0.5 to 2.0
}

export interface AudioTrackConfig {
  soundtrack: string; // 'epic-orchestral' | 'cyberpunk-synth' | 'ambient-space' | 'cinema-piano' | 'tension-pulse' | 'none'
  musicVolume: number; // 0 - 1
  voiceVolume: number; // 0 - 1
  sfxVolume: number; // 0 - 1
}

export interface ProjectSettings {
  title: string;
  aspectRatio: AspectRatio;
  style: CinematicStyle;
  targetDuration: number; // e.g. 60 or 90 seconds
  fps: number; // 30 or 60
  resolution: '720p' | '1080p' | '4k';
  author?: string;
}

export interface StoryboardSceneResponse {
  title: string;
  synopsis: string;
  targetDuration: number;
  scenes: {
    title: string;
    shotType: string;
    prompt: string;
    cameraMovement: CameraMovement;
    duration: number;
    voiceoverText: string;
    soundEffect: string;
    visualDirection: string;
  }[];
}
