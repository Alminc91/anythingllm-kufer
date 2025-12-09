const { normalizeTextForTTS, detectLanguage } = require("../ttsTextNormalizer");

class OpenAiTTS {
  constructor() {
    if (!process.env.TTS_OPEN_AI_KEY)
      throw new Error("No OpenAI API key was set.");
    const { OpenAI: OpenAIApi } = require("openai");
    this.openai = new OpenAIApi({
      apiKey: process.env.TTS_OPEN_AI_KEY,
    });
    this.voice = process.env.TTS_OPEN_AI_VOICE_MODEL ?? "alloy";
  }

  #log(text, ...args) {
    console.log(`\x1b[32m[OpenAiTTS]\x1b[0m ${text}`, ...args);
  }

  async ttsBuffer(textInput) {
    try {
      // Detect language and normalize text for better TTS output
      const lang = detectLanguage(textInput, 'de');
      const normalizedText = normalizeTextForTTS(textInput, lang);
      this.#log(`Normalized text (${lang}, ${normalizedText.length} chars)`);

      const result = await this.openai.audio.speech.create({
        model: "tts-1",
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
  OpenAiTTS,
};
