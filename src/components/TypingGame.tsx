import React, { useState, useEffect } from "react";
import { Sparkles, Trophy, Award, Keyboard, Volume2 } from "lucide-react";
import { playSoundByName, playKeyboardTap, playMouseClick } from "../utils/audio";

interface TypingGameProps {
  studentName: string;
  onSpeakText: (text: string, action?: string) => void;
  onPostLog: (action: string, status: "success" | "warning" | "info", step?: string, message?: string) => void;
}

interface WordItem {
  word: string;
  vietnamese: string;
  hint: string;
}

const CATEGORY_WORDS: Record<string, WordItem[]> = {
  easy: [
    { word: "CHUOT", vietnamese: "CHUỘT", hint: "Chú chuột máy tính nhỏ xinh" },
    { word: "PHIM", vietnamese: "PHÍM", hint: "Bàn phím gõ chữ nhảy múa" },
    { word: "LOA", vietnamese: "LOA", hint: "Loa phát nhạc ca hát vui tươi" },
    { word: "DIEN", vietnamese: "ĐIỆN", hint: "Nguồn điện ảo cung cấp năng lượng" },
    { word: "CASE", vietnamese: "CASE", hint: "Thân máy (còn gọi là Case)" }
  ],
  medium: [
    { word: "MAN HINH", vietnamese: "MÀN HÌNH", hint: "Gương mặt màn hình sáng trưng" },
    { word: "TIN HOC", vietnamese: "TIN HỌC", hint: "Môn Tin học cực kỳ thú vị" },
    { word: "LOP HAI", vietnamese: "LỚP HAI", hint: "Bạn nhỏ Lớp 2 thông minh" },
    { word: "HOC TAP", vietnamese: "HỌC TẬP", hint: "Chúng mình cùng học chăm chỉ" }
  ],
  hard: [
    { word: "TAT MAY AN TOAN", vietnamese: "TẮT MÁY AN TOÀN", hint: "Vào Start -> chọn Shut down để tắt máy" },
    { word: "LAU TAY KHO RAO", vietnamese: "LAU TAY KHÔ RÁO", hint: "Không chạm vào điện khi tay đang ướt" },
    { word: "HIEP SI PHONG MAY", vietnamese: "HIỆP SĨ PHÒNG MÁY", hint: "Danh hiệu xuất sắc cho bé bảo vệ phòng máy" }
  ]
};

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"]
];

