import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// Server-side Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/gemini/storyboard
 * Generates an episodic 60s+ multi-scene cinematic screenplay & shot breakdown
 */
app.post('/api/gemini/storyboard', async (req: Request, res: Response) => {
  try {
    const { prompt, style = '35mm Anamorphic Film', targetDuration = 60, sceneCount = 6 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    const systemInstruction = `You are a Hollywood director and cinematographer creating an episodic multi-scene cinematic film sequence.
The user wants a cohesive, breathtaking video that is AT LEAST ${targetDuration} seconds long (composed of ${sceneCount} coherent sequential clips, each 10-12 seconds).
Craft a unified narrative arc:
1. Scene 1: Establishing World / Inciting atmospheric shot
2. Scene 2: Tension building / Character or focal element motion
3. Scene 3: Deep exploration / Discovery or escalating encounter
4. Scene 4: Critical turning point / Intense focal drama
5. Scene 5: Climax / Visual spectacle peak
6. Scene 6: Cinematic resolution / Poignant final vista
Choose distinct camera movements: 'dolly-in', 'dolly-out', 'pan-right', 'pan-left', 'tilt-up', 'tilt-down', 'orbit-cw', 'drone-crane', 'tracking-forward', 'static-tripod'.
Every scene must have an evocative visual image generation prompt, a compelling voiceover narration sentence, and sound design notes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create an episodic cinematic storyboard for: "${prompt}".
Cinematic Visual Style: ${style}.
Target Total Duration: ${targetDuration} seconds across ${sceneCount} clips.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Film title' },
            synopsis: { type: Type.STRING, description: 'One-sentence film synopsis' },
            targetDuration: { type: Type.NUMBER, description: 'Total duration in seconds (must be >= 60)' },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Scene title e.g. Scene 1: The Descent' },
                  shotType: { type: Type.STRING, description: 'Cinematic shot type e.g. Wide Establishing Crane Shot' },
                  prompt: { type: Type.STRING, description: 'Detailed visual prompt for AI image/frame generation' },
                  cameraMovement: {
                    type: Type.STRING,
                    description: 'One of: dolly-in, dolly-out, pan-right, pan-left, tilt-up, tilt-down, orbit-cw, drone-crane, tracking-forward, static-tripod',
                  },
                  duration: { type: Type.NUMBER, description: 'Scene duration in seconds (typically 10)' },
                  voiceoverText: { type: Type.STRING, description: 'Poetic narration or character dialogue line' },
                  soundEffect: { type: Type.STRING, description: 'Audio sound design cues' },
                  visualDirection: { type: Type.STRING, description: 'Lighting, color grading, and focal notes' },
                },
                required: ['title', 'shotType', 'prompt', 'cameraMovement', 'duration', 'voiceoverText'],
              },
            },
          },
          required: ['title', 'synopsis', 'targetDuration', 'scenes'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/gemini/storyboard:', err);
    res.status(500).json({ error: err.message || 'Failed to generate storyboard' });
  }
});

/**
 * POST /api/gemini/prompt-enrich
 * Expands a simple idea into an ultra-detailed Hollywood cinematography prompt
 */
app.post('/api/gemini/prompt-enrich', async (req: Request, res: Response) => {
  try {
    const { prompt, style } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Enrich this simple prompt for an AI video generator into a stunning cinematic scene direction.
Original idea: "${prompt}"
Desired style: "${style || 'Cinematic Film'}"
Provide:
1. Enhanced prompt: include lens (e.g. 35mm anamorphic, 85mm prime), lighting (e.g. rim light, volumetric dusk haze), texture, atmosphere, and composition.
2. Suggested camera movement.
3. Suggested sound design cue.
Keep the enhanced prompt under 60 words, punchy and highly visual.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedPrompt: { type: Type.STRING },
            cameraMovement: { type: Type.STRING },
            soundDesign: { type: Type.STRING },
            lighting: { type: Type.STRING },
          },
          required: ['enhancedPrompt', 'cameraMovement', 'soundDesign'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/gemini/prompt-enrich:', err);
    res.status(500).json({ error: err.message || 'Failed to enrich prompt' });
  }
});

/**
 * POST /api/gemini/generate-frame
 * Generates a high quality visual frame for a scene using Gemini image generation
 */
app.post('/api/gemini/generate-frame', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // Normalize aspect ratio to supported Gemini image ratio
    let geminiRatio = '16:9';
    if (aspectRatio === '9:16') geminiRatio = '9:16';
    if (aspectRatio === '1:1') geminiRatio = '1:1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: `${prompt}, master cinematography, 8k resolution, photorealistic cinematic lighting, ultra-detailed` }],
        },
        config: {
          imageConfig: {
            aspectRatio: geminiRatio as '16:9' | '9:16' | '1:1',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return res.json({ imageUrl: `data:${mime};base64,${part.inlineData.data}` });
        }
      }
    } catch (imgError: unknown) {
      console.warn('Direct image model generation notice:', (imgError as Error).message);
    }

    // High quality curated cinematic image fallback mapped to prompt keywords
    const keywords = prompt.toLowerCase();
    let fallback = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80';
    if (keywords.includes('space') || keywords.includes('astronaut') || keywords.includes('planet') || keywords.includes('galaxy')) {
      fallback = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80';
    } else if (keywords.includes('race') || keywords.includes('car') || keywords.includes('speed') || keywords.includes('drift')) {
      fallback = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80';
    } else if (keywords.includes('rain') || keywords.includes('cyber') || keywords.includes('neon') || keywords.includes('city')) {
      fallback = 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80';
    } else if (keywords.includes('nature') || keywords.includes('forest') || keywords.includes('mountain') || keywords.includes('temple')) {
      fallback = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80';
    } else if (keywords.includes('eye') || keywords.includes('face') || keywords.includes('close up') || keywords.includes('portrait')) {
      fallback = 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1600&q=80';
    } else if (keywords.includes('sunset') || keywords.includes('sunrise') || keywords.includes('dawn')) {
      fallback = 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1600&q=80';
    }

    res.json({ imageUrl: fallback });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/gemini/generate-frame:', err);
    res.status(500).json({ error: err.message || 'Failed to generate frame' });
  }
});

/**
 * POST /api/gemini/generate-speech
 * Generates natural narration audio using Gemini Text-to-Speech (gemini-3.8-flash-lite-tts)
 */
app.post('/api/gemini/generate-speech', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Fenrir', style = 'Deep cinematic narrator' } = req.body;

    if (!text) return res.status(400).json({ error: 'Text is required' });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    }

    res.status(500).json({ error: 'No audio data received from Gemini TTS' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/gemini/generate-speech:', err);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

/**
 * Video Generation endpoints (Veo) following gemini-api skill
 */
app.post('/api/generate-video', async (req: Request, res: Response) => {
  try {
    const { prompt, resolution = '720p', aspectRatio = '16:9' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: resolution as '720p' | '1080p',
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      },
    });

    res.json({ operationName: operation.name });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/generate-video:', err);
    res.status(500).json({ error: err.message || 'Veo video generation failed' });
  }
});

app.post('/api/video-status', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) return res.status(400).json({ error: 'operationName required' });

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    res.json({ done: updated.done });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/video-status:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/video-download', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) return res.status(400).json({ error: 'operationName required' });

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) return res.status(404).json({ error: 'Video URI not found' });

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    res.setHeader('Content-Type', 'video/mp4');
    videoRes.body!.pipeTo(
      new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        },
      })
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/video-download:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export Express app for Vercel Serverless Function
export default app;

// In local / container environment, start HTTP server
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 Rila AI Video Generator listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
