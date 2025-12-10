import { useEffect, useCallback, useRef, useState } from "react";
import { Microphone } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import _regeneratorRuntime from "regenerator-runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { PROMPT_INPUT_EVENT } from "../../PromptInput";
import { useTranslation } from "react-i18next";
import Appearance from "@/models/appearance";
import { API_BASE, AUTH_TOKEN } from "@/utils/constants";

let timeout;
const SILENCE_INTERVAL = 3_200; // wait in seconds of silence before closing.

/**
 * Speech-to-text input component for the chat window.
 * Uses server-side STT (Groq Whisper) if configured, falls back to browser Web Speech API.
 * @param {Object} props - The component props
 * @param {(textToAppend: string, autoSubmit: boolean) => void} props.sendCommand - The function to send the command
 * @returns {React.ReactElement} The SpeechToText component
 */
export default function SpeechToText({ sendCommand }) {
  const previousTranscriptRef = useRef("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [serverSTTAvailable, setServerSTTAvailable] = useState(null);
  const [sttProvider, setSttProvider] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
  } = useSpeechRecognition({
    clearTranscriptOnListen: true,
  });
  const { t } = useTranslation();

  // Check if server-side STT is available on mount
  useEffect(() => {
    checkServerSTT();
  }, []);

  async function checkServerSTT() {
    try {
      const token = window.localStorage.getItem(AUTH_TOKEN);
      const response = await fetch(`${API_BASE}/audio/stt-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        const isServerSTT = data.configured && data.provider !== "native";
        setServerSTTAvailable(isServerSTT);
        if (isServerSTT) {
          setSttProvider(data.provider);
          console.log(`[STT] Server STT available: ${data.provider}`);
        }
      } else {
        setServerSTTAvailable(false);
      }
    } catch (e) {
      console.log("[STT] Server STT not available, using browser fallback");
      setServerSTTAvailable(false);
    }
  }

  // Server-side STT using MediaRecorder
  async function startServerSTT() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) {
          setIsRecording(false);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        // Send to server for transcription
        await transcribeAudio(audioBlob);
        setIsRecording(false);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Auto-stop after silence interval
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        stopServerSTT();
      }, SILENCE_INTERVAL * 3); // Give more time for server STT

    } catch (e) {
      console.error("[STT] Failed to start recording:", e);
      alert("Could not access microphone. Please check permissions.");
      setIsRecording(false);
    }
  }

  function stopServerSTT() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    clearTimeout(timeout);
  }

  async function transcribeAudio(audioBlob) {
    try {
      const token = window.localStorage.getItem(AUTH_TOKEN);
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      // Add language hint based on browser language
      const lang = window?.navigator?.language?.split("-")[0] || "de";

      const response = await fetch(`${API_BASE}/audio/transcribe?language=${lang}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text) {
          sendCommand({
            text: data.text,
            autoSubmit: Appearance.get("autoSubmitSttInput"),
            writeMode: "replace",
          });
        }
      } else {
        const error = await response.json();
        console.error("[STT] Transcription failed:", error);
      }
    } catch (e) {
      console.error("[STT] Failed to transcribe:", e);
    }
  }

  // Browser-native STT (fallback)
  function startBrowserSTT() {
    if (!isMicrophoneAvailable) {
      alert(
        "AnythingLLM does not have access to microphone. Please enable for this site to use this feature."
      );
      return;
    }

    resetTranscript();
    previousTranscriptRef.current = "";
    SpeechRecognition.startListening({
      continuous: browserSupportsContinuousListening,
      language: window?.navigator?.language ?? "en-US",
    });
  }

  function endBrowserSTT() {
    SpeechRecognition.stopListening();

    // If auto submit is enabled, send an empty string to the chat window to submit the current transcript
    // since every chunk of text should have been streamed to the chat window by now.
    if (Appearance.get("autoSubmitSttInput")) {
      sendCommand({
        text: "",
        autoSubmit: true,
        writeMode: "append",
      });
    }

    resetTranscript();
    previousTranscriptRef.current = "";
    clearTimeout(timeout);
  }

  // Unified start/stop functions
  function startSTTSession() {
    if (serverSTTAvailable) {
      startServerSTT();
    } else {
      startBrowserSTT();
    }
  }

  function endSTTSession() {
    if (serverSTTAvailable) {
      stopServerSTT();
    } else {
      endBrowserSTT();
    }
  }

  const isActive = serverSTTAvailable ? isRecording : listening;

  const handleKeyPress = useCallback(
    (event) => {
      // CTRL + m on Mac and Windows to toggle STT listening
      if (event.ctrlKey && event.keyCode === 77) {
        if (isActive) {
          endSTTSession();
        } else {
          startSTTSession();
        }
      }
    },
    [isActive, serverSTTAvailable]
  );

  function handlePromptUpdate(e) {
    if (!e?.detail && timeout) {
      endSTTSession();
      clearTimeout(timeout);
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    if (!!window)
      window.addEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate);
    return () =>
      window?.removeEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate);
  }, []);

  // Browser STT transcript streaming (only when using browser STT)
  useEffect(() => {
    if (!serverSTTAvailable && transcript?.length > 0 && listening) {
      const previousTranscript = previousTranscriptRef.current;
      const newContent = transcript.slice(previousTranscript.length);

      // Stream just the diff of the new content since transcript is an accumulating string.
      // and not just the new content transcribed.
      if (newContent.length > 0)
        sendCommand({ text: newContent, writeMode: "append" });

      previousTranscriptRef.current = transcript;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        endSTTSession();
      }, SILENCE_INTERVAL);
    }
  }, [transcript, listening, serverSTTAvailable]);

  // Don't render if neither server STT nor browser STT is available
  if (!serverSTTAvailable && !browserSupportsSpeechRecognition) return null;

  return (
    <div
      data-tooltip-id="tooltip-microphone-btn"
      data-tooltip-content={`${t("chat_window.microphone")} (CTRL + M)${serverSTTAvailable ? " [Server]" : ""}`}
      aria-label={t("chat_window.microphone")}
      onClick={isActive ? endSTTSession : startSTTSession}
      className={`border-none relative flex justify-center items-center opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60 cursor-pointer ${
        !!isActive ? "!opacity-100" : ""
      }`}
    >
      <Microphone
        weight="fill"
        color={serverSTTAvailable ? "var(--theme-sidebar-footer-icon-fill)" : "var(--theme-sidebar-footer-icon-fill)"}
        className={`w-[22px] h-[22px] pointer-events-none text-theme-text-primary ${
          isActive ? "animate-pulse-glow" : ""
        }`}
      />
      <Tooltip
        id="tooltip-microphone-btn"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </div>
  );
}