export default function TypingGame({ studentName, onSpeakText, onPostLog }: TypingGameProps) {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [wordIdx, setWordIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [streak, setStreak] = useState(0);

  const currentWords = CATEGORY_WORDS[difficulty];
  const currentWordObj = currentWords[wordIdx] || currentWords[0];

  // Reset progress when difficulty changes
  useEffect(() => {
    setWordIdx(0);
    setTypedText("");
    setGameFinished(false);
  }, [difficulty]);

  // Capture keyboard input
  useEffect(() => {
    if (gameFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore non-character keys
      if (e.key.length !== 1) return;

      const key = e.key.toUpperCase();
      playKeyboardTap();

      // The target characters ignoring space and accents for easy typing
      const targetWord = currentWordObj.word;
      
      // Calculate next expected character
      const nextCharIdx = typedText.length;
      const expectedChar = targetWord[nextCharIdx];

      // If typed character matches expected character (or space matches space)
      if (key === expectedChar) {
        const newTyped = typedText + expectedChar;
        setTypedText(newTyped);

        // Check if word is completed
        if (newTyped === targetWord) {
          // Success!
          playSoundByName("success");
          setScore(prev => prev + 10);
          setStreak(prev => prev + 1);
          
          // Let assistant speak
          const assistPhrases = [
            `Bạn nhỏ giỏi quá! Bé gõ đúng từ ${currentWordObj.vietnamese} rồi! 🌟`,
            `Tuyệt cú mèo! Bé đã gõ thành công từ ${currentWordObj.vietnamese}! 🎉`,
            `Hiệp sĩ gõ phím tí hon siêu thế! Bé gõ đúng từ ${currentWordObj.vietnamese} rồi! 👍`
          ];
          const randomPhrase = assistPhrases[Math.floor(Math.random() * assistPhrases.length)];
          onSpeakText(randomPhrase, "Cổ_Vũ");

          // Advance to next word after 1s
          setTimeout(() => {
            setTypedText("");
            if (wordIdx < currentWords.length - 1) {
              setWordIdx(prev => prev + 1);
            } else {
              setGameFinished(true);
              onPostLog("Luyện gõ phím", "success", "Minigame", `Đạt điểm số: ${score + 10} điểm ở mức độ ${difficulty === "easy" ? "Dễ" : difficulty === "medium" ? "Trung bình" : "Khó"}`);
            }
          }, 1000);
        }
      } else {
        // Wrong key
        playSoundByName("error");
        setStreak(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [typedText, wordIdx, gameFinished, score, difficulty]);

  const handleResetGame = () => {
    setWordIdx(0);
    setTypedText("");
    setScore(0);
    setStreak(0);
    setGameFinished(false);
    onSpeakText("Chào mừng bé đến với Thử thách Gõ phím thần kỳ! Hãy nhấn các phím trên bàn phím thật của bé để gõ từ hiện ra nhé!", "Vẫy_Tay");
  };

  const nextChar = currentWordObj ? currentWordObj.word[typedText.length] : "";

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden border border-indigo-800" id="typing-game">
      {/* Background bubbles */}
      <div className="absolute w-24 h-24 bg-pink-500/10 rounded-full blur-xl -top-4 -left-4 animate-pulse" />
      <div className="absolute w-32 h-32 bg-emerald-500/10 rounded-full blur-xl -bottom-10 -right-10 animate-pulse" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-800/80 rounded-xl text-indigo-300">
            <Keyboard className="w-5 h-5" />
          </span>
          <div>
            <h4 className="font-extrabold text-sm md:text-base text-white">⌨️ Gõ Phím Thần Kỳ</h4>
            <p className="text-[10px] text-indigo-300">Giúp bạn nhỏ làm quen với vị trí các nút chữ cái.</p>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex gap-1 bg-indigo-950 p-1 rounded-xl border border-indigo-800/60 text-xs">
          <button
            onClick={() => { playMouseClick(); setDifficulty("easy"); }}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${difficulty === "easy" ? "bg-indigo-600 text-white" : "text-indigo-400 hover:text-white"}`}
          >
            Dễ
          </button>
          <button
            onClick={() => { playMouseClick(); setDifficulty("medium"); }}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${difficulty === "medium" ? "bg-indigo-600 text-white" : "text-indigo-400 hover:text-white"}`}
          >
            Trung bình
          </button>
          <button
            onClick={() => { playMouseClick(); setDifficulty("hard"); }}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${difficulty === "hard" ? "bg-indigo-600 text-white" : "text-indigo-400 hover:text-white"}`}
          >
            Khó
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1 bg-indigo-950 px-2.5 py-1.5 rounded-xl border border-indigo-800">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Điểm: <strong className="text-amber-400">{score}</strong></span>
          </div>
          {streak > 2 && (
            <span className="bg-pink-600 px-2 py-1 rounded-full animate-bounce text-[9px]">
              🔥 Combo x{streak}
            </span>
          )}
        </div>
      </div>

      {!gameFinished ? (
        <div className="flex-grow flex flex-col items-center justify-center py-4 text-center">
          <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/50 mb-3">
            Từ {wordIdx + 1} / {currentWords.length}
          </span>

          {/* Word display board */}
          <div className="bg-indigo-950/40 border-2 border-indigo-800/80 rounded-2xl p-4 md:p-6 max-w-sm w-full shadow-inner mb-4 flex flex-col items-center gap-2">
            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">
              Từ cần gõ:
            </span>
            <div className="text-2xl md:text-3xl font-black tracking-widest text-slate-400 font-mono select-none flex">
              {currentWordObj.word.split("").map((char, charIdx) => {
                const isTyped = charIdx < typedText.length;
                const isCurrent = charIdx === typedText.length;
                return (
                  <span
                    key={charIdx}
                    className={`transition-all duration-200 ${
                      isTyped 
                        ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] scale-110" 
                        : isCurrent 
                          ? "text-white underline decoration-indigo-400 underline-offset-4 animate-pulse"
                          : "text-indigo-950/50 opacity-40"
                    }`}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                );
              })}
            </div>
            <span className="text-xs text-indigo-300 font-bold bg-indigo-900/40 px-3 py-1 rounded-full mt-1 border border-indigo-850">
              💡 {currentWordObj.hint}
            </span>
          </div>

          <p className="text-[10px] text-slate-300 italic mb-4">
            Nhìn phím xanh lá nhấp nháy bên dưới để gõ nhanh nhé!
          </p>

          {/* Visual Keyboard Guide */}
          <div className="bg-indigo-950/80 border border-indigo-800/60 rounded-2xl p-3 w-full max-w-lg flex flex-col gap-1.5 shadow-inner">
            <div className="flex flex-col gap-1 items-center">
              {KEYBOARD_ROWS.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-0.5 md:gap-1">
                  {row.map((key) => {
                    const isNext = key === nextChar;
                    return (
                      <kbd
                        key={key}
                        className={`w-6 h-6 md:w-8 md:h-8 rounded-lg border text-[10px] md:text-xs font-bold flex items-center justify-center transition-all ${
                          isNext
                            ? "bg-emerald-500 border-emerald-400 text-white animate-bounce shadow-[0_0_10px_rgba(16,185,129,0.7)] scale-110"
                            : "bg-indigo-900/30 border-indigo-800/50 text-indigo-400"
                        }`}
                      >
                        {key}
                      </kbd>
                    );
                  })}
                </div>
              ))}
              {/* Spacebar Row */}
              <div className="flex w-full justify-center mt-1">
                <kbd
                  className={`h-6 md:h-8 rounded-lg border text-[10px] font-bold flex items-center justify-center transition-all w-28 md:w-40 ${
                    nextChar === " "
                      ? "bg-emerald-500 border-emerald-400 text-white animate-bounce shadow-[0_0_10px_rgba(16,185,129,0.7)] scale-110"
                      : "bg-indigo-900/30 border-indigo-800/50 text-indigo-400"
                  }`}
                >
                  DẤU CÁCH (SPACE)
                </kbd>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Completed Screen
        <div className="flex-grow flex flex-col items-center justify-center text-center py-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30 animate-bounce">
            <Award className="w-8 h-8 text-emerald-400" />
          </div>
          <h5 className="font-extrabold text-lg text-white mb-2">Chúc Mừng Bạn Nhỏ {studentName}!</h5>
          <p className="text-xs text-indigo-200 max-w-xs mb-6">
            Bé đã gõ hết các từ ở mức độ **{difficulty === "easy" ? "Dễ" : difficulty === "medium" ? "Trung bình" : "Khó"}**! Hãy thử mức tiếp theo nhé.
          </p>

          <div className="bg-indigo-950/80 border border-indigo-800 rounded-2xl p-4 w-full max-w-xs text-left mb-6 text-xs flex justify-between font-mono">
            <span>Tổng số từ hoàn thành:</span>
            <strong className="text-emerald-400">{currentWords.length} / {currentWords.length}</strong>
          </div>

          <button
            onClick={handleResetGame}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-extrabold hover:brightness-110 transition shadow-md"
          >
            🔁 Chơi Lại Từ Đầu
          </button>
        </div>
      )}
    </div>
  );
}
