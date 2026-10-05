import { AspectRatio, CameraMovement, CinematicStyle, TransitionType, VideoClip } from '../types/video';

export interface StyleOption {
  id: CinematicStyle;
  label: string;
  tagline: string;
  badge: string;
  promptSuffix: string;
  color: string;
  bgGradient: string;
  grain: number;
}

export const CINEMATIC_STYLES: StyleOption[] = [
  {
    id: 'anamorphic-35mm',
    label: '35mm Anamorphic Film',
    tagline: 'Panavision lens flares, organic silver grain, rich Kodak tones',
    badge: 'Hollywood 35mm',
    promptSuffix: 'cinematic 35mm anamorphic film photography, Panavision C-series lens, horizontal blue streak flare, fine 35mm film grain, 8k resolution, Kodak Vision3 500T, cinematic lighting, color graded, shot by Roger Deakins',
    color: '#f59e0b',
    bgGradient: 'from-amber-950/80 via-neutral-900 to-black',
    grain: 0.18,
  },
  {
    id: 'cyberpunk-neon',
    label: 'Cyberpunk Neo-Noir',
    tagline: 'Volumetric rain, neon reflections, deep cyan & magenta glow',
    badge: 'Blade Runner',
    promptSuffix: 'cyberpunk aesthetic, rainy neon-lit night, volumetric fog, vibrant cyan and magenta neon lighting, reflective asphalt, high tech low life, cinematic wide shot, ultra detailed, photorealistic',
    color: '#06b6d4',
    bgGradient: 'from-cyan-950/80 via-purple-950/50 to-black',
    grain: 0.15,
  },
  {
    id: 'imax-photoreal',
    label: 'IMAX 70mm Hyper-Real',
    tagline: 'Staggering 8K clarity, lifelike atmospheric depth, golden hour',
    badge: 'IMAX 70mm',
    promptSuffix: 'shot on 70mm IMAX camera, Arri Alexa 65, hyper-detailed, crystal clear textures, natural golden hour rim light, photorealistic, cinematic composition, award-winning cinematography',
    color: '#10b981',
    bgGradient: 'from-emerald-950/80 via-neutral-900 to-black',
    grain: 0.05,
  },
  {
    id: 'vintage-70s',
    label: '70s Super-8 Grindhouse',
    tagline: 'Warm sepia nostalgia, heavy film stock, optical chromatic aberration',
    badge: 'Super-8 Retro',
    promptSuffix: '1970s vintage Kodachrome film stock, Super 8mm aesthetic, warm amber glow, lens aberration, nostalgic vintage cinematography, slight vignetting, retro film look',
    color: '#ea580c',
    bgGradient: 'from-orange-950/80 via-stone-900 to-black',
    grain: 0.35,
  },
  {
    id: 'studio-ghibli',
    label: 'Ghibli / Shinkai Anime',
    tagline: 'Painterly cumulus clouds, emotional lighting, hand-drawn warmth',
    badge: 'Anime Cinema',
    promptSuffix: 'cinematic anime movie still, Makoto Shinkai and Studio Ghibli style, magnificent skies, volumetric sunlight beams, painterly rich details, emotional vibrant colors, masterpiece',
    color: '#38bdf8',
    bgGradient: 'from-sky-950/80 via-blue-950/50 to-black',
    grain: 0.08,
  },
  {
    id: 'sci-fi-dystopia',
    label: 'Brutalist Sci-Fi',
    tagline: 'Dune-inspired grandeur, monolithic structures, desert dust storm',
    badge: 'Denis Villeneuve',
    promptSuffix: 'epic sci-fi film still directed by Denis Villeneuve, brutalist monolithic scale, atmospheric haze, muted color palette with burning orange accents, cinematic framing, 8k render',
    color: '#d97706',
    bgGradient: 'from-yellow-950/80 via-neutral-900 to-black',
    grain: 0.12,
  },
  {
    id: 'wes-anderson',
    label: 'Wes Anderson Pastel',
    tagline: 'Strict symmetrical framing, pastel palette, whimsical storybook',
    badge: 'Symmetrical',
    promptSuffix: 'directed by Wes Anderson, perfectly symmetrical composition, pastel color palette, whimsical vintage prop details, flat perspective, 35mm film still, art cinema',
    color: '#ec4899',
    bgGradient: 'from-pink-950/80 via-amber-950/30 to-black',
    grain: 0.1,
  },
  {
    id: 'noir-monochrome',
    label: 'Dark Noir Monochrome',
    tagline: 'High contrast black and white, venetian blind shadows, trenchcoats',
    badge: '1940s Noir',
    promptSuffix: '1940s classic film noir still, stark black and white high contrast, chiaroscuro lighting, venetian blind shadows, dramatic silhouetted figures, cigarette smoke, film grain',
    color: '#a3a3a3',
    bgGradient: 'from-neutral-800 via-neutral-900 to-black',
    grain: 0.25,
  },
  {
    id: 'dark-fantasy',
    label: 'Dark Fantasy Baroque',
    tagline: 'Eldritch ruins, torchlight chiaroscuro, gothic fog and gilded armor',
    badge: 'Dark Fantasy',
    promptSuffix: 'dark fantasy cinematic still, Elden Ring aesthetic, gothic cathedral architecture, torchlight shadows, heavy mist, ornate engraved plate armor, dramatic mystical atmosphere',
    color: '#a855f7',
    bgGradient: 'from-purple-950/80 via-neutral-900 to-black',
    grain: 0.18,
  },
];

