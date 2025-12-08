const { getSTTProvider, isSTTConfigured } = require("../utils/SpeechToText");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const multer = require("multer");

// Configure multer for audio file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept common audio formats
    const allowedMimes = [
      "audio/webm",
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/m4a",
      "audio/ogg",
      "audio/flac",
      "audio/x-flac",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported audio format: ${file.mimetype}. Supported formats: webm, wav, mp3, mp4, m4a, ogg, flac`
        ),
        false
      );
    }
  },
});

function audioEndpoints(app) {
  if (!app) return;

  /**
   * POST /api/audio/transcribe
   * Transcribes uploaded audio file to text using configured STT provider
   *
   * Request: multipart/form-data with 'audio' file field
   * Optional query params: language (e.g., 'de', 'en')
   *
   * Response: { success: true, text: "transcribed text" }
   */
  app.post(
    "/api/audio/transcribe",
    [validatedRequest, upload.single("audio")],
    async (request, response) => {
      try {
        // Check if STT is configured
        if (!isSTTConfigured()) {
          return response.status(400).json({
            success: false,
            error: "Speech-to-text is not configured. Please configure an STT provider in settings.",
          });
        }

        // Check if audio file was uploaded
        if (!request.file) {
          return response.status(400).json({
            success: false,
            error: "No audio file provided. Please upload an audio file.",
          });
        }

        // Get STT provider
        const sttProvider = getSTTProvider();
        if (!sttProvider) {
          return response.status(500).json({
            success: false,
            error: "Failed to initialize STT provider.",
          });
        }

        // Transcribe audio
        const options = {
          language: request.query.language || request.body.language || null,
          filename: request.file.originalname || "audio.webm",
        };

        const result = await sttProvider.transcribe(request.file.buffer, options);

        response.json({
          success: true,
          text: result.text,
        });
      } catch (error) {
        console.error("[Audio Transcribe] Error:", error.message);
        response.status(500).json({
          success: false,
          error: error.message || "Failed to transcribe audio.",
        });
      }
    }
  );

  /**
   * GET /api/audio/stt-status
   * Returns whether server-side STT is configured and available
   *
   * Response: { configured: boolean, provider: string }
   */
  app.get(
    "/api/audio/stt-status",
    [validatedRequest],
    async (request, response) => {
      try {
        const provider = process.env.STT_PROVIDER || "native";
        const configured = isSTTConfigured();

        response.json({
          configured,
          provider: configured ? provider : "native",
        });
      } catch (error) {
        console.error("[Audio STT Status] Error:", error.message);
        response.status(500).json({
          configured: false,
          provider: "native",
          error: error.message,
        });
      }
    }
  );
}

module.exports = { audioEndpoints };
