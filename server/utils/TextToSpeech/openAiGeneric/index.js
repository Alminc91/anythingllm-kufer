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

    // Parse voice map for multilingual auto-detection
    // Format: TTS_VOICE_MAP={"de":"thorsten-low","en":"amy-low","tr":"turkish"}
    this.voiceMap = this.#parseVoiceMap();

    this.#log(
      `Service (${process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT}) with model: ${this.model} and default voice: ${this.voice}`
    );
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
}

module.exports = {
  GenericOpenAiTTS,
};
