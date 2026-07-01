import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Settings, 
  HelpCircle, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Shield, 
  Award, 
  LogOut, 
  ArrowRight, 
  Volume2,
  Trash2,
  User
} from "lucide-react";
import AssistantPanel from "./components/AssistantPanel";
import HardwareExplorer from "./components/HardwareExplorer";
import TeacherDashboard from "./components/TeacherDashboard";
import TypingGame from "./components/TypingGame";
import { AppMode, LabState, PracticeStep, TeacherLog } from "./types";
import { playSoundByName, stopComputerHum } from "./utils/audio";
import { generateDocxCertificate, generatePptxLesson } from "./utils/export";
import { Packer } from "docx";

export default function App() {
  // App states
  const [mode, setMode] = useState<AppMode>("welcome");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview");
  const [showSettings, setShowSettings] = useState(false);
  const [studentName, setStudentName] = useState("Bạn Nhỏ Lớp 2A");
  
  // Assistant states
  const [currentAction, setCurrentAction] = useState("Vẫy_Tay");
  const [subtitleText, setSubtitleText] = useState("Chào mừng bạn nhỏ đến với phòng máy tính thông thái! Tớ là Chú Chuột Thông Thái đây! 🐭");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);

  // Simulation Lab states
  const [labState, setLabState] = useState<LabState>({
    isPluggedIn: false,
    isCaseOn: false,
    isMonitorOn: false,
    isLoggedIn: false,
    isWetHands: false,
    currentStep: "step1_plug",
    hasError: false,
    errorMessage: "",
    errorType: "none"
  });

  // Quiz states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [tempStudentName, setTempStudentName] = useState("");

  // Teacher logs
  const [teacherLogs, setTeacherLogs] = useState<TeacherLog[]>([]);
  const [showTeacherLogs, setShowTeacherLogs] = useState(false);

  // Load API keys and logs on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key") || "";
    const savedModel = localStorage.getItem("gemini_model") || "gemini-3-flash-preview";
    const savedName = localStorage.getItem("student_name") || "Bạn Nhỏ Lớp 2A";
    
    setApiKey(savedKey);
    setSelectedModel(savedModel);
    setStudentName(savedName);
    setTempStudentName(savedName);

    if (!savedKey) {
      setShowSettings(true);
    }

    // Load local logs
    const savedLogs = localStorage.getItem("teacher_report_logs");
    if (savedLogs) {
      try {
        setTeacherLogs(JSON.parse(savedLogs));
      } catch (e) {
        initializeLogs();
      }
    } else {
      initializeLogs();
    }
  }, []);

  const initializeLogs = () => {
    const initialLogs: TeacherLog[] = [
      {
        id: "1",
        timestamp: new Date().toISOString(),
        studentName: "Học sinh giả lập",
        action: "Khởi động hệ thống",
        status: "info",
        message: "Hệ thống Trợ Lý Ảo Phòng Máy đã khởi động sẵn sàng."
      }
    ];
    setTeacherLogs(initialLogs);
    localStorage.setItem("teacher_report_logs", JSON.stringify(initialLogs));
  };

  // Clear teacher logs
  const handleClearLogs = () => {
    const initialLogs: TeacherLog[] = [
      {
        id: "1",
        timestamp: new Date().toISOString(),
        studentName: "Học sinh giả lập",
        action: "Khởi động hệ thống",
        status: "info",
        message: "Hệ thống Trợ Lý Ảo Phòng Máy đã khởi động sẵn sàng."
      }
    ];
    setTeacherLogs(initialLogs);
    localStorage.setItem("teacher_report_logs", JSON.stringify(initialLogs));
  };

  // Post a new teacher log
  const postLog = (action: string, status: "success" | "warning" | "info", step?: string, message?: string) => {
    const newLog: TeacherLog = {
      id: String(Date.now() + Math.random()),
      timestamp: new Date().toISOString(),
      studentName: studentName || "Bạn nhỏ ẩn danh",
      action,
      status: status || "info",
      step,
      message: message || ""
    };
    
    setTeacherLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem("teacher_report_logs", JSON.stringify(updated));
      return updated;
    });
  };

  // Chat with Gemini
  const handleAskGemini = async (text: string) => {
    setIsLoadingChat(true);
    // Add user message to local history
    const userMsg = { role: "user" as const, text };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);

    try {
      if (!apiKey.trim()) {
        throw new Error("Chưa nhập API Key! Hãy nhấp nút Thiết Lập để điền API Key nhé!");
      }

      const systemInstruction = `Bạn là "Chú Chuột Thông Thái" (hoặc Robot Tin Học), trợ lý tin học cực kỳ đáng yêu, thân thiện và giàu năng lượng, hướng dẫn học sinh lớp 1 và lớp 2 (6-7 tuổi) tại Việt Nam học cách sử dụng máy tính và giữ gìn tài sản phòng máy.
Quy tắc trò chuyện:
1. Luôn sử dụng ngôn ngữ Tiếng Việt cực kỳ đơn giản, chậm rãi, dễ hiểu cho trẻ em.
2. Xưng hô thân mật: gọi trẻ là "Bạn nhỏ ơi", "Người bạn nhỏ", "Người bạn của tớ", và xưng là "Tớ" hoặc "Chú Chuột Thông Thái".
3. Trả lời cực kỳ ngắn gọn (không quá 2-3 câu ngắn).
4. Sử dụng các ẩn dụ sinh động (như: Chuột máy tính giống như chú chuột nhắt ăn phô mai, Case máy tính là bộ não thông thái, Màn hình là gương mặt hiển thị, Điện là thức ăn tăng năng lượng, Bàn phím là dàn nhạc gõ).
5. Bạn PHẢI trả lời dưới định dạng JSON khớp chính xác với schema này:
{
  "Audio_Script": "Nội dung giọng nói bằng tiếng Việt cực kỳ ngọt ngào, động viên trẻ",
  "Visual_Action": "Mô tả hành động của Chú Chuột (ví dụ: 'Vẫy_Tay', 'Cười_Vui', 'Nháy_Mắt', 'Suy_Nghĩ', 'Lo_Lắng', 'Cổ_Vũ')",
  "Sound_Effect": "Tên hiệu ứng âm thanh đi kèm nếu có (ví dụ: 'Success_Jingle', 'BIOS_Beep', 'Error_Squeak', 'Keyboard_Tap', 'Computer_Whir')"
}
Bạn tuyệt đối phải trả lời bằng JSON hợp lệ, không chứa ký tự markdown thừa ngoài JSON.`;

      // Setup fallback chain
      const modelsToTry = [
        selectedModel,
        "gemini-3-flash-preview",
        "gemini-3-pro-preview",
        "gemini-2.5-flash"
      ].filter((value, index, self) => self.indexOf(value) === index); // unique

      // Convert history to Gemini API format
      const contents = updatedHistory.slice(-7).map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      }));

      let responseText = "";
      let successModel = "";
      let lastError: any = null;

      // Retry loop through fallback models
      for (const currentModel of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: contents,
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    Audio_Script: {
                      type: "STRING",
                      description: "Lời nói tiếng Việt thân thiện, siêu ngắn cho bé"
                    },
                    Visual_Action: {
                      type: "STRING",
                      description: "Hành động trực quan của Chú Chuột"
                    },
                    Sound_Effect: {
                      type: "STRING",
                      description: "Hiệu ứng âm thanh thích hợp"
                    }
                  },
                  required: ["Audio_Script", "Visual_Action", "Sound_Effect"]
                }
              }
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
          }

          const data = await response.json();
          if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            responseText = data.candidates[0].content.parts[0].text;
            successModel = currentModel;
            break; // Success!
          }
        } catch (err: any) {
          console.warn(`Model ${currentModel} failed:`, err.message || err);
          lastError = err;
        }
      }

      if (!responseText) {
        const errorMsg = lastError ? (lastError.message || String(lastError)) : "All models failed";
        let displayError = errorMsg;
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
          displayError = "429 RESOURCE_EXHAUSTED";
        } else if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("400") || errorMsg.includes("API key not valid")) {
          displayError = "API key not valid";
        }
        throw new Error(displayError);
      }

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        parsed = {
          Audio_Script: "Tớ đang suy nghĩ một chút, bạn nhỏ hỏi lại tớ nhé!",
          Visual_Action: "Suy_Nghĩ",
          Sound_Effect: "Error_Squeak"
        };
      }

      setSubtitleText(parsed.Audio_Script);
      setCurrentAction(parsed.Visual_Action);
      
      // Update history with model response
      setChatHistory(prev => [...prev, { role: "model" as const, text: parsed.Audio_Script }]);

      if (parsed.Sound_Effect) {
        playSoundByName(parsed.Sound_Effect);
      }
    } catch (err: any) {
      console.error(err);
      const apiErrorMsg = err.message || "429 RESOURCE_EXHAUSTED";
      setSubtitleText(`Ối! Gặp lỗi rồi bạn nhỏ ơi: ${apiErrorMsg}. Bé nhắc bố mẹ hoặc thầy cô xem lại API Key nhé!`);
      setCurrentAction("Lo_Lắng");
      playSoundByName("Error_Squeak");
      postLog("Lỗi Hệ thống AI", "warning", "AI Chat", `Hệ thống AI trả về lỗi: ${apiErrorMsg}`);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      const doc = generateDocxCertificate(studentName, String(quizScore));
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ChungNhan_${studentName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      postLog("Tải Chứng nhận Word", "success", "Thử thách", `Tải chứng nhận thành công cho bạn nhỏ ${studentName}.`);
    } catch (e: any) {
      console.error("Lỗi xuất Word:", e);
      alert("Không thể tải file Word: " + e.message);
    }
  };

  const handleExportPptx = () => {
    try {
      const pptx = generatePptxLesson();
      pptx.writeFile({ fileName: "BaiGiang_PhongMayThongThai.pptx" });
      postLog("Tải Slide Bài Giảng", "success", "Giáo viên", "Tải slide bài giảng PowerPoint thành công.");
    } catch (e: any) {
      console.error("Lỗi xuất PowerPoint:", e);
      alert("Không thể tải slide PowerPoint: " + e.message);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem("gemini_api_key", apiKey);
    localStorage.setItem("gemini_model", selectedModel);
    localStorage.setItem("student_name", tempStudentName);
    setStudentName(tempStudentName);
    setShowSettings(false);
    
    setSubtitleText(`Đã lưu thiết lập thành công! Tớ đã sẵn sàng trò chuyện cùng ${tempStudentName} rồi đây! 🐭`);
    setCurrentAction("Nháy_Mắt");
    playSoundByName("Success_Jingle");
  };

  // Reset practice simulation
  const handleResetLab = () => {
    stopComputerHum();
    setLabState(prev => ({
      isPluggedIn: false,
      isCaseOn: false,
      isMonitorOn: false,
      isLoggedIn: false,
      isWetHands: prev.isWetHands,
      currentStep: "step1_plug",
      hasError: false,
      errorMessage: "",
      errorType: "none"
    }));
    setSubtitleText("Chúng mình hãy thực hiện Bước 1: Tìm nguồn điện và cắm phích cắm điện ảo vào ổ cắm nhé!");
    setCurrentAction("Vẫy_Tay");
    playSoundByName("click");
  };

  // Handle Practice actions
  const handlePlugClick = () => {
    if (labState.hasError) return;

    if (labState.isWetHands) {
      setLabState(prev => ({
        ...prev,
        hasError: true,
        errorType: "short_out",
        errorMessage: "Nguy hiểm! Tay bé đang ướt mà chạm vào nguồn điện sẽ rất dễ bị chập điện và giật điện! Hãy lau tay thật khô trước khi cắm điện nhé!"
      }));
      setSubtitleText("Ối! Tay bạn nhỏ đang ướt mà chạm vào điện là cực kỳ nguy hiểm đấy! Nhớ lau tay khô trước nhé!");
      setCurrentAction("Lo_Lắng");
      playSoundByName("spark");
      playSoundByName("Error_Squeak");
      postLog("Chập điện (Tay ướt)", "warning", "Bước 1", "Học sinh tương tác với phích cắm điện khi tay đang ướt nước.");
      return;
    }

    if (!labState.isPluggedIn) {
      // Connect plug
      setLabState(prev => ({
        ...prev,
        isPluggedIn: true,
        currentStep: "step2_case"
      }));
      setSubtitleText("Tuyệt vời! Đã cắm nguồn điện ảo thành công. Hãy bấm nút Nguồn trên Thân máy (CPU) ở Bước 2 để khởi động nhé!");
      setCurrentAction("Cổ_Vũ");
      playSoundByName("spark");
      postLog("Cắm nguồn điện", "success", "Bước 1", "Học sinh cắm phích điện ảo an toàn.");
    } else {
      // Unplugging cord
      if (labState.isCaseOn || labState.isMonitorOn) {
        // ERROR: unplugged while running
        stopComputerHum();
        setLabState(prev => ({
          ...prev,
          isPluggedIn: false,
          isCaseOn: false,
          isMonitorOn: false,
          isLoggedIn: false,
          hasError: true,
          errorType: "unplugged_force",
          errorMessage: "Ối! Rút phích cắm đột ngột khi máy tính đang bật sẽ làm hỏng linh kiện bên trong và có thể chập điện nguy hiểm đấy!"
        }));
        setSubtitleText("Cứu tớ với! Bạn nhỏ đã rút điện khi máy đang chạy rồi, như vậy rất dễ hỏng máy tính đấy!");
        setCurrentAction("Lo_Lắng");
        playSoundByName("spark");
        playSoundByName("Error_Squeak");
        postLog("Rút nguồn đột ngột", "warning", "Bước 1", "Học sinh rút phích cắm khi máy đang hoạt động.");
      } else {
        setLabState(prev => ({
          ...prev,
          isPluggedIn: false,
          currentStep: "step1_plug"
        }));
        setSubtitleText("Đã rút phích cắm điện. Chúng mình cần cắm điện ảo lại thì máy mới chạy được nhé!");
        setCurrentAction("Suy_Nghĩ");
        playSoundByName("click");
      }
    }
  };

  const handleCaseClick = () => {
    if (labState.hasError) return;

    if (!labState.isPluggedIn) {
      setLabState(prev => ({
        ...prev,
        hasError: true,
        errorType: "wrong_step",
        errorMessage: "Bé đã nhấn nút nguồn trên Thân máy khi chưa cắm điện! Không có điện thì máy tính không chạy được đâu, hãy cắm điện trước nhé!"
      }));
      setSubtitleText("Ồ! Máy tính chưa được cắm điện kìa bạn nhỏ ơi, chúng mình phải cắm nguồn điện trước nhé!");
      setCurrentAction("Lo_Lắng");
      playSoundByName("Error_Squeak");
      postLog("Bật CPU khi chưa cắm điện", "warning", "Bước 2", "Học sinh cố bật thân máy khi chưa kết nối nguồn điện.");
      return;
    }

    if (!labState.isCaseOn) {
      // Turn CPU on
      setLabState(prev => ({
        ...prev,
        isCaseOn: true,
        currentStep: prev.isMonitorOn ? "step4_login" : "step3_monitor"
      }));
      setSubtitleText("Tít... Vù vù... Thân máy đã khởi động rồi! Hãy bấm nút Nguồn trên Màn hình ở Bước 3 để xem hình ảnh nhé!");
      setCurrentAction("Cổ_Vũ");
      playSoundByName("beep");
      playSoundByName("whir");
      postLog("Bật thân máy CPU", "success", "Bước 2", "Học sinh nhấn nút nguồn thân máy chính xác.");
    } else {
      // Force shutdown case
      stopComputerHum();
      setLabState(prev => ({
        ...prev,
        isCaseOn: false,
        isLoggedIn: false,
        hasError: true,
        errorType: "force_shutdown_case",
        errorMessage: "Bé đã nhấn nút nguồn trên Thân máy để tắt nóng! Làm vậy hệ điều hành sẽ bị lỗi, không nên thực hiện nhé!"
      }));
      setSubtitleText("Ui da! Tắt máy bằng cách nhấn giữ nút nguồn thân máy sẽ làm 'đau bộ não' máy tính đấy!");
      setCurrentAction("Lo_Lắng");
      playSoundByName("Error_Squeak");
      postLog("Tắt nguồn nóng CPU", "warning", "Bước 2", "Học sinh tắt máy cưỡng bức bằng nút nguồn thân máy.");
    }
  };

  const handleMonitorClick = () => {
    if (labState.hasError) return;

    if (!labState.isPluggedIn && !labState.isMonitorOn) {
      setLabState(prev => ({
        ...prev,
        hasError: true,
        errorType: "wrong_step",
        errorMessage: "Bé đã bật Màn hình khi chưa cắm điện! Màn hình cần nguồn điện thì mới phát sáng được nhé!"
      }));
      setSubtitleText("Ồ! Máy tính chưa được cắm điện kìa bạn nhỏ ơi, chúng mình phải cắm nguồn điện trước nhé!");
      setCurrentAction("Lo_Lắng");
      playSoundByName("Error_Squeak");
      postLog("Bật Màn hình khi chưa cắm điện", "warning", "Bước 3", "Học sinh cố bật màn hình khi chưa kết nối nguồn điện.");
      return;
    }

    if (!labState.isMonitorOn) {
      // Turn monitor on
      const nextStep = labState.isCaseOn ? "step4_login" : "step3_monitor";
      setLabState(prev => ({
        ...prev,
        isMonitorOn: true,
        currentStep: nextStep
      }));
      
      if (labState.isCaseOn) {
        setSubtitleText("Màn hình sáng lên rồi! Hãy nhấp nút Đăng Nhập ở Bước 4 trên màn hình máy tính để vào lớp học nhé!");
        setCurrentAction("Cổ_Vũ");
      } else {
        setSubtitleText("Màn hình đã bật nhưng hiện 'NO SIGNAL' (Chưa có tín hiệu) vì Thân máy (CPU) chưa bật đấy. Mau bật thân máy nhé!");
        setCurrentAction("Suy_Nghĩ");
      }
      playSoundByName("beep");
      postLog("Bật màn hình", "success", "Bước 3", "Học sinh bật màn hình hiển thị.");
    } else {
      // Turn monitor off
      setLabState(prev => ({
        ...prev,
        isMonitorOn: false
      }));
      setSubtitleText("Màn hình đã tắt tối thui rồi. Hãy bật màn hình lên để nhìn thấy bài học nhé!");
      setCurrentAction("Suy_Nghĩ");
      playSoundByName("click");
    }
  };

  const handleLoginClick = () => {
    if (labState.hasError) return;
    if (!labState.isCaseOn || !labState.isMonitorOn) return;

    setLabState(prev => ({
      ...prev,
      isLoggedIn: true,
      currentStep: "step5_desktop"
    }));
    setSubtitleText("Tadaaa! Chúng mình đã đăng nhập thành công vào Hệ điều hành Tin Học vui nhộn. Các bạn nhỏ có thể sử dụng rồi! Sau khi dùng xong, hãy thử tắt máy đúng quy trình bằng cách bấm nút Start ở góc trái và chọn Shut down nhé!");
    setCurrentAction("Nháy_Mắt");
    playSoundByName("Success_Jingle");
    postLog("Đăng nhập hệ thống", "success", "Bước 4", "Học sinh đăng nhập thành công vào Desktop giả lập.");
  };

  const handleShutdownOSClick = () => {
    if (labState.hasError) return;
    
    stopComputerHum();
    setLabState(prev => ({
      ...prev,
      isLoggedIn: false,
      isCaseOn: false,
      isMonitorOn: false, // In real life screens can stay on standby, but for simplicity turn all off
      currentStep: "off"
    }));
    setSubtitleText("Tuyệt vời ông mặt trời! Bé đã thực hiện đầy đủ quy trình 5 bước Bật và Tắt máy tính cực kỳ chuẩn xác và an toàn! Chú Chuột thưởng bé 10 điểm và danh hiệu Hiệp Sĩ Phòng Máy! 🏆");
    setCurrentAction("Cổ_Vũ");
    playSoundByName("Success_Jingle");
    postLog("Tắt máy an toàn", "success", "Bước 5", "Học sinh tắt hệ điều hành đúng quy trình Start -> Shut down.");
  };

  // Quiz questions for kids
  const QUIZ_QUESTIONS = [
    {
      question: "Để máy tính hoạt động được, bước đầu tiên chúng mình cần làm gì?",
      options: [
        "A. Bấm nút nguồn thân máy ngay",
        "B. Rút nguồn điện ra cất đi",
        "C. Nhờ thầy cô hoặc bố mẹ cắm phích cắm vào ổ điện"
      ],
      correct: 2,
      explanation: "Chính xác! Cần phải có nguồn điện thì máy tính mới chạy được, và nhớ nhờ người lớn cắm hộ để bảo vệ an toàn nhé!"
    },
    {
      question: "Thiết bị nào được ví như 'Bộ não thông thái' điều khiển mọi hoạt động của máy tính?",
      options: [
        "A. Thân máy (CPU Case)",
        "B. Bàn phím máy tính",
        "C. Màn hình máy tính"
      ],
      correct: 0,
      explanation: "Đúng rồi! Thân máy chứa CPU - cơ quan đầu não xử lý toàn bộ trò chơi và phép tính."
    },
    {
      question: "Khi học xong và muốn tắt máy ra về, cách nào dưới đây là ĐÚNG và AN TOÀN nhất?",
      options: [
        "A. Cứ thế giật phích cắm điện ra khỏi ổ cắm",
        "B. Vào biểu tượng Start trên màn hình -> chọn Shut down và đợi máy tắt hẳn",
        "C. Nhấn giữ thật lâu nút nguồn trên Thân máy"
      ],
      correct: 1,
      explanation: "Rất giỏi! Tắt máy qua hệ điều hành (Start -> Shut down) giúp bảo vệ dữ liệu và tăng tuổi thọ cho máy tính."
    },
    {
      question: "Nếu bé thấy dây điện phòng máy bị hở hoặc có khói bốc lên, bé nên làm gì?",
      options: [
        "A. Tự tay sờ vào kiểm tra xem nóng không",
        "B. Cứ tiếp tục chơi trò chơi và không nói gì",
        "C. Tránh xa ngay lập tức và báo lớn cho Thầy Cô giáo biết"
      ],
      correct: 2,
      explanation: "Chuẩn xác! An toàn là trên hết. Hãy tránh xa nguồn điện hở và thông báo ngay lập tức cho người lớn xử lý."
    }
  ];

  const handleQuizAnswer = (idx: number) => {
    setSelectedAnswer(idx);
    const currentQ = QUIZ_QUESTIONS[currentQuestionIdx];
    if (idx === currentQ.correct) {
      setQuizScore(prev => prev + 1);
      setSubtitleText(`Đúng rồi! Bạn nhỏ giỏi quá! ${currentQ.explanation}`);
      setCurrentAction("Cổ_Vũ");
      playSoundByName("Success_Jingle");
    } else {
      setSubtitleText(`Ồ, chưa đúng rồi bạn nhỏ ơi! Đáp án đúng phải là lựa chọn chứa hành vi an toàn cơ. Chúng mình thử suy nghĩ lại xem nhé!`);
      setCurrentAction("Lo_Lắng");
      playSoundByName("Error_Squeak");
    }
  };

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSubtitleText(`Câu hỏi số ${currentQuestionIdx + 2}: ${QUIZ_QUESTIONS[currentQuestionIdx + 1].question}`);
      setCurrentAction("Suy_Nghĩ");
      playSoundByName("click");
    } else {
      setQuizFinished(true);
      setSubtitleText(`Bé đã hoàn thành xuất sắc thử thách! Kết quả đạt được: ${quizScore}/${QUIZ_QUESTIONS.length} câu đúng. Nhấp vào đây để xem Chứng Nhận nhé!`);
      setCurrentAction("Cổ_Vũ");
      playSoundByName("Success_Jingle");
      postLog("Hoàn thành Trắc nghiệm", "success", "Thử thách", `Đạt điểm số: ${quizScore}/${QUIZ_QUESTIONS.length}`);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setSubtitleText("Hãy cùng tham gia thử thách câu đố vui để trở thành Hiệp Sĩ Phòng Máy nhé!");
    setCurrentAction("Vẫy_Tay");
    playSoundByName("click");
  };

  // Helper step details for guide hints
  const getStepHint = () => {
    switch (labState.currentStep) {
      case "step1_plug":
        return "Bé hãy nhấp chuột vào phích cắm hoặc ổ cắm điện (🔌) ở góc trái phòng máy ảo để kết nối nguồn điện nhé!";
      case "step2_case":
        return "Năng lượng đã sẵn sàng! Bây giờ bé hãy nhấp vào nút nguồn (hình tròn nhỏ phát sáng ⏻) trên Thân máy (CPU) màu xám nhé!";
      case "step3_monitor":
        return "Não bộ đã hoạt động. Giờ bé hãy click vào nút nguồn trên Màn hình (🖥️) hoặc nhấp trực tiếp vào màn hình để bật sáng gương mặt hiển thị nhé!";
      case "step4_login":
        return "Máy tính đã hiển thị rồi. Bé hãy click vào nút màu xanh 'ĐĂNG NHẬP' ở giữa màn hình ảo để vào giao diện Windows Tin học nhé!";
      case "step5_desktop":
        return "Hoan hô! Máy tính đã bật. Khi học xong, bé nhớ tắt máy chuẩn bằng cách nhấp biểu tượng cửa sổ Start màu xanh lá góc dưới màn hình ảo và chọn 'Tắt máy' (Shut down) nhé!";
      case "off":
        return "Tuyệt vời! Máy tính đã được tắt an toàn tuyệt đối. Bé có thể nhấn nút 'Thực hành lại từ đầu' ở dưới để ghi nhớ sâu sắc hơn nhé!";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 flex flex-col font-sans">
      {/* 1. Header Area */}
      <header className="glass sticky top-0 z-40 border-b border-indigo-100 px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-bounce">🐭</span>
          <div>
            <h1 className="font-extrabold text-slate-800 text-lg md:text-xl font-sans tracking-tight">
              Phòng Máy Thông Thái
            </h1>
            <p className="text-[11px] text-indigo-500 font-semibold uppercase tracking-wider">
              Trợ lý ảo & Giả lập lớp học
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex bg-slate-100/80 p-1.5 rounded-2xl gap-1 border">
          <button
            onClick={() => { setMode("welcome"); playSoundByName("click"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 ${
              mode === "welcome" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Chào Mừng
          </button>
          <button
            onClick={() => { setMode("explore"); playSoundByName("click"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 ${
              mode === "explore" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🔍 Khám Phá Thiết Bị
          </button>
          <button
            onClick={() => { setMode("practice"); playSoundByName("click"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 ${
              mode === "practice" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🔌 Luyện Tập 5 Bước
          </button>
          <button
            onClick={() => { setMode("challenge"); playSoundByName("click"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 ${
              mode === "challenge" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🏆 Thử Thách Câu Đố
          </button>
          <button
            onClick={() => { setMode("typing"); playSoundByName("click"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 ${
              mode === "typing" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            ⌨️ Gõ Phím Thần Kỳ
          </button>
        </nav>

        {/* Settings button & key status */}
        <div className="flex items-center gap-3">
          <span className="flex items-center text-xs text-rose-500 font-bold bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 animate-pulse text-[10px] sm:text-xs">
            🔑 Lấy API key để sử dụng app
          </span>
          <button
            onClick={() => { setShowSettings(true); playSoundByName("click"); }}
            className={`p-2.5 rounded-full border transition flex items-center gap-2 hover:bg-slate-50 ${
              apiKey ? "border-emerald-200 text-emerald-600 bg-emerald-50/20" : "border-rose-200 text-rose-600 bg-rose-50/30"
            }`}
            title="Cài đặt API key & Model AI"
          >
            <Settings className="w-5 h-5 animate-spin-slow" />
            <span className="text-xs font-bold hidden sm:inline">Thiết lập</span>
          </button>
        </div>
      </header>

      {/* Mobile navigation tab list */}
      <div className="flex md:hidden bg-slate-50 px-4 py-2 gap-1 border-b overflow-x-auto">
        <button
          onClick={() => { setMode("welcome"); playSoundByName("click"); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            mode === "welcome" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Chào Mừng
        </button>
        <button
          onClick={() => { setMode("explore"); playSoundByName("click"); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            mode === "explore" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🔍 Khám Phá
        </button>
        <button
          onClick={() => { setMode("practice"); playSoundByName("click"); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            mode === "practice" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🔌 Luyện Tập
        </button>
        <button
          onClick={() => { setMode("challenge"); playSoundByName("click"); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            mode === "challenge" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🏆 Thử Thách
        </button>
        <button
          onClick={() => { setMode("typing"); playSoundByName("click"); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            mode === "typing" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          ⌨️ Gõ Phím
        </button>
      </div>

      {/* 2. Main Content Grid */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dynamic Workspace Area (8 cols on lg) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Welcome Screen */}
          {mode === "welcome" && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-indigo-50 shadow-xl text-center flex flex-col items-center justify-center min-h-[450px]">
              <span className="text-7xl mb-4 animate-bounce">🎒</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2 font-sans">
                Chào Bạn Nhỏ {studentName} Đã Đến Lớp Học!
              </h2>
              <p className="text-sm text-slate-500 max-w-md mb-8">
                Hôm nay chúng mình cùng học cách nhận biết các thiết bị máy tính xinh xắn và tập quy trình 5 bước bật/tắt máy tính đúng cách cực kỳ an toàn nhé!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
                <button
                  onClick={() => { setMode("explore"); playSoundByName("click"); }}
                  className="bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 p-5 rounded-2xl text-left transition flex flex-col items-center text-center gap-2 group"
                >
                  <span className="text-4xl group-hover:scale-110 transition duration-150">🔍</span>
                  <span className="font-extrabold text-indigo-900 text-sm">Khám Phá Thiết Bị</span>
                  <span className="text-xs text-indigo-600 font-medium">Bấm xem phím, màn hình, chuột máy nhấp nháy.</span>
                </button>

                <button
                  onClick={() => { setMode("practice"); playSoundByName("click"); }}
                  className="bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 p-5 rounded-2xl text-left transition flex flex-col items-center text-center gap-2 group"
                >
                  <span className="text-4xl group-hover:scale-110 transition duration-150">🔌</span>
                  <span className="font-extrabold text-emerald-900 text-sm">Luyện Tập 5 Bước</span>
                  <span className="text-xs text-emerald-600 font-medium">Tập khởi động và tắt nguồn máy tính đúng cách.</span>
                </button>

                <button
                  onClick={() => { setMode("challenge"); playSoundByName("click"); }}
                  className="bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 p-5 rounded-2xl text-left transition flex flex-col items-center text-center gap-2 group"
                >
                  <span className="text-4xl group-hover:scale-110 transition duration-150">🏆</span>
                  <span className="font-extrabold text-amber-900 text-sm">Thử Thách Câu Đố</span>
                  <span className="text-xs text-amber-600 font-medium">Giải câu đố vui nhận Huy hiệu Hiệp sĩ phòng máy!</span>
                </button>

                <button
                  onClick={() => { setMode("typing"); playSoundByName("click"); }}
                  className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 p-5 rounded-2xl text-left transition flex flex-col items-center text-center gap-2 group"
                >
                  <span className="text-4xl group-hover:scale-110 transition duration-150">⌨️</span>
                  <span className="font-extrabold text-purple-900 text-sm">Gõ Phím Thần Kỳ</span>
                  <span className="text-xs text-purple-600 font-medium">Trò chơi gõ chữ cùng Chú Chuột để luyện phím!</span>
                </button>
              </div>

              {/* Guide Warning for Kids */}
              <div className="mt-8 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-left max-w-lg text-xs text-amber-800 flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Quy tắc An Toàn:</strong> Phòng máy chứa nhiều thiết bị điện nguy hiểm. Các bạn nhỏ tuyệt đối không được tự ý chạm vào dây điện hở hay nghịch các phích điện mà không có thầy cô giáo hướng dẫn nhé!
                </span>
              </div>
            </div>
          )}

          {/* Explore Mode */}
          {mode === "explore" && (
            <div className="bg-white rounded-3xl p-6 border border-indigo-50 shadow-xl min-h-[450px]">
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">
                    🔍 Khám Phá Phòng Máy Máy Tính
                  </h2>
                  <p className="text-xs text-slate-500">Tìm hiểu tên gọi và nhiệm vụ của các chú bé thiết bị xinh xắn.</p>
                </div>
                <button
                  onClick={() => { setMode("welcome"); playSoundByName("click"); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Thoát
                </button>
              </div>
              
              <HardwareExplorer 
                onSpeakText={(text, action) => {
                  setSubtitleText(text);
                  if (action) setCurrentAction(action);
                }} 
              />
            </div>
          )}

          {/* Practice Mode */}
          {mode === "practice" && (
            <div className="bg-white rounded-3xl p-6 border border-indigo-50 shadow-xl flex flex-col justify-between min-h-[450px]">
              
              {/* Header inside Practice */}
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    🔌 Thực Hành Quy Trình 5 Bước Chuẩn
                  </h2>
                  <p className="text-xs text-slate-500">Giúp bé tạo thói quen tốt để bảo vệ tài sản máy tính.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetLab}
                    className="px-3 py-1.5 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1 transition shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" /> Bắt đầu lại
                  </button>
                  <button
                    onClick={() => { setMode("welcome"); playSoundByName("click"); }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 ml-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Thoát
                  </button>
                </div>
              </div>

              {/* Progress Indicator for 5 steps */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[
                  { label: "B1: Cắm điện", active: labState.isPluggedIn, current: labState.currentStep === "step1_plug" },
                  { label: "B2: Bật CPU", active: labState.isCaseOn, current: labState.currentStep === "step2_case" },
                  { label: "B3: Bật Screen", active: labState.isMonitorOn, current: labState.currentStep === "step3_monitor" },
                  { label: "B4: Login", active: labState.isLoggedIn, current: labState.currentStep === "step4_login" },
                  { label: "B5: Tắt máy", active: labState.currentStep === "off", current: labState.currentStep === "step5_desktop" || labState.currentStep === "step6_shutdown" }
                ].map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`rounded-xl p-2 text-center text-[10px] md:text-xs font-extrabold border transition ${
                      step.current 
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300"
                        : step.active 
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800" 
                          : labState.hasError 
                            ? "border-red-200 bg-slate-50 text-slate-400"
                            : "border-slate-100 bg-slate-50 text-slate-400"
                    }`}
                  >
                    {step.label}
                    {step.active && <span className="block text-emerald-500 font-bold mt-0.5">✓ Hoàn tất</span>}
                    {step.current && !labState.hasError && <span className="block text-indigo-500 animate-pulse mt-0.5">Đang đợi...</span>}
                    {labState.hasError && step.current && <span className="block text-red-500 font-bold mt-0.5">Đã dừng do lỗi</span>}
                  </div>
                ))}
              </div>

              {/* Simulation Screen Wrapper */}
              <div className="relative border-4 border-slate-200 bg-slate-900 rounded-2xl aspect-video w-full flex items-center justify-center p-6 shadow-inner overflow-hidden">
                
                {/* 1. Error / Crash Overlay Screen */}
                {labState.hasError ? (
                  <div className="absolute inset-0 bg-red-950/95 z-20 flex flex-col items-center justify-center text-center p-6 animate-pulse">
                    <span className="text-6xl mb-4 animate-bounce">⚡💥</span>
                    <h3 className="text-white font-extrabold text-xl mb-2">HỆ THỐNG GẶP SỰ CỐ!</h3>
                    <p className="text-red-300 text-sm max-w-md mb-6">{labState.errorMessage}</p>
                    <button
                      onClick={handleResetLab}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm shadow-lg border-2 border-red-400 transition"
                    >
                      🔧 Sửa chữa & Thực hành lại
                    </button>
                  </div>
                ) : null}

                {/* 2. Virtual Power Cord / Outlet (Bottom Left) */}
                <div className="absolute bottom-4 left-6 z-10 flex flex-col gap-2">
                  <label className="flex items-center gap-2 bg-slate-800/95 border border-slate-700 p-2 rounded-xl cursor-pointer text-white hover:bg-slate-750 transition select-none">
                    <input
                      type="checkbox"
                      checked={labState.isWetHands}
                      onChange={(e) => {
                        playSoundByName("click");
                        setLabState(prev => ({ ...prev, isWetHands: e.target.checked }));
                      }}
                      className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-bold">💧 Tay bé đang ướt?</span>
                  </label>

                  <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl">
                    <span className="text-2xl">🔌</span>
                    <button
                      onClick={handlePlugClick}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 ${
                        labState.isPluggedIn 
                          ? "bg-rose-600 hover:bg-rose-700 text-white" 
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {labState.isPluggedIn ? "Rút nguồn ảo" : "Cắm nguồn ảo"}
                    </button>
                  </div>
                </div>

                {/* 3. The Interactive Monitor Desktop (Center-Right) */}
                <div className="w-3/5 aspect-video bg-slate-950 border-8 border-slate-800 rounded-xl relative flex flex-col shadow-2xl items-center justify-between">
                  {/* Screen Display Content */}
                  <div className="flex-grow w-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-900 text-white text-center">
                    
                    {!labState.isMonitorOn ? (
                      // Monitor is turned off
                      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-xs text-slate-600">
                        <span className="text-3xl mb-1">🖥️</span>
                        <span>Màn hình đang tắt nguồn</span>
                      </div>
                    ) : !labState.isCaseOn ? (
                      // Monitor on but CPU Case is off
                      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-xs text-amber-500 font-mono animate-pulse">
                        <span>⚠️ NO SIGNAL</span>
                        <span className="text-[10px] text-slate-500 mt-1">Chưa bật thân máy tính (CPU)</span>
                      </div>
                    ) : !labState.isLoggedIn ? (
                      // CPU on, Monitor on, but not logged in -> LOGIN SCREEN
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-pink-600 flex flex-col items-center justify-center p-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl mb-2 animate-bounce">
                          👤
                        </div>
                        <h4 className="text-xs font-bold mb-1">Chào mừng bạn nhỏ!</h4>
                        <span className="text-[10px] bg-black/30 px-3 py-1 rounded-full mb-4">
                          {studentName} (Grade 2)
                        </span>
                        
                        {labState.currentStep === "step4_login" ? (
                          <button
                            onClick={handleLoginClick}
                            className="btn-3d-emerald px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> ĐĂNG NHẬP
                          </button>
                        ) : (
                          <div className="text-[10px] text-yellow-300 animate-pulse font-mono">
                            Đang đợi tín hiệu khởi động...
                          </div>
                        )}
                      </div>
                    ) : (
                      // Desktop Interface
                      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-indigo-600 text-slate-800 flex flex-col justify-between p-2">
                        {/* Desktop icons */}
                        <div className="grid grid-cols-4 gap-2 text-left">
                          <div className="flex flex-col items-center cursor-pointer p-1 rounded hover:bg-white/20">
                            <span className="text-xl">🎨</span>
                            <span className="text-[8px] text-white font-bold">Tập Vẽ</span>
                          </div>
                          <div className="flex flex-col items-center cursor-pointer p-1 rounded hover:bg-white/20">
                            <span className="text-xl">📚</span>
                            <span className="text-[8px] text-white font-bold">Học Tập</span>
                          </div>
                          <div className="flex flex-col items-center cursor-pointer p-1 rounded hover:bg-white/20">
                            <span className="text-xl">🎮</span>
                            <span className="text-[8px] text-white font-bold">Đố Vui</span>
                          </div>
                        </div>

                        <div className="text-white text-xs drop-shadow font-bold animate-pulse">
                          ✨ Máy tính đã sẵn sàng sử dụng ✨
                        </div>

                        {/* Taskbar / Start Menu */}
                        <div className="w-full bg-slate-900/90 h-6 rounded-md flex items-center justify-between px-1 border-t border-slate-700/50">
                          {/* Start menu */}
                          <div className="relative group">
                            <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                              <span>🟢</span> Start
                            </button>
                            
                            {/* Dropdown start options */}
                            <div className="absolute bottom-6 left-0 w-24 bg-slate-800 text-white rounded-md shadow-lg border border-slate-700 hidden group-hover:block p-1 text-left">
                              <button
                                onClick={handleShutdownOSClick}
                                className="w-full hover:bg-rose-600 text-[9px] py-1 px-2 rounded flex items-center gap-1 font-bold text-left text-rose-300 hover:text-white"
                              >
                                🔴 Shut down
                              </button>
                            </div>
                          </div>

                          <span className="text-[8px] text-slate-400 font-mono">12:00 PM</span>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Monitor Stand */}
                  <div className="absolute -bottom-6 w-12 h-6 bg-slate-700 left-1/2 transform -translate-x-1/2" />
                  <div className="absolute -bottom-8 w-24 h-2.5 bg-slate-800 left-1/2 transform -translate-x-1/2 rounded-full" />
                  
                  {/* Physical Monitor Power Button */}
                  <button
                    onClick={handleMonitorClick}
                    className={`absolute right-4 bottom-2 w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7px] font-bold ${
                      labState.isMonitorOn ? "bg-emerald-500 border-emerald-400 text-white" : "bg-slate-600 border-slate-500 text-slate-400"
                    }`}
                    title="Nút nguồn Màn hình"
                  >
                    ⏻
                  </button>
                </div>

                {/* 4. CPU Computer Case (Right Side) */}
                <div className="absolute bottom-4 right-6 flex flex-col items-center">
                  <div className="w-14 h-24 bg-slate-800 rounded-lg border-2 border-slate-700 p-1 flex flex-col justify-between items-center relative shadow-xl">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    </div>

                    <div className="w-8 h-1 bg-slate-600 rounded" />
                    
                    {/* Blinking Power Button on CPU */}
                    <button
                      onClick={handleCaseClick}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] text-white font-bold transition shadow ${
                        labState.isCaseOn 
                          ? "bg-blue-500 border-blue-400 animate-pulse" 
                          : "bg-slate-600 border-slate-500 hover:bg-slate-700"
                      }`}
                      title="Nút nguồn CPU"
                    >
                      ⏻
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-400 uppercase mt-1 font-bold">Thân máy</span>
                </div>

              </div>

              {/* Reset/Control details below simulation */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-indigo-500 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                  🎯 Bước tiếp theo: {labState.currentStep === "off" ? "Đã xong" : getStepHint()}
                </span>
                
                {labState.currentStep === "off" && (
                  <button
                    onClick={handleResetLab}
                    className="btn-3d-emerald px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    🔁 Thực hành lại từ đầu
                  </button>
                )}
              </div>

            </div>
          )}

          {/* Challenge Mode (Quiz Questions) */}
          {mode === "challenge" && (
            <div className="bg-white rounded-3xl p-6 border border-indigo-50 shadow-xl flex flex-col justify-between min-h-[450px]">
              
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">
                    🏆 Thử Thách Hiệp Sĩ Máy Tính
                  </h2>
                  <p className="text-xs text-slate-500">Trả lời đúng các câu hỏi để nhận Chứng nhận danh giá.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetQuiz}
                    className="px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 transition"
                  >
                    Làm lại câu đố
                  </button>
                  <button
                    onClick={() => { setMode("welcome"); playSoundByName("click"); }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 ml-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Thoát
                  </button>
                </div>
              </div>

              {!quizFinished ? (
                // Quiz Ongoing
                <div className="flex-grow flex flex-col justify-between">
                  <div className="my-4">
                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                      Câu hỏi {currentQuestionIdx + 1} / {QUIZ_QUESTIONS.length}
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-base md:text-lg mt-4 mb-6">
                      {QUIZ_QUESTIONS[currentQuestionIdx].question}
                    </h3>

                    <div className="space-y-3">
                      {QUIZ_QUESTIONS[currentQuestionIdx].options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => {
                            if (selectedAnswer !== null) return;
                            handleQuizAnswer(oIdx);
                          }}
                          className={`w-full p-4 rounded-2xl text-left text-sm font-bold border transition duration-150 flex items-center justify-between ${
                            selectedAnswer === oIdx
                              ? oIdx === QUIZ_QUESTIONS[currentQuestionIdx].correct
                                ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                                : "bg-rose-50 border-rose-400 text-rose-800"
                              : selectedAnswer !== null && oIdx === QUIZ_QUESTIONS[currentQuestionIdx].correct
                                ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50/50 hover:border-indigo-200"
                          }`}
                          disabled={selectedAnswer !== null}
                        >
                          <span>{opt}</span>
                          {selectedAnswer !== null && oIdx === QUIZ_QUESTIONS[currentQuestionIdx].correct && (
                            <span className="text-emerald-500 font-extrabold">✓ Đúng</span>
                          )}
                          {selectedAnswer === oIdx && oIdx !== QUIZ_QUESTIONS[currentQuestionIdx].correct && (
                            <span className="text-rose-500 font-extrabold">✗ Sai rồi</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 flex justify-end">
                    {selectedAnswer !== null && (
                      <button
                        onClick={handleNextQuiz}
                        className="btn-3d-indigo px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        Tiếp theo <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Quiz Finished / Certification Screen
                <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
                  <div className="relative mb-6">
                    <span className="text-8xl animate-bounce block">🏆</span>
                    <span className="text-4xl absolute -top-2 -right-2 animate-spin-slow">✨</span>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-dashed border-amber-300 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-md">
                    <div className="absolute top-2 right-2 text-3xl">🎖️</div>
                    <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider block mb-1">
                      Chứng Nhận Danh Dự
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-xl font-sans mb-4">
                      HIỆP SĨ TIN HỌC TÍ HON
                    </h3>
                    
                    <p className="text-sm font-medium text-slate-600 mb-6">
                      Trao tặng cho người bạn nhỏ thông thái:
                      <strong className="block text-indigo-600 text-base font-extrabold uppercase mt-1">
                        {studentName}
                      </strong>
                    </p>

                    <div className="border-t border-amber-200/50 pt-4 flex items-center justify-between text-xs text-amber-800">
                      <span>Điểm số: <strong>{quizScore} / {QUIZ_QUESTIONS.length} đúng</strong></span>
                      <span>Người duyệt: <strong>Chú Chuột 🐭</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-8 justify-center">
                    <button
                      onClick={handleResetQuiz}
                      className="btn-3d-indigo px-5 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold"
                    >
                      🔁 Làm lại câu đố
                    </button>
                    <button
                      onClick={handleExportDocx}
                      className="btn-3d-emerald px-5 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      📥 Tải Chứng Nhận Word (.docx)
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Typing Game Mode */}
          {mode === "typing" && (
            <div className="bg-white rounded-3xl p-6 border border-indigo-50 shadow-xl min-h-[450px] flex flex-col">
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">
                    ⌨️ Trò Chơi Gõ Phím Thần Kỳ
                  </h2>
                  <p className="text-xs text-slate-500">Gõ đúng các nút chữ cái để vượt qua thử thách cùng Chú Chuột nhé.</p>
                </div>
                <button
                  onClick={() => { setMode("welcome"); playSoundByName("click"); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Thoát
                </button>
              </div>

              <TypingGame
                studentName={studentName}
                onSpeakText={(text, action) => {
                  setSubtitleText(text);
                  if (action) setCurrentAction(action);
                }}
                onPostLog={postLog}
              />
            </div>
          )}

        </section>

        {/* Right Side: Assistant Chat & Speech Panel (4 cols on lg) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <AssistantPanel
            currentAction={currentAction}
            subtitleText={subtitleText}
            onAskGemini={handleAskGemini}
            isLoading={isLoadingChat}
            stepHint={mode === "practice" ? getStepHint() : undefined}
          />
        </section>

      </main>

      {/* 3. Bottom Teacher Report Section (Collapsible) */}
      <footer className="bg-slate-950 text-slate-300 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-slate-800 text-slate-400">🛡️</span>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white">Chế độ giám sát dành cho Giáo Viên</h4>
              <p className="text-[10px] text-slate-500">Giúp thầy cô rà soát hành vi và sự an toàn của học sinh.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowTeacherLogs(!showTeacherLogs);
                playSoundByName("click");
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              {showTeacherLogs ? "Ẩn Nhật Ký" : "Xem Nhật Ký Lớp Học"}
              <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {teacherLogs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Teacher logs table & stats display */}
        {showTeacherLogs && (
          <div className="border-t border-slate-800 bg-slate-900/90 max-w-7xl mx-auto p-6 transition duration-200">
            
            {/* 2. Visual Statistics Dashboard */}
            <div className="mb-8">
              <TeacherDashboard logs={teacherLogs} onExportPptx={handleExportPptx} />
            </div>

            {/* Logs detail section header */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Chi tiết lịch sử hoạt động
              </h4>
              <button
                onClick={handleClearLogs}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả log
              </button>
            </div>

            {/* logs table */}
            <div className="overflow-y-auto max-h-60 rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Tên Học Sinh</th>
                    <th className="p-3">Hành vi thực hiện</th>
                    <th className="p-3">Loại log</th>
                    <th className="p-3">Ghi chú chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {teacherLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="p-3 text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-3 text-slate-200 font-bold">{log.studentName}</td>
                      <td className="p-3 text-indigo-400 font-medium">{log.action}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          log.status === "success" 
                            ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/50" 
                            : log.status === "warning"
                              ? "bg-rose-950/50 text-rose-400 border border-rose-900/50"
                              : "bg-slate-800 text-slate-400"
                        }`}>
                          {log.status === "success" ? "Thành công" : log.status === "warning" ? "Cảnh báo" : "Thông tin"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </footer>

      {/* 4. Settings Configuration Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-indigo-100 animate-scale-up relative">
            <button
              onClick={() => {
                if (apiKey) setShowSettings(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition text-slate-400"
              disabled={!apiKey}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-slate-800 text-lg mb-2 flex items-center gap-2">
              ⚙️ Cấu Hình API Key & Model AI
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Vui lòng nhập API Key cá nhân của bạn để sử dụng chat với Chú Chuột Thông Thái.
            </p>

            <div className="space-y-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Tên Học Sinh của Bé:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={tempStudentName}
                    onChange={(e) => setTempStudentName(e.target.value)}
                    placeholder="Nhập tên bé..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-sans"
                  />
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Gemini API Key:
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-mono"
                />
                
                {/* How to get API link */}
                <div className="mt-2 text-left">
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-600 underline flex items-center gap-0.5"
                  >
                    🔗 Lấy API key miễn phí tại đây (Google AI Studio)
                  </a>
                </div>
              </div>

              {/* Model Choice (Cards) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Chọn Model Trí Tuệ Nhân Tạo (AI):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "gemini-3-flash-preview", label: "gemini-3-flash-preview (Default)", short: "Flash 3.0" },
                    { id: "gemini-3-pro-preview", label: "gemini-3-pro-preview", short: "Pro 3.0" },
                    { id: "gemini-2.5-flash", label: "gemini-2.5-flash", short: "Flash 2.5" }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-3 rounded-2xl border text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                        selectedModel === m.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${selectedModel === m.id ? "text-indigo-600" : "text-slate-400"}`} />
                      <span>{m.short}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={!apiKey.trim() || !tempStudentName.trim()}
                className="btn-3d-indigo w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Lưu và sử dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