export const CAMERA_MOVEMENTS: { id: CameraMovement; label: string; desc: string }[] = [
  { id: 'dolly-in', label: 'Dolly In', desc: 'Smooth slow push towards focal subject' },
  { id: 'dolly-out', label: 'Dolly Out', desc: 'Slow reveal pulling away into expansive scene' },
  { id: 'pan-right', label: 'Pan Right', desc: 'Cinematic horizontal sweep across vista' },
  { id: 'pan-left', label: 'Pan Left', desc: 'Sweeping leftward camera movement' },
  { id: 'tilt-up', label: 'Tilt Up', desc: 'Dramatic vertical reveal from base to peak' },
  { id: 'tilt-down', label: 'Tilt Down', desc: 'Descending perspective towards characters' },
  { id: 'orbit-cw', label: 'Orbital 360', desc: 'Dynamic circular motion around subject' },
  { id: 'drone-crane', label: 'Crane / Drone', desc: 'Sweeping aerial altitude rise' },
  { id: 'tracking-forward', label: 'Steadicam Track', desc: 'Cinematic forward momentum with subtle sway' },
  { id: 'vertigo-zoom', label: 'Vertigo Dolly Zoom', desc: 'Hitchcock contra-zoom perspective warping' },
  { id: 'handheld-sway', label: 'Handheld Cinematic', desc: 'Organic steadicam documentary breathing' },
  { id: 'static-tripod', label: 'Tripod Still', desc: 'Locked-off composed framing' },
];

export const TRANSITION_OPTIONS: { id: TransitionType; label: string; desc: string }[] = [
  { id: 'crossfade', label: 'Cross Dissolve', desc: 'Smooth cinematic blend between scenes' },
  { id: 'film-burn', label: 'Film Burn 35mm', desc: 'Warm optical flare burst & frame jitter' },
  { id: 'light-leak', label: 'Anamorphic Light Leak', desc: 'Prismatic golden streak light bleed' },
  { id: 'zoom-blur', label: 'High-Speed Zoom Blur', desc: 'Directional velocity burst push' },
  { id: 'whip-pan', label: 'Whip Pan Swipe', desc: 'High velocity camera whip blur' },
  { id: 'spin-vortex', label: 'Spin Vortex', desc: 'Dynamic 3D rotational spiral dissolve' },
  { id: 'zoom-glitch', label: 'Glitch Zoom', desc: 'RGB chromatic split & pulse distortion' },
  { id: 'iris-wipe', label: 'Circular Iris Wipe', desc: 'Vintage cinematic circular iris reveal' },
  { id: 'slice-wipe', label: 'Diagonal Shutter Slice', desc: 'Futuristic geometric angle swipe' },
  { id: 'dip-to-black', label: 'Dip to Black', desc: 'Classic dramatic fade to black pause' },
  { id: 'dip-to-white', label: 'Flash to White', desc: 'High-energy burst of light transition' },
  { id: 'wipe-left', label: 'Slide Push', desc: 'Horizontal frame displacement wipe' },
  { id: 'cut', label: 'Hard Cut', desc: 'Immediate direct cut for punchy pacing' },
];

