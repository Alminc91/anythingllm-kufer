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
    this.#log(
      `Service (${process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT}) with model: ${this.model} and voice: ${this.voice}`
    );
  }

  #log(text, ...args) {
    console.log(`\x1b[32m[OpenAiGenericTTS]\x1b[0m ${text}`, ...args);
  }

  /**
   * Generates a buffer from the given text input using the OpenAI compatible TTS service.
   * Text is automatically normalized for better speech synthesis.
   * Language is auto-detected if TTS_LANGUAGE is set to 'auto'.
   * @param {string} textInput - The text to be converted to audio.
   * @returns {Promise<Buffer>} A buffer containing the audio data.
   */
  async ttsBuffer(textInput) {
    try {
      // Detect language if set to 'auto', otherwise use configured language
      let lang = this.language;
      if (this.language === 'auto') {
        lang = detectLanguage(textInput, 'de');
        this.#log(`Auto-detected language: ${lang}`);
      }

      // Normalize text for TTS (expand abbreviations, remove markdown, etc.)
      const normalizedText = normalizeTextForTTS(textInput, lang);
      this.#log(`Normalized text (${lang}, ${normalizedText.length} chars): "${normalizedText.substring(0, 100)}..."`);

      const result = await this.openai.audio.speech.create({
        model: this.model,
        voice: this.voice,
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
