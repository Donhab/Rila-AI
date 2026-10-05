import { AspectRatio, CameraMovement, CinematicStyle, TransitionType, VideoClip } from '../types/video';
import { audioSynthesizer } from './audioSynthesizer';

export interface RenderDimensions {
  width: number;
  height: number;
}

export function getResolutionDimensions(
  resolution: '720p' | '1080p' | '4k',
  aspectRatio: AspectRatio
): RenderDimensions {
  switch (aspectRatio) {
    case '16:9':
      if (resolution === '4k') return { width: 3840, height: 2160 };
      if (resolution === '720p') return { width: 1280, height: 720 };
      return { width: 1920, height: 1080 };
    case '9:16':
      if (resolution === '4k') return { width: 2160, height: 3840 };
      if (resolution === '720p') return { width: 720, height: 1280 };
      return { width: 1080, height: 1920 };
    case '1:1':
      if (resolution === '4k') return { width: 2160, height: 2160 };
      if (resolution === '720p') return { width: 720, height: 720 };
      return { width: 1080, height: 1080 };
    case '21:9':
      if (resolution === '4k') return { width: 5120, height: 2160 };
      if (resolution === '720p') return { width: 1680, height: 720 };
      return { width: 2560, height: 1080 };
  }
}

export class CinematicRenderer {
  private imageCache = new Map<string, HTMLImageElement>();
  private grainPatternCanvas: HTMLCanvasElement | null = null;
  private dustParticles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = [];

  constructor() {
    this.initDustParticles();
  }