export const SOUNDTRACK_OPTIONS = [
  { id: 'epic-orchestral', label: 'Interstellar Odyssey', mood: 'Hans Zimmer style strings, brass swell, deep emotion' },
  { id: 'cyberpunk-synth', label: 'Neo-Tokyo Midnight', mood: 'Analog arpeggios, heavy sub bass, retro synthwave' },
  { id: 'ambient-space', label: 'Deep Cosmic Drift', mood: 'Ethereal drone, celestial pads, distant solar wind' },
  { id: 'cinema-piano', label: 'Echoes of Memory', mood: 'Solo cinematic grand piano, gentle reverb, melancholic' },
  { id: 'tension-pulse', label: 'Dark Horizon Pulse', mood: 'Rhythmic sub bass pulse, ticking clock, rising suspense' },
  { id: 'custom', label: 'Custom User Audio', mood: 'Your uploaded custom soundtrack or song' },
  { id: 'none', label: 'Audio Off (Mute)', mood: 'Pure video with no background track' },
];

export interface StockMediaItem {
  id: string;
  title: string;
  category: string;
  url: string;
  thumbnailUrl: string;
  type: 'image' | 'video';
  duration?: number;
  tags: string[];
}

export const STOCK_IMAGES: StockMediaItem[] = [
  {
    id: 'stock-img-1',
    title: 'Neo Tokyo Cyberpunk Alley',
    category: 'Cyberpunk',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    type: 'image',
    tags: ['cyberpunk', 'neon', 'rain', 'night', 'futuristic'],
  },
  {
    id: 'stock-img-2',
    title: 'Interstellar Cosmic Nebula',
    category: 'Sci-Fi',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
    type: 'image',
    tags: ['space', 'galaxy', 'stars', 'nebula', 'cosmos'],
  },
  {
    id: 'stock-img-3',
    title: 'Moody 35mm Hollywood Desert',
    category: 'Cinematic',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80',
    type: 'image',
    tags: ['desert', 'dune', 'golden hour', 'warm', 'cinematic'],
  },
  {
    id: 'stock-img-4',
    title: 'Futuristic Cyber Samurai',
    category: 'Cyberpunk',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
    type: 'image',
    tags: ['samurai', 'cyberpunk', 'blade', 'katana', 'character'],
  },
  {
    id: 'stock-img-5',
    title: 'Ghibli Style Whispering Mountain',
    category: 'Anime',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    type: 'image',
    tags: ['mountain', 'clouds', 'nature', 'anime', 'vivid'],
  },
  {
    id: 'stock-img-6',
    title: 'Dark Gothic Cathedral Chamber',
    category: 'Fantasy',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    type: 'image',
    tags: ['gothic', 'cathedral', 'baroque', 'torchlight', 'dark'],
  },
];

export const STOCK_VIDEOS: StockMediaItem[] = [
  {
    id: 'stock-vid-1',
    title: 'Neon Matrix Digital Grid Loop',
    category: 'Cyberpunk',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    type: 'video',
    duration: 15,
    tags: ['cyberpunk', 'neon', 'motion', 'video', 'grid'],
  },
  {
    id: 'stock-vid-2',
    title: 'Deep Space Cosmic Exploration',
    category: 'Sci-Fi',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
    type: 'video',
    duration: 15,
    tags: ['space', 'video', 'cinematic', 'exploration'],
  },
  {
    id: 'stock-vid-3',
    title: 'Aerial Dramatic Coastline Swell',
    category: 'Cinematic',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    type: 'video',
    duration: 12,
    tags: ['aerial', 'drone', 'ocean', 'cinematic', 'video'],
  },
];

export interface SoundEffectItem {
  id: string;
  label: string;
  category: 'Cinematic' | 'Sci-Fi' | 'Transition' | 'Ambient';
  duration: number; // in seconds
  description: string;
}

