import { CameraMovement, CinematicStyle, VideoClip } from '../types/video';

export interface GeneratedScene {
  title: string;
  shotType: string;
  prompt: string;
  cameraMovement: CameraMovement;
  duration: number;
  voiceoverText: string;
  soundEffect: string;
  subtitleText: string;
  imageUrl: string;
}

export interface GeneratedFilm {
  title: string;
  synopsis: string;
  targetDuration: number;
  scenes: GeneratedScene[];
}

// Curated high-definition cinema stills by genre
const THEMED_IMAGES = {
  scifi: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1447433819943-74a20887a81e?auto=format&fit=crop&w=1600&q=80',
  ],
  cyberpunk: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1600&q=80',
  ],
  darkfantasy: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1600&q=80',
  ],
  nature: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
  ],
  action: [
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=1600&q=80',
  ],
};

export function generateEpisodicStoryboard(
  userPrompt: string,
  style: CinematicStyle,
  targetDuration: number = 60
): GeneratedFilm {
  const p = userPrompt.trim();
  const lower = p.toLowerCase();
  const duration = Math.max(5, Math.min(600, targetDuration));

  // Determine number of scenes (each scene between 7s and 12s, minimum 1 scene)
  let sceneCount = 6;
  if (duration <= 12) sceneCount = 1;
  else if (duration <= 25) sceneCount = 2;
  else if (duration <= 40) sceneCount = 3;
  else if (duration <= 55) sceneCount = 4;
  else if (duration <= 75) sceneCount = 6;
  else if (duration <= 100) sceneCount = 8;
  else if (duration <= 140) sceneCount = 10;
  else sceneCount = Math.min(12, Math.round(duration / 12));

  // Calculate duration per scene so sum equals targetDuration
  const baseDuration = Math.floor(duration / sceneCount);
  const remainder = duration % sceneCount;

  // Detect theme
  let theme: 'scifi' | 'cyberpunk' | 'darkfantasy' | 'nature' | 'action' = 'cyberpunk';
  if (lower.includes('space') || lower.includes('astronaut') || lower.includes('planet') || lower.includes('galaxy') || lower.includes('alien') || style === 'sci-fi-dystopia') {
    theme = 'scifi';
  } else if (lower.includes('dragon') || lower.includes('magic') || lower.includes('medieval') || lower.includes('knight') || lower.includes('sword') || lower.includes('castle') || style === 'dark-fantasy' || style === 'noir-monochrome') {
    theme = 'darkfantasy';
  } else if (lower.includes('race') || lower.includes('car') || lower.includes('drift') || lower.includes('speed') || lower.includes('highway') || lower.includes('chase')) {
    theme = 'action';
  } else if (lower.includes('forest') || lower.includes('mountain') || lower.includes('ocean') || lower.includes('river') || lower.includes('sunset') || lower.includes('garden') || style === 'studio-ghibli') {
    theme = 'nature';
  }

  const images = THEMED_IMAGES[theme];

  // Derive a cinematic title
  const words = p.split(' ').filter(w => w.length > 2);
  const coreSubject = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'The Odyssey';
  const filmTitle = `${coreSubject}: Act of Destiny`;
  const synopsis = `A breathtaking cinematic odyssey (${duration}s) exploring ${p.toLowerCase()}, told across ${sceneCount} continuous episodic scenes.`;

  const cameraMoves: CameraMovement[] = [
    'drone-crane',
    'tracking-forward',
    'dolly-in',
    'pan-right',
    'orbit-cw',
    'tilt-up',
    'dolly-out',
    'pan-left',
    'tracking-forward',
    'dolly-in',
    'drone-crane',
    'static-tripod',
  ];

  const shotTypes = [
    'Wide Establishing Drone Shot',
    'Low-Angle Tracking Action Shot',
    'Macro Emotional Close-Up',
    'Sweeping Pan Vista',
    'Epic Dynamic Orbiting Shot',
    'Dramatic Crane Tilt-Up',
    'Majestic Pullback Finale',
    'Telephoto Tracking Profile',
    'Medium Steadicam Drift',
    'High Altitude Reveal',
    'Wide Horizon Atmosphere',
    'Composed Tripod Master Shot',
  ];

  const narrativeCues = [
    { act: 'Act I: The Inciting Vision', sub: 'Prologue — First Glimpse', voice: `It began where the known world ends: with ${p.toLowerCase()}.`, sfx: 'Sub-bass atmospheric drone with rising wind' },
    { act: 'Act II: The Crossing', sub: 'Boundary — Crossing', voice: 'Every step deeper into the uncharted revealed echoes of what was forgotten.', sfx: 'Echoing metallic transients and subtle rhythmic pulse' },
    { act: 'Act III: The Awakening', sub: 'Deep Observation — Focus', voice: 'Then, without warning, the ancient patterns aligned before our eyes.', sfx: 'High frequency crystalline shimmer with optical shutter snap' },
    { act: 'Act IV: The Turning Point', sub: 'Threshold — Escalation', voice: 'There was no turning back; the threshold between illusion and reality collapsed.', sfx: 'Tension riser with sub-harmonic wave impact' },
    { act: 'Act V: The Climax', sub: 'Peak Convergence — Climax', voice: 'A blinding surge of pure kinetic energy reshaped everything in its path.', sfx: 'Cinematic orchestral swell with thunderous bass drop' },
    { act: 'Act VI: The Resolution', sub: 'Epilogue — Dawn of New World', voice: 'When the dust finally settled, the world stood forever transformed.', sfx: 'Peaceful celestial pads fading into distant silence' },
    { act: 'Act VII: The Legacy', sub: 'Memory Archive — Truth', voice: 'The signal echoed across light years, answering a question asked long ago.', sfx: 'Distant radio telemetry with harmonic strings' },
    { act: 'Act VIII: The Far Frontier', sub: 'The Endless Horizon', voice: 'Ahead lay the open horizon, boundless and infinite.', sfx: 'Ethereal ambient drone with warm bass warmth' },
    { act: 'Act IX: The Final Departure', sub: 'Beyond the Stars', voice: 'And so we sailed forward, beyond the reach of gravity and fear.', sfx: 'Orchestral brass crescendo and wind rush' },
    { act: 'Act X: The Eternal Beacon', sub: 'Cosmic Constellation', voice: 'A single spark that would guide travelers for thousand generations.', sfx: 'Subtle high bell chimes in deep silence' },
  ];

  const scenes: GeneratedScene[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const cue = narrativeCues[i % narrativeCues.length];
    const sceneDuration = baseDuration + (i < remainder ? 1 : 0);
    scenes.push({
      title: sceneCount === 1 ? 'Cinematic Scene' : `Scene ${i + 1}: ${cue.act.split(':')[1]?.trim() || cue.act}`,
      shotType: shotTypes[i % shotTypes.length],
      prompt: `${p}, Scene ${i + 1}, cinematic lighting, photorealistic 8k, master cinematography`,
      cameraMovement: cameraMoves[i % cameraMoves.length],
      duration: sceneDuration,
      voiceoverText: cue.voice,
      soundEffect: cue.sfx,
      subtitleText: cue.sub,
      imageUrl: images[i % images.length],
    });
  }

  return {
    title: filmTitle,
    synopsis,
    targetDuration: duration,
    scenes,
  };
}
