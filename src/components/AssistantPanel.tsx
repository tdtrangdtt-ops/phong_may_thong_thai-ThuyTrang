import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, HelpCircle, Volume2, Sparkles, AlertCircle, Sliders, VolumeX, Mic, MicOff } from "lucide-react";
import { ChatMessage } from "../types";
import { playSoundByName, playMouseClick } from "../utils/audio";

interface AssistantPanelProps {
  currentAction: string;
  subtitleText: string;
  onAskGemini: (text: string) => void;
  isLoading: boolean;
  stepHint?: string;
}

export default function AssistantPanel({
  currentAction,
  subtitleText,
  onAskGemini,
  isLoading,
  stepHint
}: AssistantPanelProps) {
  const [userInput, setUserInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [viVoices, setViVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [voicePitch, setVoicePitch] = useState<number>(1.25);
  const [voiceRate, setVoiceRate] = useState<number>(0.9);
  const [showVoiceConfig, setShowVoiceConfig] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Quick preset questions for kids (Vietnamese Grade 1-2 friendly)
  const QUICK_QUESTIONS = [
    { text: "Bật máy thế nào ạ?", label: "Cách bật máy" },
    { text: "Tại sao không được rút điện đột ngột?", label: "Tại sao rút điện nguy hiểm?" },
    { text: "Thân máy (CPU) có tác dụng gì?", label: "Tìm hiểu Thân máy" },
    { text: "Làm sao để tắt máy an toàn?", label: "Cách tắt máy" }
  ];

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        if (!synthRef.current) return;
        const allVoices = synthRef.current.getVoices();
        const filtered = allVoices.filter(v => 
          v.lang.toLowerCase().startsWith("vi") || 
          v.lang.toLowerCase().includes("vn")
        );
        setViVoices(filtered);
        
        // Default to Microsoft HoaiMy (Southern voice) or saved one
        const savedVoice = localStorage.getItem("selected_voice_uri") || "microsoft-hoaimy-south";
        if (savedVoice === "microsoft-hoaimy-south" || savedVoice === "microsoft-namminh-north" || savedVoice === "google-tts-online") {
          setSelectedVoiceURI(savedVoice);
        } else if (savedVoice && filtered.some(v => v.voiceURI === savedVoice)) {
          setSelectedVoiceURI(savedVoice);
        } else {
          setSelectedVoiceURI("microsoft-hoaimy-south");
        }
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    const savedPitch = localStorage.getItem("voice_pitch");
    if (savedPitch) setVoicePitch(parseFloat(savedPitch));

    const savedRate = localStorage.getItem("voice_rate");
    if (savedRate) setVoiceRate(parseFloat(savedRate));

    return () => {
      stopSpeaking();
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = "vi-VN";
        rec.interimResults = false;

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          if (result && result.trim()) {
            setUserInput(result.trim());
          }
        };

        rec.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Whenever subtitle changes, speak it if supported
  useEffect(() => {
    if (subtitleText) {
      speakVietnamese(subtitleText);
    }
  }, [subtitleText]);

  const speakVietnamese = (text: string) => {
    stopSpeaking();

    // Clean text from any technical tags
    const cleanText = text.replace(/[\{\}\[\]\n]/g, " ").trim();
    if (!cleanText) return;

    if (selectedVoiceURI === "microsoft-hoaimy-south" || selectedVoiceURI === "microsoft-namminh-north") {
      playEdgeTTS(cleanText, selectedVoiceURI);
    } else if (selectedVoiceURI === "google-tts-online" || !synthRef.current) {
      playGoogleTTS(cleanText);
    } else {
      // Use native SpeechSynthesis
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utteranceRef.current = utterance;

        // Try to find selected Vietnamese voice
        const voices = synthRef.current.getVoices();
        let viVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (!viVoice) {
          viVoice = voices.find(v => v.lang.toLowerCase().startsWith("vi") || v.lang.toLowerCase().includes("vn"));
        }

        if (viVoice) {
          utterance.voice = viVoice;
        }
        utterance.lang = "vi-VN";
        utterance.pitch = voicePitch; 
        utterance.rate = voiceRate;  

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis error, falling back to Google TTS:", err);
        playGoogleTTS(cleanText);
      }
    }
  };

  const playEdgeTTS = (text: string, voiceKey: string) => {
    try {
      const voice = voiceKey === "microsoft-hoaimy-south" ? "vi-VN-HoaiMyNeural" : "vi-VN-NamMinhNeural";
      const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}&rate=${voiceRate}&pitch=${voicePitch}`;
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = (e) => {
        console.warn("Edge TTS audio play failed, falling back to Google TTS:", e);
        playGoogleTTS(text);
      };
      
      audio.play().catch(err => {
        console.warn("Edge TTS audio play failed:", err);
        playGoogleTTS(text);
      });
    } catch (e) {
      console.warn("Edge TTS initialization failed, falling back to Google:", e);
      playGoogleTTS(text);
    }
  };

  const playGoogleTTS = (text: string) => {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      audioRef.current = audio;
      
      // Set playback speed (rate)
      audio.playbackRate = voiceRate;
      
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      
      audio.play().catch(err => {
        console.warn("Google TTS audio play failed:", err);
        setIsSpeaking(false);
      });
    } catch (e) {
      console.warn("Google TTS initialization failed:", e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (e) {}
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {}
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleMicClick = () => {
    playMouseClick();
    if (!recognitionRef.current) {
      alert("Trình duyệt của bạn nhỏ không hỗ trợ nhận diện giọng nói. Hãy dùng trình duyệt Google Chrome để sử dụng chức năng này nhé!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserInput("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech recognition start failed:", err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    onAskGemini(userInput.trim());
    setUserInput("");
  };

  // Helper to get matching emoji or animations based on visualAction
  const getAvatarAnimation = () => {
    switch (currentAction) {
      case "Lo_Lắng":
      case "Worried":
        return {
          emoji: "😰",
          bgColor: "bg-red-50 border-red-200",
          bubbleColor: "bg-red-100 border-red-200 text-red-800",
          animate: { y: [0, -5, 0], rotate: [-2, 2, -2] }
        };
      case "Suy_Nghĩ":
      case "Thinking":
        return {
          emoji: "🤔",
          bgColor: "bg-amber-50 border-amber-200",
          bubbleColor: "bg-amber-50 border-amber-200 text-amber-800",
          animate: { rotate: [0, 5, -5, 0], scale: [1, 1.02, 1] }
        };
      case "Nháy_Mắt":
      case "Wink":
        return {
          emoji: "😉",
          bgColor: "bg-emerald-50 border-emerald-200",
          bubbleColor: "bg-emerald-50 border-emerald-200 text-emerald-800",
          animate: { scale: [1, 1.08, 1], y: [0, -4, 0] }
        };
      case "Cổ_Vũ":
      case "Cheering":
        return {
          emoji: "🙌",
          bgColor: "bg-sky-50 border-sky-200",
          bubbleColor: "bg-sky-100 border-sky-200 text-sky-900 font-bold",
          animate: { y: [0, -12, 0, -8, 0], scale: [1, 1.1, 1] }
        };
      case "Vẫy_Tay":
      case "Waving":
      default:
        return {
          emoji: "🐭",
          bgColor: "bg-indigo-50 border-indigo-200",
          bubbleColor: "bg-white border-indigo-100 text-slate-800",
          animate: { rotate: [0, -10, 10, -10, 0] }
        };
    }
  };

  const config = getAvatarAnimation();

  return (
    <div id="assistant-panel" className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex flex-col h-full justify-between">
      {/* 1. Header with character status */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="font-sans font-semibold text-slate-700 text-sm">
            Trợ Lý: Chú Chuột Thông Thái
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              playMouseClick();
              setShowVoiceConfig(!showVoiceConfig);
            }}
            className={`p-2 rounded-full hover:bg-slate-100 transition ${showVoiceConfig ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
            title="Cài đặt giọng nói"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => speakVietnamese(subtitleText)}
            disabled={!subtitleText}
            className="p-2 rounded-full hover:bg-slate-100 transition text-indigo-600 disabled:opacity-40"
            title="Nghe lại giọng nói"
            id="btn-voice-replay"
          >
            <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-bounce" : ""}`} />
          </button>
        </div>
      </div>

      {/* Voice Configuration Panel */}
      {showVoiceConfig && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 text-xs flex flex-col gap-2.5">
          <span className="font-bold text-slate-700 block">⚙️ Giọng nói Tiếng Việt của bé:</span>
          
          {/* Dropdown to select voice */}
          <div>
            <label className="text-slate-500 block mb-1 font-semibold">Chọn giọng đọc:</label>
            <select
              value={selectedVoiceURI}
              onChange={(e) => {
                setSelectedVoiceURI(e.target.value);
                localStorage.setItem("selected_voice_uri", e.target.value);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-700 text-xs"
            >
              <option value="microsoft-hoaimy-south">🌸 Cô Hoài My (Miền Nam - Rất ngọt)</option>
              <option value="microsoft-namminh-north">👦 Thầy Nam Minh (Miền Bắc - Ấm áp)</option>
              <option value="google-tts-online">🌐 Giọng đọc Google (Mặc định)</option>
              {viVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  🔊 {voice.name} (Hệ thống offline)
                </option>
              ))}
            </select>
            {viVoices.length === 0 && !selectedVoiceURI.startsWith("microsoft") && (
              <p className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 p-2 rounded-xl mt-2 font-medium">
                💡 Máy của bé chưa cài giọng đọc Tiếng Việt offline. Bạn nhỏ hãy chọn giọng Hoài My hoặc Nam Minh chất lượng cao nhé!
              </p>
            )}
          </div>

          {/* Pitch & Rate sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-500 block mb-1 flex justify-between">
                <span>Tốc độ:</span>
                <span className="font-bold font-mono text-indigo-600">{voiceRate.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={voiceRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVoiceRate(val);
                  localStorage.setItem("voice_rate", String(val));
                }}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1 flex justify-between">
                <span>Cao độ:</span>
                <span className="font-bold font-mono text-indigo-600">{voicePitch.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voicePitch}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVoicePitch(val);
                  localStorage.setItem("voice_pitch", String(val));
                }}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end mt-1">
            <button
              onClick={() => {
                playMouseClick();
                speakVietnamese("Chào bạn nhỏ! Tớ đang nói giọng Tiếng Việt đây, nghe đã vừa tai bé chưa?");
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
            >
              🔊 Thử giọng đọc
            </button>
          </div>
        </div>
      )}

      {/* 2. Visual Character Avatar & Speech Bubble */}
      <div className="flex flex-col items-center justify-center py-4 flex-grow">
        {/* Animated Avatar Core */}
        <div className="relative mb-4">
          <motion.div
            animate={config.animate}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className={`w-28 h-28 rounded-full border-4 flex items-center justify-center text-6xl shadow-inner ${config.bgColor}`}
          >
            {config.emoji}
          </motion.div>
          {isLoading && (
            <div className="absolute -inset-2 rounded-full border-4 border-dashed border-indigo-400 animate-spin" />
          )}
        </div>

        {/* Dynamic Bubble Subtitle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={subtitleText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl px-5 py-4 text-center text-sm md:text-base border shadow-sm max-w-sm relative ${config.bubbleColor}`}
          >
            {/* Arrow */}
            <div className="absolute left-1/2 -top-2 w-4 h-4 bg-inherit border-t border-l transform -translate-x-1/2 rotate-45" />
            <p className="font-sans font-medium leading-relaxed">
              {isLoading ? "Tớ đang suy nghĩ câu trả lời dễ hiểu nhất nhé..." : subtitleText}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Helpful Guided Instruction Prompt */}
      {stepHint && (
        <div className="my-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs text-indigo-900 font-sans">
            <strong className="block mb-0.5">Gợi ý từ Chú Chuột:</strong>
            {stepHint}
          </div>
        </div>
      )}

      {/* 4. Children Interactive Chat Input */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        {/* Preset quick buttons */}
        <div className="mb-3">
          <p className="text-[11px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" /> Nhấp nhanh để hỏi:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  playMouseClick();
                  onAskGemini(q.text);
                }}
                disabled={isLoading}
                className="text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 text-slate-600 px-2.5 py-1.5 rounded-xl transition duration-150 disabled:opacity-50 text-left"
                id={`btn-quick-q-${idx}`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isLoading}
            className={`p-2.5 rounded-2xl transition shrink-0 ${
              isListening 
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
            }`}
            title={isListening ? "Đang lắng nghe bé nói..." : "Nói chuyện bằng Micro"}
            id="btn-chat-mic"
          >
            {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
          </button>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isLoading}
            placeholder={isListening ? "Bé nói đi, tớ đang nghe nè..." : "Viết câu hỏi của bạn nhỏ tại đây..."}
            className="flex-grow px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            id="chat-input"
          />
          <button
            type="submit"
            disabled={!userInput.trim() || isLoading}
            className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            id="btn-chat-send"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
