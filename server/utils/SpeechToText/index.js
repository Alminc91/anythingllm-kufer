/**
 * Gets the configured STT (Speech-to-Text) provider instance.
 * @returns {Object|null} The STT provider instance or null if not configured
 */
function getSTTProvider() {
  const provider = process.env.STT_PROVIDER || "native";

  // Check for OpenAI-compatible endpoint first (regardless of provider setting)
  // This allows backward compatibility when endpoint is configured but provider is "native"
  if (process.env.STT_OPEN_AI_COMPATIBLE_ENDPOINT) {
    const { GenericOpenAiSTT } = require("./openAiGeneric");
    return new GenericOpenAiSTT();
  }

  switch (provider) {
    case "generic-openai":
      const { GenericOpenAiSTT } = require("./openAiGeneric");
      return new GenericOpenAiSTT();
    case "native":
      // Native browser STT - no server-side provider needed
      return null;
    default:
      console.log(
        `[STT] Provider "${provider}" not recognized. Using native browser STT.`
      );
      return null;
  }
}

/**
 * Checks if server-side STT is available and configured.
 * @returns {boolean} True if a server-side STT provider is configured
 */
function isSTTConfigured() {
  // Check for OpenAI-compatible endpoint first
  if (process.env.STT_OPEN_AI_COMPATIBLE_ENDPOINT) {
    const { GenericOpenAiSTT } = require("./openAiGeneric");
    return GenericOpenAiSTT.isConfigured();
  }

  const provider = process.env.STT_PROVIDER || "native";
  if (provider === "native") return false;

  switch (provider) {
    case "generic-openai":
      const { GenericOpenAiSTT } = require("./openAiGeneric");
      return GenericOpenAiSTT.isConfigured();
    default:
      return false;
  }
}

module.exports = { getSTTProvider, isSTTConfigured };