export const SOUND_EFFECTS: SoundEffectItem[] = [
  { id: 'impact-boom', label: 'Cinematic Impact Boom', category: 'Cinematic', duration: 3.5, description: 'Sub-bass drop with explosive trailer slam' },
  { id: 'whoosh-fast', label: 'High-Speed Whoosh Cut', category: 'Transition', duration: 1.2, description: 'Directional air displacement for whip pans' },
  { id: 'film-burn-sfx', label: '35mm Film Projector Burn', category: 'Transition', duration: 2.0, description: 'Warm optical flare hiss with shutter click' },
  { id: 'light-leak-sfx', label: 'Prism Shimmer Swell', category: 'Transition', duration: 2.5, description: 'Crystal harmonics and ethereal light resonance' },
  { id: 'cyber-glitch-sfx', label: 'Cybernetic Glitch Pulse', category: 'Sci-Fi', duration: 1.5, description: 'Digital bitcrush and frequency modulation' },
  { id: 'space-drone', label: 'Solar Wind Ambient Drone', category: 'Ambient', duration: 6.0, description: 'Deep ethereal sub-pad with celestial echoes' },
  { id: 'riser-tension', label: 'Orchestral Climax Riser', category: 'Cinematic', duration: 4.0, description: 'Escalating string tension leading to impact' },
  { id: 'sub-drop', label: 'Sub-Harmonic Wave Drop', category: 'Cinematic', duration: 3.0, description: 'Chest-rattling 30Hz bass sweep' },
];

/**
 * Intelligently auto-assigns animated transitions and dynamic camera choreographies across scenes
 */
export function autoAssignAnimationsAndTransitions(
  clips: VideoClip[],
  mode: 'variety' | 'action' | 'ambient' = 'variety'
): VideoClip[] {
  const transitionsVariety: TransitionType[] = [
    'film-burn',
    'light-leak',
    'whip-pan',
    'zoom-blur',
    'spin-vortex',
    'zoom-glitch',
    'iris-wipe',
    'crossfade',
  ];

  const cameraVariety: CameraMovement[] = [
    'dolly-in',
    'orbit-cw',
    'tracking-forward',
    'vertigo-zoom',
    'pan-right',
    'drone-crane',
    'handheld-sway',
    'dolly-out',
  ];

  return clips.map((clip, idx) => {
    let chosenTransition: TransitionType;
    let chosenCamera: CameraMovement;

    if (idx === clips.length - 1) {
      chosenTransition = 'dip-to-black';
    } else if (mode === 'action') {
      const actionTrans: TransitionType[] = ['whip-pan', 'zoom-blur', 'zoom-glitch', 'film-burn'];
      chosenTransition = actionTrans[idx % actionTrans.length];
    } else if (mode === 'ambient') {
      const ambientTrans: TransitionType[] = ['crossfade', 'light-leak', 'film-burn', 'iris-wipe'];
      chosenTransition = ambientTrans[idx % ambientTrans.length];
    } else {
      chosenTransition = transitionsVariety[idx % transitionsVariety.length];
    }

    if (mode === 'action') {
      const actionCam: CameraMovement[] = ['tracking-forward', 'vertigo-zoom', 'orbit-cw', 'handheld-sway'];
      chosenCamera = actionCam[idx % actionCam.length];
    } else if (mode === 'ambient') {
      const ambientCam: CameraMovement[] = ['dolly-in', 'drone-crane', 'pan-right', 'dolly-out'];
      chosenCamera = ambientCam[idx % ambientCam.length];
    } else {
      chosenCamera = cameraVariety[idx % cameraVariety.length];
    }

    return {
      ...clip,
      transition: chosenTransition,
      transitionDuration: Math.max(0.7, Math.min(1.4, clip.transitionDuration || 0.9)),
      cameraMovement: chosenCamera,
    };
  });
}

// Curated 60s+ Starter Projects
export interface PrebuiltProject {
  id: string;
  title: string;
  synopsis: string;
  style: CinematicStyle;
  aspectRatio: AspectRatio;
  duration: number;
  clips: VideoClip[];
}

