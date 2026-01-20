const { normalizeTextForTTS, detectLanguage } = require("../ttsTextNormalizer");

class GenericOpenAiTTS {
  constructor() {
    if (!process.env.TTS_OPEN_AI_COMPATIBLE_KEY)
      this.#log(
        "No OpenAI compatible API key was set. You might need to set this to use your OpenAI compatible TTS service."
      );
    if (!process.env.TTS_OPEN_AI_COMPATIBLE_MODEL)
      this.#log(
        "No OpenAI compatible TTS model was set. We will use the default voice model 'tts-1'. This may not exist or be valid your selected endpoint."
      );
    if (!process.env.TTS_OPEN_AI_COMPATIBLE_VOICE_MODEL)
      this.#log(
        "No OpenAI compatible voice model was set. We will use the default voice model 'alloy'. This may not exist for your selected endpoint."
      );
    if (!process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT)
      throw new Error(
        "No OpenAI compatible endpoint was set. Please set this to use your OpenAI compatible TTS service."
      );

    const { OpenAI: OpenAIApi } = require("openai");
    this.openai = new OpenAIApi({
      apiKey: process.env.TTS_OPEN_AI_COMPATIBLE_KEY || null,
      baseURL: process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT,
    });
    this.model = process.env.TTS_OPEN_AI_COMPATIBLE_MODEL ?? "tts-1";
    this.voice = process.env.TTS_OPEN_AI_COMPATIBLE_VOICE_MODEL ?? "alloy";
    this.language = process.env.TTS_LANGUAGE ?? "de";
    this.endpoint = process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT;

    // Chatterbox-specific settings
    // cfg_weight=0 disables voice cloning accent, enabling native language pronunciation
    this.cfgWeight = process.env.TTS_CFG_WEIGHT !== undefined
      ? parseFloat(process.env.TTS_CFG_WEIGHT)
      : null;
    this.exaggeration = process.env.TTS_EXAGGERATION !== undefined
      ? parseFloat(process.env.TTS_EXAGGERATION)
      : null;

    // Parse voice map for multilingual auto-detection
    // Format: TTS_VOICE_MAP={"de":"thorsten-low","en":"amy-low","tr":"turkish"}
    this.voiceMap = this.#parseVoiceMap();

    this.#log(
      `Service (${this.endpoint}) with model: ${this.model} and default voice: ${this.voice}`
    );
    if (this.cfgWeight !== null) {
      this.#log(`Chatterbox cfg_weight: ${this.cfgWeight} (0 = native accent, 0.5 = clone accent)`);
    }
    if (Object.keys(this.voiceMap).length > 0) {
      this.#log(`Voice map configured for languages: ${Object.keys(this.voiceMap).join(', ')}`);
    }
  }

  /**
   * Parse TTS_VOICE_MAP environment variable
   * @returns {Object} Map of language codes to voice names
   */
  #parseVoiceMap() {
    try {
      const mapStr = process.env.TTS_VOICE_MAP;
      if (!mapStr) return {};

      const parsed = JSON.parse(mapStr);
      if (typeof parsed !== 'object' || parsed === null) return {};

      return parsed;
    } catch (error) {
      this.#log(`Warning: Could not parse TTS_VOICE_MAP: ${error.message}`);
      return {};
    }
  }

  /**
   * Get voice for a specific language, with fallback to default
   * @param {string} lang - ISO 639-1 language code (e.g., 'de', 'en', 'tr')
   * @returns {string} Voice name to use
   */
  #getVoiceForLanguage(lang) {
    if (this.voiceMap[lang]) {
      return this.voiceMap[lang];
    }
    return this.voice; // Fall back to default voice from UI/env
  }

  #log(text, ...args) {
    console.log(`\x1b[32m[OpenAiGenericTTS]\x1b[0m ${text}`, ...args);
  }

  /**
   * Generates a buffer from the given text input using the OpenAI compatible TTS service.
   * Text is automatically normalized for better speech synthesis.
   * Language is auto-detected if TTS_LANGUAGE is set to 'auto' or if TTS_VOICE_MAP is configured.
   * @param {string} textInput - The text to be converted to audio.
   * @returns {Promise<Buffer>} A buffer containing the audio data.
   */
  async ttsBuffer(textInput) {
    try {
      // Detect language:
      // - If TTS_LANGUAGE='auto', always detect
      // - If TTS_VOICE_MAP is configured, detect to select appropriate voice
      // - Otherwise use configured language
      let lang = this.language;
      const hasVoiceMap = Object.keys(this.voiceMap).length > 0;

      if (this.language === 'auto' || hasVoiceMap) {
        lang = detectLanguage(textInput, 'de');
        this.#log(`Auto-detected language: ${lang}`);
      }

      // Get voice for detected language (or fall back to default)
      const selectedVoice = this.#getVoiceForLanguage(lang);
      if (selectedVoice !== this.voice) {
        this.#log(`Using language-specific voice: ${selectedVoice} (for ${lang})`);
      }

      // Normalize text for TTS (expand abbreviations, remove markdown, etc.)
      const normalizedText = normalizeTextForTTS(textInput, lang);
      this.#log(`Normalized text (${lang}, ${normalizedText.length} chars): "${normalizedText.substring(0, 100)}..."`);

      // Build request body
      const requestBody = {
        model: this.model,
        voice: selectedVoice,
        input: normalizedText,
      };

      // Add Chatterbox Multilingual parameters
      // language: detected language code for native pronunciation
      if (this.cfgWeight !== null || this.language === 'auto') {
        requestBody.language = lang;  // Send detected language (de, en, fr, etc.)
      }
      if (this.cfgWeight !== null) requestBody.cfg_weight = this.cfgWeight;
      if (this.exaggeration !== null) requestBody.exaggeration = this.exaggeration;

      // Use direct fetch if we have extra parameters (OpenAI SDK doesn't support them)
      if (this.cfgWeight !== null || this.exaggeration !== null) {
        this.#log(`Using direct API call with cfg_weight=${this.cfgWeight}, exaggeration=${this.exaggeration}`);
        const response = await fetch(`${this.endpoint}/audio/speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.TTS_OPEN_AI_COMPATIBLE_KEY && {
              'Authorization': `Bearer ${process.env.TTS_OPEN_AI_COMPATIBLE_KEY}`
            })
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
        }

        return Buffer.from(await response.arrayBuffer());
      }

      // Standard OpenAI SDK call
      const result = await this.openai.audio.speech.create({
        model: this.model,
        voice: selectedVoice,
        input: normalizedText,
      });
      return Buffer.from(await result.arrayBuffer());
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  /**
   * Streams TTS audio to a response object.
   * Converts WAV from TTS provider to MP3 or WebM/Opus on-the-fly using ffmpeg.
   * Uses chunked transfer encoding for progressive playback with MediaSource API.
   * @param {string} textInput - The text to be converted to audio.
   * @param {import('express').Response} res - Express response object to stream to.
   * @param {string} format - Output format: 'mp3' (default) or 'webm' (for Firefox)
   * @returns {Promise<boolean>} True if streaming succeeded, false otherwise.
   */
  async ttsStream(textInput, res, format = 'mp3') {
    const { spawn } = require('child_process');

    try {
      // Detect language (same logic as ttsBuffer)
      let lang = this.language;
      const hasVoiceMap = Object.keys(this.voiceMap).length > 0;

      if (this.language === 'auto' || hasVoiceMap) {
        lang = detectLanguage(textInput, 'de');
        this.#log(`[Stream] Auto-detected language: ${lang}`);
      }

      // Get voice for detected language
      const selectedVoice = this.#getVoiceForLanguage(lang);
      if (selectedVoice !== this.voice) {
        this.#log(`[Stream] Using language-specific voice: ${selectedVoice} (for ${lang})`);
      }

      // Normalize text for TTS
      const normalizedText = normalizeTextForTTS(textInput, lang);
      this.#log(`[Stream] Normalized text (${lang}, ${normalizedText.length} chars): "${normalizedText.substring(0, 100)}..."`);

      // Build request body
      const requestBody = {
        model: this.model,
        voice: selectedVoice,
        input: normalizedText,
      };

      // Add Chatterbox Multilingual parameters
      if (this.cfgWeight !== null || this.language === 'auto') {
        requestBody.language = lang;
      }
      if (this.cfgWeight !== null) requestBody.cfg_weight = this.cfgWeight;
      if (this.exaggeration !== null) requestBody.exaggeration = this.exaggeration;

      // Try Chatterbox streaming endpoint first (real-time streaming)
      // Falls back to standard OpenAI-compatible endpoint if not available
      const streamEndpoint = this.endpoint.replace('/v1', '') + '/audio/speech/stream';
      const standardEndpoint = `${this.endpoint}/audio/speech`;

      this.#log(`[Stream] Trying streaming endpoint: ${streamEndpoint}`);
      const startTime = Date.now();

      let response;
      try {
        response = await fetch(streamEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.TTS_OPEN_AI_COMPATIBLE_KEY && {
              'Authorization': `Bearer ${process.env.TTS_OPEN_AI_COMPATIBLE_KEY}`
            })
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Streaming endpoint returned ${response.status}`);
        }
        this.#log(`[Stream] Using real-time streaming endpoint`);
      } catch (streamError) {
        // Fallback to standard endpoint
        this.#log(`[Stream] Streaming endpoint not available, using standard: ${standardEndpoint}`);
        response = await fetch(standardEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.TTS_OPEN_AI_COMPATIBLE_KEY && {
              'Authorization': `Bearer ${process.env.TTS_OPEN_AI_COMPATIBLE_KEY}`
            })
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
        }
      }

      // Check Content-Type to determine if we need ffmpeg conversion
      const contentType = response.headers.get('content-type') || '';
      const isMP3 = contentType.includes('audio/mpeg') || contentType.includes('audio/mp3');
      const isWAV = contentType.includes('audio/wav') || contentType.includes('audio/wave');

      this.#log(`[Stream] Response Content-Type: ${contentType} (isMP3=${isMP3}, isWAV=${isWAV})`);

      let firstChunkTime = null;
      let totalBytes = 0;
      const reader = response.body.getReader();

      // If already MP3, stream directly without ffmpeg conversion
      if (isMP3) {
        this.#log(`[Stream] Provider returns MP3 - streaming directly without conversion`);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (firstChunkTime === null) {
            firstChunkTime = Date.now();
            this.#log(`[Stream] First MP3 chunk after ${firstChunkTime - startTime}ms`);
          }
          totalBytes += value.length;
          res.write(Buffer.from(value));
        }

        const totalTime = Date.now() - startTime;
        this.#log(`[Stream] Completed: ${totalBytes} bytes MP3 in ${totalTime}ms (first chunk: ${firstChunkTime ? firstChunkTime - startTime : 'N/A'}ms)`);
        return true;
      }

      // WAV or unknown format: use ffmpeg to convert on-the-fly
      // Supports MP3 (Chrome/Edge/Brave) and WebM/Opus (Firefox)
      const ffmpegArgs = format === 'webm'
        ? ['-f', 'wav', '-i', 'pipe:0', '-c:a', 'libopus', '-b:a', '96k', '-f', 'webm', '-y', 'pipe:1']
        : ['-f', 'wav', '-i', 'pipe:0', '-f', 'mp3', '-b:a', '128k', '-y', 'pipe:1'];

      this.#log(`[Stream] Converting WAV to ${format.toUpperCase()} via ffmpeg`);
      const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Pipe ffmpeg stdout to Express response
      ffmpeg.stdout.on('data', (chunk) => {
        if (firstChunkTime === null) {
          firstChunkTime = Date.now();
          this.#log(`[Stream] First ${format.toUpperCase()} chunk after ${firstChunkTime - startTime}ms`);
        }
        totalBytes += chunk.length;
        res.write(chunk);
      });

      ffmpeg.stderr.on('data', (data) => {
        // ffmpeg writes progress to stderr, ignore unless debugging
        // this.#log(`[ffmpeg] ${data.toString()}`);
      });

      // Read from TTS provider and pipe to ffmpeg
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Write chunk to ffmpeg stdin
        ffmpeg.stdin.write(Buffer.from(value));
      }

      // Close ffmpeg stdin to signal end of input
      ffmpeg.stdin.end();

      // Wait for ffmpeg to finish
      await new Promise((resolve, reject) => {
        ffmpeg.on('close', (code) => {
          const totalTime = Date.now() - startTime;
          if (code === 0) {
            this.#log(`[Stream] Completed: ${totalBytes} bytes ${format.toUpperCase()} in ${totalTime}ms (first chunk: ${firstChunkTime ? firstChunkTime - startTime : 'N/A'}ms)`);
            resolve();
          } else {
            this.#log(`[Stream] ffmpeg exited with code ${code}`);
            reject(new Error(`ffmpeg exited with code ${code}`));
          }
        });
        ffmpeg.on('error', reject);
      });

      return true;
    } catch (e) {
      console.error('[OpenAiGenericTTS] Stream error:', e);
      return false;
    }
  }
}

module.exports = {
  GenericOpenAiTTS,
};
