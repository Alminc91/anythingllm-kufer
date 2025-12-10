function getTTSProvider() {
  const provider = process.env.TTS_PROVIDER || "openai";
  switch (provider) {
    case "openai":
      const { OpenAiTTS } = require("./openAi");
      return new OpenAiTTS();
    case "elevenlabs":
      const { ElevenLabsTTS } = require("./elevenLabs");
      return new ElevenLabsTTS();
    case "generic-openai":
      const { GenericOpenAiTTS } = require("./openAiGeneric");
      return new GenericOpenAiTTS();
    default:
      throw new Error("ENV: No TTS_PROVIDER value found in environment!");
  }
}

/**
 * Checks if server-side TTS is available and configured.
 * @returns {boolean} True if a server-side TTS provider is configured
 */
function isTTSConfigured() {
  const provider = process.env.TTS_PROVIDER;
  if (!provider || provider === "native") return false;

  switch (provider) {
    case "openai":
      // OpenAI TTS requires API key
      return !!process.env.OPEN_AI_KEY;
    case "elevenlabs":
      // ElevenLabs requires API key
      return !!process.env.TTS_ELEVEN_LABS_KEY;
    case "generic-openai":
      // Generic OpenAI-compatible requires endpoint
      return !!process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT;
    default:
      return false;
  }
}

module.exports = { getTTSProvider, isTTSConfigured };
