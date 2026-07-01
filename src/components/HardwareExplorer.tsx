import React, { useState } from "react";
import { motion } from "motion/react";
import { HARDWARE_LIST, HardwareComponent } from "../types";
import { playSoundByName, playMouseClick } from "../utils/audio";
import { Sparkles, HelpCircle, AlertTriangle, Play } from "lucide-react";

interface HardwareExplorerProps {
  onSpeakText: (text: string, action?: string) => void;
}

export default function HardwareExplorer({ onSpeakText }: HardwareExplorerProps) {
  const [selectedId, setSelectedId] = useState<string>("monitor");

  const currentComp = HARDWARE_LIST.find(c => c.id === selectedId) || HARDWARE_LIST[0];

  const handleComponentClick = (comp: HardwareComponent) => {
    setSelectedId(comp.id);
    playMouseClick();

    // Trigger part sound
    let customSound = "click";
    if (comp.id === "keyboard") customSound = "tap";
    else if (comp.id === "case") customSound = "whir";
    else if (comp.id === "monitor") customSound = "beep";
    else if (comp.id === "power") customSound = "spark";
    else if (comp.id === "speakers") customSound = "jingle";
    playSoundByName(customSound);

    // Speak description
    const speakPhrase = `Đây là ${comp.name} đấy bạn nhỏ ơi! ${comp.description} ${comp.metaphor}`;
    onSpeakText(speakPhrase, "Nháy_Mắt");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="hardware-explorer">
      {/* Schematic Desktop Preview on the Left (8 cols) */}
      <div className="lg:col-span-7 bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 flex flex-col justify-between">
        <div>
          <h3 className="font-sans font-bold text-slate-800 text-lg md:text-xl mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
            Nhấp chuột vào thiết bị để khám phá nhé!
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Mỗi thiết bị đều có một phép thuật kỳ diệu riêng biệt đấy.
          </p>
        </div>

        {/* 2D Interactive Desktop Simulation Box */}
        <div className="relative aspect-video bg-white rounded-2xl border-4 border-dashed border-indigo-200 p-6 flex flex-col items-center justify-center gap-4 overflow-hidden shadow-inner">
          {/* Wall Socket at the back left */}
          <button
            onClick={() => handleComponentClick(HARDWARE_LIST.find(h => h.id === "power")!)}
            className={`absolute top-4 left-6 p-2 rounded-lg border-2 flex flex-col items-center cursor-pointer transition duration-300 ${
              selectedId === "power" ? "bg-amber-100 border-amber-400 scale-105 shadow-md" : "bg-slate-50 border-slate-200 hover:border-amber-300"
            }`}
            id="explorer-power-btn"
          >
            <span className="text-3xl">🔌</span>
            <span className="text-[10px] font-bold text-slate-600 uppercase">Nguồn điện</span>
          </button>

          {/* Speakers on Left & Right */}
          <div className="w-full max-w-md flex items-end justify-between px-8 relative mt-4">
            <button
              onClick={() => handleComponentClick(HARDWARE_LIST.find(h => h.id === "speakers")!)}
              className={`p-2 rounded-xl border-2 flex flex-col items-center cursor-pointer transition duration-300 ${
                selectedId === "speakers" ? "bg-purple-100 border-purple-400 scale-110 shadow-lg" : "bg-slate-50 border-slate-200 hover:border-purple-300"
              }`}
              id="explorer-speaker-l"
            >
              <span className="text-2xl">🔊</span>
              <span className="text-[9px] font-bold text-slate-500">Loa trái</span>
            </button>

            {/* Monitor in the Center */}
            <button
              onClick={() => handleComponentClick(HARDWARE_LIST.find(h => h.id === "monitor")!)}
              className={`w-44 p-4 rounded-xl border-2 flex flex-col items-center cursor-pointer transition duration-300 ${
                selectedId === "monitor" ? "bg-emerald-100 border-emerald-400 scale-110 shadow-xl" : "bg-slate-50 border-slate-200 hover:border-emerald-300"
              }`}
              id="explorer-monitor-btn"
            >
              <div className="w-full aspect-video bg-slate-800 rounded flex items-center justify-center text-emerald-400 font-mono text-xs overflow-hidden border">
                {selectedId === "monitor" ? (
                  <span className="animate-pulse">✨ Đang Sáng ✨</span>
                ) : (
                  <span>🖥️</span>
                )}
              </div>
              <div className="w-8 h-4 bg-slate-300 mt-1" />
              <div className="w-16 h-1 bg-slate-400" />
              <span className="text-xs font-bold text-slate-700 mt-2">Màn hình</span>
            </button>

            {/* Computer Case (CPU) on the Right */}
            <button
              onClick={() => handleComponentClick(HARDWARE_LIST.find(h => h.id === "case")!)}
              className={`w-20 p-2 rounded-xl border-2 flex flex-col items-center cursor-pointer transition duration-300 ${
                selectedId === "case" ? "bg-blue-100 border-blue-400 scale-110 shadow-xl" : "bg-slate-50 border-slate-200 hover:border-blue-300"
              }`}
              id="explorer-case-btn"
            >
              <div className="w-10 h-16 bg-slate-700 rounded-md border-2 border-slate-600 flex flex-col justify-between p-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border text-[8px] text-white">⏻</div>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2">Thân máy</span>
            </button>

            <button
              onClick={() => handleComponentClick(HARDWARE_LIST.find(h => h.id === "speakers")!)}
              className={`p-2 rounded-xl border-2 flex flex-col items-center cursor-pointer transition duration-300 ${
                selectedId === "speakers" ? "bg-purple-100 border-purple-400 scale-110 shadow-lg" : "bg-slate-50 border-slate-200 hover:border-purple-300"
              }`}
              id="explorer-speaker-r"
            >
              <span className="text-2xl">🔊</span>
              <span className="text-[9px] font-bold text-slate-500">Loa phải</span>
            </button>
          </div>

          {/* Keyboard & Mouse on desk */}
          <div className="flex gap-4 items-center justify-center w-full mt-4">
            {/* Keyboard */}
            <button
              onClick={() => handleComponentClick(HARDWARE_LIST.find(h => h.id === "keyboard")!)}
              className={`w-48 p-2 rounded-lg border-2 flex flex-col items-center cursor-pointer transition duration-300 ${
                selectedId === "keyboard" ? "bg-pink-100 border-pink-400 scale-105 shadow-md" : "bg-slate-50 border-slate-200 hover:border-pink-300"
              }`}
              id="explorer-keyboard-btn"
            >
              <span className="text-2xl">⌨️</span>
              <span className="text-xs font-bold text-slate-700">Bàn phím</span>
            </button>

            {/* Mouse */}
            <button
              onClick={() => handleComponentClick(HARDWARE_LIST.find(h => h.id === "mouse")!)}
              className={`p-2 rounded-lg border-2 flex flex-col items-center cursor-pointer transition duration-300 ${
                selectedId === "mouse" ? "bg-sky-100 border-sky-400 scale-110 shadow-md" : "bg-slate-50 border-slate-200 hover:border-sky-300"
              }`}
              id="explorer-mouse-btn"
            >
              <span className="text-2xl">🖱️</span>
              <span className="text-xs font-bold text-slate-700">Chuột</span>
            </button>
          </div>
        </div>

        {/* Info Disclaimer */}
        <div className="flex items-center gap-2 mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 text-amber-900 text-xs font-sans">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span>
            <strong>Chú ý an toàn:</strong> Khi cắm phích điện và sử dụng các ổ cắm trong nhà thật, các bạn nhỏ phải nhờ bố mẹ hoặc thầy cô giúp đỡ để luôn được bảo vệ an toàn nhé!
          </span>
        </div>
      </div>

      {/* Structured Details Card on the Right (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <motion.div
          key={currentComp.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg flex-grow flex flex-col justify-between"
          id={`explorer-details-${currentComp.id}`}
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm">
                {currentComp.avatar}
              </span>
              <div>
                <h4 className="font-sans font-bold text-slate-800 text-xl">
                  {currentComp.name}
                </h4>
                <span className="text-xs text-indigo-600 font-mono font-medium tracking-wide uppercase">
                  Tiếng Anh: {currentComp.englishName}
                </span>
              </div>
            </div>

            <div className="space-y-4 font-sans text-slate-700 text-sm leading-relaxed">
              <div>
                <strong className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                  Định nghĩa dễ hiểu:
                </strong>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {currentComp.description}
                </p>
              </div>

              <div>
                <strong className="text-xs text-indigo-400 uppercase tracking-wider block mb-1">
                  Hình ảnh so sánh:
                </strong>
                <p className="bg-indigo-50/50 text-indigo-900 p-3 rounded-xl border border-indigo-100/50 font-medium">
                  {currentComp.metaphor}
                </p>
              </div>

              <div>
                <strong className="text-xs text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  💡 Bạn nhỏ có biết?
                </strong>
                <p className="bg-amber-50/30 text-slate-600 p-3 rounded-xl border border-amber-100/30 text-xs">
                  {currentComp.funFact}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleComponentClick(currentComp)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-sans font-medium flex items-center gap-1 shadow transition"
              id="btn-speak-again"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Nghe lại hướng dẫn
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