  private initDustParticles() {
    this.dustParticles = [];
    for (let i = 0; i < 45; i++) {
      this.dustParticles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2.5 + 0.8,
        speedX: (Math.random() - 0.5) * 0.0004,
        speedY: -Math.random() * 0.0006 - 0.0002,
        opacity: Math.random() * 0.4 + 0.2,
      });
    }
  }

  public preloadClipImages(clips: VideoClip[]): Promise<void[]> {
    return Promise.all(
      clips.map((clip) => {
        if (!clip.imageUrl) return Promise.resolve();
        if (this.imageCache.has(clip.imageUrl)) return Promise.resolve();

        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            this.imageCache.set(clip.imageUrl, img);
            resolve();
          };
          img.onerror = () => {
            // fallback canvas generation if image fails to load
            const fallback = document.createElement('canvas');
            fallback.width = 1280;
            fallback.height = 720;
            const ctx = fallback.getContext('2d');
            if (ctx) {
              const grad = ctx.createLinearGradient(0, 0, 1280, 720);
              grad.addColorStop(0, '#0f172a');
              grad.addColorStop(1, '#1e1b4b');
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, 1280, 720);
              ctx.fillStyle = '#f8fafc';
              ctx.font = 'bold 36px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(clip.title, 640, 360);
            }
            const fallbackImg = new Image();
            fallbackImg.src = fallback.toDataURL();
            this.imageCache.set(clip.imageUrl, fallbackImg);
            resolve();
          };
          img.src = clip.imageUrl;
        });
      })
    );
  }

  public getTotalDuration(clips: VideoClip[]): number {
    return clips.reduce((sum, c) => sum + (c.duration / (c.speed || 1)), 0);
  }

  public getActiveClipAtTime(
    clips: VideoClip[],
    currentTime: number
  ): {
    currentClip: VideoClip;
    clipIndex: number;
    clipLocalTime: number;
    clipProgress: number;
    nextClip: VideoClip | null;
    transitionProgress: number | null; // 0 to 1 during transition
  } | null {
    if (!clips || clips.length === 0) return null;

    let accumulatedTime = 0;
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const clipDuration = clip.duration / (clip.speed || 1);
      const clipEndTime = accumulatedTime + clipDuration;

      if (currentTime >= accumulatedTime && (currentTime < clipEndTime || i === clips.length - 1)) {
        const localTime = Math.max(0, Math.min(clipDuration, currentTime - accumulatedTime));
        const progress = clipDuration > 0 ? localTime / clipDuration : 0;

        const nextClip = i < clips.length - 1 ? clips[i + 1] : null;
        let transitionProgress: number | null = null;

        const transDuration = clip.transitionDuration || 0.8;
        const timeUntilEnd = clipDuration - localTime;

        if (nextClip && clip.transition !== 'cut' && timeUntilEnd <= transDuration) {
          transitionProgress = 1 - timeUntilEnd / transDuration;
        }

        return {
          currentClip: clip,
          clipIndex: i,
          clipLocalTime: localTime,
          clipProgress: progress,
          nextClip,
          transitionProgress,
        };
      }
      accumulatedTime = clipEndTime;
    }

    const lastClip = clips[clips.length - 1];
    return {
      currentClip: lastClip,
      clipIndex: clips.length - 1,
      clipLocalTime: lastClip.duration,
      clipProgress: 1,
      nextClip: null,
      transitionProgress: null,
    };
  }

  public renderFrame(
    canvas: HTMLCanvasElement,
    clips: VideoClip[],
    currentTime: number,
    aspectRatio: AspectRatio,
    showSubtitles = true
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx || clips.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;

    const clipInfo = this.getActiveClipAtTime(clips, currentTime);
    if (!clipInfo) {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const { currentClip, clipProgress, nextClip, transitionProgress } = clipInfo;

    // Base background
    ctx.fillStyle = '#020202';
    ctx.fillRect(0, 0, width, height);

    if (transitionProgress !== null && nextClip && currentClip.transition !== 'cut') {
      // Transition composite render
      this.renderTransition(
        ctx,
        currentClip,
        nextClip,
        clipProgress,
        transitionProgress,
        width,
        height,
        currentClip.transition
      );
    } else {
      // Single clip render
      this.renderSingleClip(ctx, currentClip, clipProgress, width, height, 1.0);
    }

    // Atmospheric effects (particles, anamorphic blue flare, film grain, vignette)
    this.renderAtmosphericEffects(ctx, currentClip, width, height, currentTime);

    // Letterbox bars (cinematic 2.39:1 aspect overlay if 16:9 or 21:9)
    this.renderCinematicBorders(ctx, aspectRatio, width, height);

    // Subtitles & Title Lower-Thirds
    if (showSubtitles) {
      this.renderTitlesAndSubtitles(ctx, currentClip, clipProgress, width, height);
    }
  }

  private renderSingleClip(
    ctx: CanvasRenderingContext2D,
    clip: VideoClip,
    progress: number,
    width: number,
    height: number,
    alpha = 1.0
  ) {
    const img = this.imageCache.get(clip.imageUrl);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Camera movement matrix
    this.applyCameraTransform(ctx, clip.cameraMovement, progress, width, height);

    // Color Grading & Filters
    this.applyColorGradingFilter(ctx, clip);

    if (img && img.complete && img.naturalWidth > 0) {
      // Cover fit with generous padding for camera pans/zooms
      const margin = 0.15;
      const drawW = width * (1 + margin * 2);
      const drawH = height * (1 + margin * 2);
      const drawX = -width * margin;
      const drawY = -height * margin;

      this.drawImageCover(ctx, img, drawX, drawY, drawW, drawH);
    } else {
      // Procedural cinematic visual placeholder
      this.renderProceduralScene(ctx, clip, width, height);
    }

    ctx.restore();
  }

  private renderTransition(
    ctx: CanvasRenderingContext2D,
    currClip: VideoClip,
    nextClip: VideoClip,
    clipProgress: number,
    tProgress: number, // 0 -> 1
    width: number,
    height: number,
    type: TransitionType
  ) {
    const easeT = this.easeInOutQuad(tProgress);

    switch (type) {
      case 'crossfade': {
        this.renderSingleClip(ctx, currClip, clipProgress, width, height, 1.0);
        this.renderSingleClip(ctx, nextClip, 0.05, width, height, easeT);
        break;
      }
      case 'dip-to-black': {
        if (easeT < 0.5) {
          const fadeOut = 1 - easeT * 2;
          this.renderSingleClip(ctx, currClip, clipProgress, width, height, fadeOut);
        } else {
          const fadeIn = (easeT - 0.5) * 2;
          this.renderSingleClip(ctx, nextClip, 0.05, width, height, fadeIn);
        }
        break;
      }
      case 'dip-to-white': {
        if (easeT < 0.5) {
          this.renderSingleClip(ctx, currClip, clipProgress, width, height, 1.0);
          ctx.fillStyle = `rgba(255, 255, 255, ${easeT * 2})`;
          ctx.fillRect(0, 0, width, height);
        } else {
          this.renderSingleClip(ctx, nextClip, 0.05, width, height, 1.0);
          ctx.fillStyle = `rgba(255, 255, 255, ${(1 - easeT) * 2})`;
          ctx.fillRect(0, 0, width, height);
        }
        break;
      }
      case 'film-burn': {
        this.renderSingleClip(ctx, currClip, clipProgress, width, height, 1 - easeT);
        this.renderSingleClip(ctx, nextClip, 0.05, width, height, easeT);

        // Warm optical flare burst in the middle
        const burstAlpha = Math.sin(tProgress * Math.PI) * 0.85;
        const burnGrad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          10,
          width * 0.5,
          height * 0.5,
          width * 0.8
        );
        burnGrad.addColorStop(0, `rgba(255, 220, 140, ${burstAlpha})`);
        burnGrad.addColorStop(0.4, `rgba(255, 120, 20, ${burstAlpha * 0.7})`);
        burnGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = burnGrad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
      case 'wipe-left': {
        const offset = easeT * width;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width - offset, height);
        ctx.clip();
        this.renderSingleClip(ctx, currClip, clipProgress, width, height, 1.0);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(width - offset, 0, offset, height);
        ctx.clip();
        this.renderSingleClip(ctx, nextClip, 0.05, width, height, 1.0);
        ctx.restore();
        break;
      }
      case 'zoom-glitch': {
        ctx.save();
        const glitchScale = 1.0 + Math.sin(tProgress * Math.PI * 4) * 0.08;
        ctx.translate(width / 2, height / 2);
        ctx.scale(glitchScale, glitchScale);
        ctx.translate(-width / 2, -height / 2);

        if (easeT < 0.5) {
          this.renderSingleClip(ctx, currClip, clipProgress, width, height, 1.0);
        } else {
          this.renderSingleClip(ctx, nextClip, 0.05, width, height, 1.0);
        }

        // RGB Split glitch artifact
        ctx.fillStyle = `rgba(0, 255, 255, ${Math.sin(tProgress * Math.PI) * 0.25})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        break;
      }
      default:
        this.renderSingleClip(ctx, nextClip, 0.05, width, height, 1.0);
    }
  }

  private applyCameraTransform(
    ctx: CanvasRenderingContext2D,
    movement: CameraMovement,
    progress: number,
    width: number,
    height: number
  ) {
    const p = Math.max(0, Math.min(1, progress));
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.translate(centerX, centerY);

    switch (movement) {
      case 'dolly-in': {
        const scale = 1.0 + p * 0.18;
        ctx.scale(scale, scale);
        ctx.translate((p - 0.5) * 15, (p - 0.5) * 8);
        break;
      }
      case 'dolly-out': {
        const scale = 1.18 - p * 0.18;
        ctx.scale(scale, scale);
        break;
      }
      case 'pan-right': {
        ctx.scale(1.12, 1.12);
        const shiftX = (0.5 - p) * (width * 0.08);
        ctx.translate(shiftX, 0);
        break;
      }
      case 'pan-left': {
        ctx.scale(1.12, 1.12);
        const shiftX = (p - 0.5) * (width * 0.08);
        ctx.translate(shiftX, 0);
        break;
      }
      case 'tilt-up': {
        ctx.scale(1.12, 1.12);
        const shiftY = (p - 0.5) * (height * 0.08);
        ctx.translate(0, shiftY);
        break;
      }
      case 'tilt-down': {
        ctx.scale(1.12, 1.12);
        const shiftY = (0.5 - p) * (height * 0.08);
        ctx.translate(0, shiftY);
        break;
      }
      case 'orbit-cw': {
        const scale = 1.12 + p * 0.05;
        const angle = ((p - 0.5) * 2.2 * Math.PI) / 180;
        ctx.scale(scale, scale);
        ctx.rotate(angle);
        break;
      }
      case 'drone-crane': {
        const scale = 1.05 + p * 0.15;
        const shiftY = (p - 0.5) * (height * 0.06);
        ctx.scale(scale, scale);
        ctx.translate(0, shiftY);
        break;
      }
      case 'tracking-forward': {
        const scale = 1.0 + p * 0.14;
        const swayX = Math.sin(p * Math.PI * 4) * 5;
        const swayY = Math.cos(p * Math.PI * 4) * 3;
        ctx.scale(scale, scale);
        ctx.translate(swayX, swayY);
        break;
      }
      case 'static-tripod':
      default: {
        ctx.scale(1.03, 1.03);
        break;
      }
    }

    ctx.translate(-centerX, -centerY);
  }

  private applyColorGradingFilter(ctx: CanvasRenderingContext2D, clip: VideoClip) {
    const f = clip.filter || {
      brightness: 1,
      contrast: 1.1,
      saturation: 1.1,
      filmGrain: 0.1,
      vignette: 0.3,
      colorGrade: 'anamorphic-35mm',
    };

    let filterStr = `brightness(${f.brightness}) contrast(${f.contrast}) saturate(${f.saturation}) `;

    switch (f.colorGrade) {
      case 'cyberpunk-neon':
        filterStr += 'hue-rotate(-10deg) ';
        break;
      case 'vintage-70s':
        filterStr += 'sepia(0.35) hue-rotate(-15deg) ';
        break;
      case 'noir-monochrome':
        filterStr += 'grayscale(1) contrast(1.4) ';
        break;
      case 'wes-anderson':
        filterStr += 'sepia(0.15) saturate(1.2) ';
        break;
      case 'studio-ghibli':
        filterStr += 'saturate(1.3) brightness(1.05) ';
        break;
      case 'anamorphic-35mm':
      default:
        filterStr += 'sepia(0.08) ';
        break;
    }

    ctx.filter = filterStr.trim();
  }

  private renderAtmosphericEffects(
    ctx: CanvasRenderingContext2D,
    clip: VideoClip,
    width: number,
    height: number,
    time: number
  ) {
    ctx.save();
    ctx.filter = 'none';

    // 1. Floating atmospheric dust particles
    ctx.fillStyle = '#ffffff';
    for (const p of this.dustParticles) {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;

      const px = p.x * width;
      const py = p.y * height;
      ctx.globalAlpha = p.opacity * 0.45;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Anamorphic horizontal blue flare streak (if anamorphic style)
    if (clip.filter?.colorGrade === 'anamorphic-35mm' || clip.filter?.colorGrade === 'cyberpunk-neon') {
      const flareY = height * 0.42 + Math.sin(time * 0.8) * (height * 0.05);
      const flareGrad = ctx.createLinearGradient(0, flareY, width, flareY);
      flareGrad.addColorStop(0, 'rgba(30, 144, 255, 0)');
      flareGrad.addColorStop(0.35, 'rgba(64, 190, 255, 0.12)');
      flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
      flareGrad.addColorStop(0.65, 'rgba(64, 190, 255, 0.12)');
      flareGrad.addColorStop(1, 'rgba(30, 144, 255, 0)');

      ctx.fillStyle = flareGrad;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(0, flareY - 3, width, 6);
    }

    // 3. Cinematic Vignette
    const vignetteStrength = clip.filter?.vignette ?? 0.35;
    if (vignetteStrength > 0) {
      const radius = Math.max(width, height) * 0.75;
      const vGrad = ctx.createRadialGradient(width / 2, height / 2, radius * 0.3, width / 2, height / 2, radius);
      vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vGrad.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength})`);
      ctx.fillStyle = vGrad;
      ctx.globalAlpha = 1.0;
      ctx.fillRect(0, 0, width, height);
    }

    // 4. Subtle Film Grain
    const grainAlpha = clip.filter?.filmGrain ?? 0.12;
    if (grainAlpha > 0.02) {
      ctx.globalAlpha = grainAlpha * 0.35;
      this.renderProceduralNoise(ctx, width, height);
    }

    ctx.restore();
  }

  private renderProceduralNoise(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.grainPatternCanvas) {
      this.grainPatternCanvas = document.createElement('canvas');
      this.grainPatternCanvas.width = 128;
      this.grainPatternCanvas.height = 128;
      const pCtx = this.grainPatternCanvas.getContext('2d');
      if (pCtx) {
        const imgData = pCtx.createImageData(128, 128);
        for (let i = 0; i < imgData.data.length; i += 4) {
          const val = Math.random() * 255;
          imgData.data[i] = val;
          imgData.data[i + 1] = val;
          imgData.data[i + 2] = val;
          imgData.data[i + 3] = 40;
        }
        pCtx.putImageData(imgData, 0, 0);
      }
    }
    const pat = ctx.createPattern(this.grainPatternCanvas, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, width, height);
    }
  }

  private renderCinematicBorders(
    ctx: CanvasRenderingContext2D,
    aspectRatio: AspectRatio,
    width: number,
    height: number
  ) {
    if (aspectRatio === '21:9' || aspectRatio === '16:9') {
      // 2.39:1 cinemascope subtle letterbox bars
      const targetRatio = 2.39;
      const currentRatio = width / height;
      if (currentRatio < targetRatio) {
        const actualVideoH = width / targetRatio;
        const barH = (height - actualVideoH) / 2;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, barH);
        ctx.fillRect(0, height - barH, width, barH);
      }
    }
  }

  private renderTitlesAndSubtitles(
    ctx: CanvasRenderingContext2D,
    clip: VideoClip,
    progress: number,
    width: number,
    height: number
  ) {
    ctx.save();
    ctx.filter = 'none';

    // 1. Lower Third Location / Scene Subtitle (fades in and out during first 40% of clip)
    if (clip.subtitleText && progress < 0.45) {
      const alpha = progress < 0.1 ? progress / 0.1 : progress > 0.35 ? (0.45 - progress) / 0.1 : 1.0;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      const marginX = width * 0.06;
      const marginY = height * 0.85;

      ctx.font = `600 ${Math.max(14, Math.round(width * 0.016))}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#f59e0b';
      ctx.letterSpacing = '2px';
      ctx.fillText(clip.subtitleText.toUpperCase(), marginX, marginY);

      // Gold accent rule
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(marginX, marginY + 6, 42, 2);
    }

    // 2. Dialogue / Voiceover Subtitle Caption (Center Bottom)
    if (clip.voiceoverText) {
      ctx.globalAlpha = 0.95;
      const fontSize = Math.max(15, Math.round(width * 0.018));
      ctx.font = `500 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';

      const padding = 14;
      const lines = this.wrapText(ctx, clip.voiceoverText, width * 0.75);
      const lineHeight = fontSize * 1.35;
      const boxH = lines.length * lineHeight + padding * 2;
      const boxY = height * 0.88 - boxH / 2;

      // Subtle frosted dark banner
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
      const boxW = Math.min(width * 0.85, maxLineWidth + padding * 3);
      ctx.beginPath();
      ctx.roundRect(width / 2 - boxW / 2, boxY, boxW, boxH, 8);
      ctx.fill();

      // Text
      ctx.fillStyle = '#ffffff';
      lines.forEach((line, idx) => {
        ctx.fillText(line, width / 2, boxY + padding + fontSize + idx * lineHeight);
      });
    }

    ctx.restore();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  private drawImageCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = w / h;
    let sWidth = img.naturalWidth;
    let sHeight = img.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (canvasRatio > imgRatio) {
      sHeight = img.naturalWidth / canvasRatio;
      sy = (img.naturalHeight - sHeight) / 2;
    } else {
      sWidth = img.naturalHeight * canvasRatio;
      sx = (img.naturalWidth - sWidth) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
  }

  private renderProceduralScene(
    ctx: CanvasRenderingContext2D,
    clip: VideoClip,
    width: number,
    height: number
  ) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (clip.filter?.colorGrade === 'cyberpunk-neon') {
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#083344');
    } else if (clip.filter?.colorGrade === 'anamorphic-35mm') {
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#292524');
      grad.addColorStop(1, '#451a03');
    } else {
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(1, '#18181b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = `700 ${Math.max(22, Math.round(width * 0.028))}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.fillText(clip.title, width / 2, height / 2 - 10);

    ctx.fillStyle = '#f59e0b';
    ctx.font = `500 ${Math.max(14, Math.round(width * 0.015))}px 'Space Grotesk', sans-serif`;
    ctx.fillText(clip.shotType.toUpperCase(), width / 2, height / 2 + 25);
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * High Definition Video Timeline Exporter
   * Renders the entire stitched timeline (60s+ or whatever duration)
   * into a high-bitrate WebM / MP4 video with synced audio track.
   */
  public async exportVideo(
    clips: VideoClip[],
    aspectRatio: AspectRatio,
    resolution: '720p' | '1080p' | '4k',
    fps = 30,
    soundtrack = 'epic-orchestral',
    onProgress: (percent: number, currentTime: number, totalDuration: number) => void
  ): Promise<Blob> {
    await this.preloadClipImages(clips);

    const dims = getResolutionDimensions(resolution, aspectRatio);
    const totalDuration = this.getTotalDuration(clips);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = dims.width;
    offscreenCanvas.height = dims.height;

    // Start audio soundtrack & get media stream
    audioSynthesizer.init();
    audioSynthesizer.startSoundtrack(soundtrack);
    const audioStream = audioSynthesizer.getAudioStream();

    // Canvas video stream
    const canvasStream = offscreenCanvas.captureStream(fps);
    const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    if (audioStream && audioStream.getAudioTracks().length > 0) {
      combinedTracks.push(audioStream.getAudioTracks()[0]);
    }

    const exportStream = new MediaStream(combinedTracks);

    // Pick supported MIME type with high bitrate
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    }

    const bitrate = resolution === '4k' ? 24000000 : resolution === '1080p' ? 12000000 : 6000000;

    const recorder = new MediaRecorder(exportStream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        audioSynthesizer.stopSoundtrack();
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        resolve(finalBlob);
      };

      recorder.onerror = (err) => {
        audioSynthesizer.stopSoundtrack();
        reject(err);
      };

      recorder.start(100);

      // Frame-by-frame timeline progression
      const frameDuration = 1 / fps;
      let currentTime = 0;
      let lastClipId = '';

      const interval = window.setInterval(() => {
        if (currentTime >= totalDuration) {
          window.clearInterval(interval);
          setTimeout(() => {
            recorder.stop();
          }, 300);
          return;
        }

        // Check for clip change to trigger voiceover or transition SFX
        const clipInfo = this.getActiveClipAtTime(clips, currentTime);
        if (clipInfo && clipInfo.currentClip.id !== lastClipId) {
          lastClipId = clipInfo.currentClip.id;
          audioSynthesizer.playTransitionSFX(clipInfo.currentClip.transition);
          if (clipInfo.currentClip.voiceoverAudioUrl) {
            audioSynthesizer.playVoiceover(clipInfo.currentClip.voiceoverAudioUrl);
          }
        }

        // Render current time slice onto export canvas
        this.renderFrame(offscreenCanvas, clips, currentTime, aspectRatio, true);

        currentTime += frameDuration;
        const pct = Math.min(100, Math.round((currentTime / totalDuration) * 100));
        onProgress(pct, currentTime, totalDuration);
      }, frameDuration * 1000);
    });
  }
}

export const cinematicRenderer = new CinematicRenderer();