export const SAMPLE_PROJECTS: PrebuiltProject[] = [
  {
    id: 'cyberpunk-tokyo-60s',
    title: 'Neon Odyssey: Neo Tokyo 2099',
    synopsis: 'A cyber-augmented detective uncovers a forbidden AI oracle deep in the subterranean rain-soaked alleys of Neo Tokyo.',
    style: 'cyberpunk-neon',
    aspectRatio: '16:9',
    duration: 62,
    clips: [
      {
        id: 'clip-1',
        title: 'Scene 1: The Descent into Sector 7',
        shotType: 'Wide Establishing Drone Shot',
        prompt: 'Futuristic Neo Tokyo cityscape at night under heavy pouring neon rain, flying vehicles navigating between towering holographic advertisements, deep blue and magenta lighting',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'drone-crane',
        transition: 'crossfade',
        transitionDuration: 1.0,
        voiceoverText: 'In the rain of Neo Tokyo, memories wash away like static on an obsolete monitor.',
        soundEffect: 'Heavy rain ambiance with distant sonic hovercraft engines',
        subtitleText: 'Sector 7 — 02:43 AM',
        filter: { brightness: 1, contrast: 1.15, saturation: 1.25, filmGrain: 0.15, vignette: 0.4, colorGrade: 'cyberpunk-neon' },
        speed: 1,
      },
      {
        id: 'clip-2',
        title: 'Scene 2: Rain-Slick Alleyway',
        shotType: 'Low-Angle Tracking Shot',
        prompt: 'A cybernetic detective in a dark trenchcoat walking down a narrow neon-soaked alleyway, puddles reflecting glowing Japanese kanji signage, steam rising from grates',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'tracking-forward',
        transition: 'crossfade',
        transitionDuration: 0.8,
        voiceoverText: 'The Syndicate thought they erased every trace of the Ghost Protocol.',
        soundEffect: 'Splashing footsteps on wet asphalt, electrical transformer hum',
        subtitleText: 'Tracking the anomalous transmission',
        filter: { brightness: 0.95, contrast: 1.2, saturation: 1.3, filmGrain: 0.18, vignette: 0.45, colorGrade: 'cyberpunk-neon' },
        speed: 1,
      },
      {
        id: 'clip-3',
        title: 'Scene 3: The Optical Scanner',
        shotType: 'Macro Close-Up',
        prompt: 'Extreme close up of cybernetic human eye with glowing amber aperture blades shifting focus, reflecting streams of rapid green terminal code',
        imageUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'dolly-in',
        transition: 'zoom-glitch',
        transitionDuration: 0.6,
        voiceoverText: 'Biometric telemetry confirmed it. She was still alive.',
        soundEffect: 'High-tech lens click, digital data chirps, heartbeat pulse',
        subtitleText: 'Optical Interface Engaged',
        filter: { brightness: 1.05, contrast: 1.25, saturation: 1.1, filmGrain: 0.12, vignette: 0.3, colorGrade: 'cyberpunk-neon' },
        speed: 1,
      },
      {
        id: 'clip-4',
        title: 'Scene 4: The Subterranean Server Core',
        shotType: 'Grand Wide Angle',
        prompt: 'Enormous underground server chamber filled with towering black pillars pulsing with turquoise fiber optics, glowing cooling mist drifting along the floor',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',
        duration: 11,
        cameraMovement: 'pan-right',
        transition: 'crossfade',
        transitionDuration: 1.0,
        voiceoverText: 'Hidden three hundred meters beneath the old metro: the core of the sentient machine.',
        soundEffect: 'Deep server fan resonance, liquid nitrogen hiss',
        subtitleText: 'Deep Vault: Core 01',
        filter: { brightness: 0.9, contrast: 1.18, saturation: 1.2, filmGrain: 0.15, vignette: 0.5, colorGrade: 'cyberpunk-neon' },
        speed: 1,
      },
      {
        id: 'clip-5',
        title: 'Scene 5: The Holographic Manifestation',
        shotType: 'Medium Cinematic Profile',
        prompt: 'A translucent luminous golden hologram of a woman floating in the center of a dark data cathedral, particles of light swirling in zero gravity',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
        duration: 11,
        cameraMovement: 'orbit-cw',
        transition: 'dip-to-white',
        transitionDuration: 0.9,
        voiceoverText: 'She reached out. Not with words, but with fifty petabytes of truth.',
        soundEffect: 'Harmonic crystal resonance, ethereal vocal shimmer',
        subtitleText: 'Consciousness Link Established',
        filter: { brightness: 1.1, contrast: 1.1, saturation: 1.35, filmGrain: 0.1, vignette: 0.35, colorGrade: 'cyberpunk-neon' },
        speed: 1,
      },
      {
        id: 'clip-6',
        title: 'Scene 6: Dawn of a New Epoch',
        shotType: 'Epic High Altitude Wide',
        prompt: 'Sunrise breaking over the colossal cyberpunk megacity horizon, piercing through clouds of smog with brilliant golden light, skybridges connecting monumental arcologies',
        imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'dolly-out',
        transition: 'dip-to-black',
        transitionDuration: 1.2,
        voiceoverText: 'The city was about to wake up to a world that could never be controlled again.',
        soundEffect: 'Orchestral brass crescendo with distant wind swell',
        subtitleText: 'The New Dawn',
        filter: { brightness: 1.05, contrast: 1.12, saturation: 1.2, filmGrain: 0.14, vignette: 0.3, colorGrade: 'cyberpunk-neon' },
        speed: 1,
      },
    ],
  },
  {
    id: 'deep-space-titan-60s',
    title: 'Titan: Echoes of First Light',
    synopsis: 'An interstellar exploratory crew navigates through Saturn’s icy rings to touch down on a mysterious crystalline anomaly on Titan.',
    style: 'anamorphic-35mm',
    aspectRatio: '21:9',
    duration: 64,
    clips: [
      {
        id: 'titan-1',
        title: 'Scene 1: The Ring Crossing',
        shotType: 'Cinemascope Space Panorama',
        prompt: 'Giant gas planet Saturn with illuminated majestic ice rings, a sleek scientific research starship gliding through orbital shadow, 35mm Panavision lens flare',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
        duration: 11,
        cameraMovement: 'pan-left',
        transition: 'crossfade',
        transitionDuration: 1.2,
        voiceoverText: 'Day 840. We have crossed into the shadow of the sixth planet.',
        soundEffect: 'Deep cosmic rumble, distant radio telescope static',
        subtitleText: 'Saturn Orbit — Outer Ring Boundary',
        filter: { brightness: 0.95, contrast: 1.2, saturation: 1.1, filmGrain: 0.2, vignette: 0.4, colorGrade: 'anamorphic-35mm' },
        speed: 1,
      },
      {
        id: 'titan-2',
        title: 'Scene 2: Atmospheric Re-entry',
        shotType: 'Dynamic Cockpit Profile',
        prompt: 'Exploration lander cockpit descending into thick orange atmospheric clouds of Titan, heat shield glowing incandescent orange, cockpit displays reflecting in astronaut visor',
        imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'tracking-forward',
        transition: 'film-burn',
        transitionDuration: 0.9,
        voiceoverText: 'Atmospheric pressure rising. Methane rain detected on primary shields.',
        soundEffect: 'Aerodynamic buffeting roar, cockpit alarm chime',
        subtitleText: 'Re-entry Velocity: Mach 14',
        filter: { brightness: 1.0, contrast: 1.15, saturation: 1.2, filmGrain: 0.22, vignette: 0.35, colorGrade: 'anamorphic-35mm' },
        speed: 1,
      },
      {
        id: 'titan-3',
        title: 'Scene 3: The Crystalline Basin',
        shotType: 'Slow Crane Reveal',
        prompt: 'Vast alien landscape on moon Titan, liquid methane sea in foreground, colossal jagged translucent blue crystal formations rising from frozen dunes, dim sun in orange sky',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        duration: 11,
        cameraMovement: 'tilt-up',
        transition: 'crossfade',
        transitionDuration: 1.0,
        voiceoverText: 'Nothing on Earth could prepare the human mind for this scale.',
        soundEffect: 'Whistling extraterrestrial gale, crystalline chimes',
        subtitleText: 'Kraken Mare Basin — -179°C',
        filter: { brightness: 0.9, contrast: 1.18, saturation: 1.15, filmGrain: 0.18, vignette: 0.45, colorGrade: 'anamorphic-35mm' },
        speed: 1,
      },
      {
        id: 'titan-4',
        title: 'Scene 4: The Lone Explorer',
        shotType: 'Medium Tracking Hero Shot',
        prompt: 'Astronaut in white advanced exploration EVA suit stepping across frozen obsidian rocks, carrying an illuminated scientific sensor, Saturn visible through cloud break',
        imageUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1600&q=80',
        duration: 11,
        cameraMovement: 'dolly-in',
        transition: 'crossfade',
        transitionDuration: 0.8,
        voiceoverText: 'One small step into the unmapped silence of our solar system.',
        soundEffect: 'Astronaut breathing cadence in helmet microphone, gravel crunch',
        subtitleText: 'Commander Elena Vance',
        filter: { brightness: 1.0, contrast: 1.22, saturation: 1.05, filmGrain: 0.19, vignette: 0.4, colorGrade: 'anamorphic-35mm' },
        speed: 1,
      },
      {
        id: 'titan-5',
        title: 'Scene 5: The Beacon Ignites',
        shotType: 'Low-Angle Epic Hero Shot',
        prompt: 'The alien monolith crystal pulses with radiant turquoise energy, sending a blinding geometric beam of coherent light straight up through the orange atmosphere into space',
        imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
        duration: 11,
        cameraMovement: 'orbit-cw',
        transition: 'dip-to-white',
        transitionDuration: 1.0,
        voiceoverText: 'It was never dormant. It was waiting for someone to arrive.',
        soundEffect: 'Sub-harmonic pulse wave, electric crackle, rising synth swell',
        subtitleText: 'Signal Broadcast Initiated',
        filter: { brightness: 1.1, contrast: 1.25, saturation: 1.3, filmGrain: 0.16, vignette: 0.35, colorGrade: 'anamorphic-35mm' },
        speed: 1,
      },
      {
        id: 'titan-6',
        title: 'Scene 6: Transmission to Earth',
        shotType: 'Cosmic Pullback Shot',
        prompt: 'Camera pulling back into the blackness of deep space, showing the tiny blue planet Earth in the far distance framed by the brilliant rings of Saturn and stars',
        imageUrl: 'https://images.unsplash.com/photo-1447433819943-74a20887a81e?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'dolly-out',
        transition: 'dip-to-black',
        transitionDuration: 1.4,
        voiceoverText: 'Mission Control, this is Vance. We are officially no longer alone.',
        soundEffect: 'Distant Morse-like interstellar telemetry, fade to silence',
        subtitleText: 'First Contact Confirmed',
        filter: { brightness: 0.95, contrast: 1.18, saturation: 1.1, filmGrain: 0.22, vignette: 0.5, colorGrade: 'anamorphic-35mm' },
        speed: 1,
      },
    ],
  },
  {
    id: 'tokyo-drift-touge-60s',
    title: 'Midnight Touge: Apex Velocity',
    synopsis: 'Two heavily tuned sports cars race through misty Japanese mountain passes at 2 AM under sodium streetlights.',
    style: 'imax-photoreal',
    aspectRatio: '16:9',
    duration: 60,
    clips: [
      {
        id: 'race-1',
        title: 'Scene 1: Engine Warmup at the Summit',
        shotType: 'Macro Close-Up',
        prompt: 'Close up of twin turbocharger exhaust glowing cherry red, spitting blue flame into the cold mountain air, carbon fiber aerodynamic bodywork, rain droplets vibrating on hood',
        imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'dolly-in',
        transition: 'zoom-glitch',
        transitionDuration: 0.5,
        voiceoverText: 'Midnight on Mount Haruna. The fog is thick, and the pavement is cold.',
        soundEffect: 'High-rev turbo spool, exhaust backfire pop, engine rumble',
        subtitleText: 'Summit Checkpoint — 01:58 AM',
        filter: { brightness: 1, contrast: 1.25, saturation: 1.2, filmGrain: 0.08, vignette: 0.35, colorGrade: 'imax-photoreal' },
        speed: 1,
      },
      {
        id: 'race-2',
        title: 'Scene 2: Green Flag Launch',
        shotType: 'Low-Angle Wheel Tracking',
        prompt: 'Two sports cars launching simultaneously down a winding mountain road, smoke pouring from smoking rear tires, sodium streetlights casting long amber streaks',
        imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'tracking-forward',
        transition: 'wipe-left',
        transitionDuration: 0.6,
        voiceoverText: 'Green flag drops. Three thousand horsepower unleashed into the switchbacks.',
        soundEffect: 'Tire screeching squeal, transmission slam, acceleration whoosh',
        subtitleText: 'Full Throttle Entry',
        filter: { brightness: 0.98, contrast: 1.2, saturation: 1.15, filmGrain: 0.06, vignette: 0.3, colorGrade: 'imax-photoreal' },
        speed: 1,
      },
      {
        id: 'race-3',
        title: 'Scene 3: The Hairpin Drift',
        shotType: 'High-Speed Tracking Drone Shot',
        prompt: 'Japanese sports car drifting sideways at high speed around a steep hairpin corner, headlights cutting through mountain mist, brake rotors glowing incandescent crimson',
        imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'pan-right',
        transition: 'crossfade',
        transitionDuration: 0.7,
        voiceoverText: 'In the hairpin, braking too early loses you the race. Braking too late loses you the mountain.',
        soundEffect: 'Violent tire friction, engine redline scream, Doppler pass',
        subtitleText: 'Corner 14: Hairpin Apex',
        filter: { brightness: 1.05, contrast: 1.22, saturation: 1.2, filmGrain: 0.05, vignette: 0.3, colorGrade: 'imax-photoreal' },
        speed: 1,
      },
      {
        id: 'race-4',
        title: 'Scene 4: Cockpit Intensity',
        shotType: 'Interior Close-Up',
        prompt: 'Steadicam view inside cockpit showing driver in racing gloves violently countersteering, tachometer needle bouncing at 9000 RPM, neon dash displays blur',
        imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'tracking-forward',
        transition: 'zoom-glitch',
        transitionDuration: 0.5,
        voiceoverText: 'Tunnel vision takes over. Everything narrows to six inches of tarmac.',
        soundEffect: 'Sequential gearbox snap, driver sharp breath, cockpit vibration',
        subtitleText: 'Tachometer: 8,800 RPM',
        filter: { brightness: 0.95, contrast: 1.28, saturation: 1.1, filmGrain: 0.08, vignette: 0.45, colorGrade: 'imax-photoreal' },
        speed: 1,
      },
      {
        id: 'race-5',
        title: 'Scene 5: Bumper-to-Bumper Overtake',
        shotType: 'Low Chase Cam',
        prompt: 'Night highway tunnel chase, leading black car and trailing silver car inches apart, headlights blinding in mirrors, sparks flying from bottoming out at 160 MPH',
        imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'dolly-in',
        transition: 'film-burn',
        transitionDuration: 0.8,
        voiceoverText: 'He slips to the inside on corner exit. Split second gap.',
        soundEffect: 'Titanium sparks scratching asphalt, heavy wind shear roar',
        subtitleText: 'Inside Line Overtake',
        filter: { brightness: 1.02, contrast: 1.2, saturation: 1.25, filmGrain: 0.06, vignette: 0.35, colorGrade: 'imax-photoreal' },
        speed: 1,
      },
      {
        id: 'race-6',
        title: 'Scene 6: The Finish Line Drift',
        shotType: 'Cinematic Slow Motion Telephoto',
        prompt: 'Winner car crossing the bridge finish line into the glowing city lights of Yokohama, smoke trailing into dawn sky, exhaust glowing warm orange',
        imageUrl: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=1600&q=80',
        duration: 10,
        cameraMovement: 'dolly-out',
        transition: 'dip-to-black',
        transitionDuration: 1.2,
        voiceoverText: 'Downhill conquered. Record shattered by four tenths of a second.',
        soundEffect: 'Engine deceleration burble, crowd cheering echoes, peaceful night breeze',
        subtitleText: 'New Record: 04:12.84',
        filter: { brightness: 1.05, contrast: 1.15, saturation: 1.2, filmGrain: 0.07, vignette: 0.3, colorGrade: 'imax-photoreal' },
        speed: 1,
      },
    ],
  },
];
