import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import pptxgen from "pptxgenjs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get GoogleGenAI client based on API key
function getAIClient(apiKeyHeader: any) {
  const key = apiKeyHeader || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("API Key is missing. Please configure it in Settings.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// In-memory logs storage for the Teacher Report Log
interface ReportLog {
  id: string;
  timestamp: string;
  studentName: string;
  action: string;
  status: "success" | "warning" | "info";
  step?: string;
  message: string;
}

const teacherReportLogs: ReportLog[] = [
  {
    id: "1",
    timestamp: new Date().toISOString(),
    studentName: "Học sinh giả lập",
    action: "Khởi động hệ thống",
    status: "info",
    message: "Hệ thống Trợ Lý Ảo Phòng Máy đã khởi động sẵn sàng."
  }
];

// Endpoint to post a new teacher report log
app.post("/api/report", (req, res) => {
  const { studentName, action, status, step, message } = req.body;
  const newLog: ReportLog = {
    id: String(Date.now()),
    timestamp: new Date().toISOString(),
    studentName: studentName || "Bạn nhỏ ẩn danh",
    action,
    status: status || "info",
    step,
    message
  };
  teacherReportLogs.unshift(newLog);
  res.json({ success: true, log: newLog });
});

// Endpoint to fetch teacher logs
app.get("/api/reports", (req, res) => {
  res.json(teacherReportLogs);
});

// Endpoint to clear teacher logs (except the initial one)
app.post("/api/reports/clear", (req, res) => {
  teacherReportLogs.splice(1);
  res.json({ success: true });
});

// Helper to generate DOCX certificate
function generateDocxCertificate(studentName: string, score: string) {
  return new DocxDocument({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 800, after: 200 },
            children: [
              new TextRun({
                text: "🏆 CHỨNG NHẬN DANH DỰ 🏆",
                bold: true,
                size: 32,
                color: "1e1b4b",
                font: "Arial"
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 500 },
            children: [
              new TextRun({
                text: "HIỆP SĨ TIN HỌC TÍ HON",
                bold: true,
                size: 40,
                color: "4f46e5",
                font: "Arial"
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: "Chứng nhận này tự hào được trao tặng cho bạn nhỏ:",
                size: 20,
                italics: true,
                font: "Arial"
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 300 },
            children: [
              new TextRun({
                text: studentName.toUpperCase(),
                bold: true,
                size: 36,
                color: "b91c1c",
                font: "Arial"
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 600 },
            children: [
              new TextRun({
                text: `Đã xuất sắc hoàn thành cuộc thi đố vui phòng máy thông thái đạt điểm số tối đa: ${score} câu trả lời đúng và thực hành thành thạo 5 bước vận hành máy tính an toàn, bảo vệ tài sản trường học.`,
                size: 18,
                font: "Arial"
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 600, after: 100 },
            children: [
              new TextRun({
                text: "Người Duyệt Ký          ",
                bold: true,
                size: 16,
                font: "Arial"
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: "Chú Chuột Thông Thái 🐭   ",
                bold: true,
                size: 20,
                color: "4f46e5",
                font: "Arial"
              }),
            ],
          }),
        ],
      },
    ],
  });
}

// Helper to generate PPTX lesson
function generatePptxLesson() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";

  // Slide 1: Welcome Slide
  const slide1 = pptx.addSlide();
  slide1.background = { fill: "f5f3ff" };
  
  // Top border bar using empty text block with fill
  slide1.addText("", { x: 0, y: 0, w: 10, h: 0.4, fill: { color: "4f46e5" } });
  
  slide1.addText("BÀI GIẢNG PHÒNG MÁY THÔNG THÁI", {
    x: 0.5,
    y: 1.5,
    w: 9.0,
    h: 1.5,
    fontSize: 36,
    bold: true,
    color: "1e1b4b",
    align: "center",
    fontFace: "Arial"
  });
  slide1.addText("Dành cho các bạn nhỏ Lớp 1 & Lớp 2 học cách sử dụng máy tính an toàn", {
    x: 0.5,
    y: 3.2,
    w: 9.0,
    h: 1.0,
    fontSize: 18,
    color: "4f46e5",
    align: "center",
    fontFace: "Arial"
  });
  slide1.addText("Giáo viên hướng dẫn • Trợ lý Chú Chuột 🐭", {
    x: 0.5,
    y: 4.8,
    w: 9.0,
    h: 0.8,
    fontSize: 14,
    color: "6b7280",
    align: "center",
    fontFace: "Arial"
  });

  // Slide 2: 6 Hardware Components
  const slide2 = pptx.addSlide();
  slide2.background = { fill: "ffffff" };
  
  // Header bar
  slide2.addText("", { x: 0, y: 0, w: 10, h: 0.8, fill: { color: "4f46e5" } });
  slide2.addText("1. CÁC LINH KIỆN MÁY TÍNH QUEN THUỘC", {
    x: 0.5,
    y: 0.1,
    w: 9.0,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: "ffffff",
    fontFace: "Arial"
  });
  
  slide2.addText("🖥️ Màn hình (Monitor): Hiển thị hình ảnh và trò chơi màu sắc.\n💻 Thân máy (CPU): Bộ não thông thái xử lý mọi dữ liệu.\n⌨️ Bàn phím (Keyboard): Để gõ các chữ cái và chữ số.\n🖱️ Chuột (Mouse): Di chuyển mũi tên nhỏ tinh nghịch.\n🔊 Loa (Speakers): Phát âm thanh bài giảng và tiếng nói của Chú Chuột.\n🔌 Ổ điện (Power): Nguồn điện cung cấp thức ăn năng lượng cho máy.", {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 4.0,
    fontSize: 15,
    color: "374151",
    lineSpacing: 22,
    fontFace: "Arial"
  });

  // Slide 3: 5 Steps to Turn On & Off Safely
  const slide3 = pptx.addSlide();
  slide3.background = { fill: "ecfdf5" };
  
  // Header bar
  slide3.addText("", { x: 0, y: 0, w: 10, h: 0.8, fill: { color: "047857" } });
  slide3.addText("2. QUY TRÌNH 5 BƯỚC VẬN HÀNH AN TOÀN", {
    x: 0.5,
    y: 0.1,
    w: 9.0,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: "ffffff",
    fontFace: "Arial"
  });
  
  slide3.addText("Bước 1: Nhờ người lớn cắm phích điện ảo vào ổ cắm 🔌\nBước 2: Bấm nút Nguồn trên Thân máy (CPU) 💻\nBước 3: Bấm nút Nguồn trên Màn hình 🖥️\nBước 4: Nhấp nút Đăng Nhập để vào lớp học 👤\nBước 5: Học xong, tắt máy an toàn qua Start -> Shut down 🔴", {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 4.0,
    fontSize: 16,
    bold: true,
    color: "065f46",
    lineSpacing: 26,
    fontFace: "Arial"
  });

  // Slide 4: Electrical Safety Warn
  const slide4 = pptx.addSlide();
  slide4.background = { fill: "fff7ed" };
  
  // Header bar
  slide4.addText("", { x: 0, y: 0, w: 10, h: 0.8, fill: { color: "c2410c" } });
  slide4.addText("3. QUY TẮC AN TOÀN ĐIỆN QUAN TRỌNG!", {
    x: 0.5,
    y: 0.1,
    w: 9.0,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: "ffffff",
    fontFace: "Arial"
  });
  
  slide4.addText("❌ TUYỆT ĐỐI KHÔNG chạm vào ổ điện hoặc phích cắm khi tay đang ướt nước! 💧\n❌ TUYỆT ĐỐI KHÔNG giật dây điện hoặc rút phích đột ngột khi máy tính đang chạy!\n❌ TUYỆT ĐỐI KHÔNG tự sửa dây điện bị hở. Báo thầy cô ngay khi thấy khói khét!\n✔️ Hãy luôn giữ tay khô ráo và làm việc dưới sự hướng dẫn của thầy cô, bố mẹ.", {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 4.0,
    fontSize: 15,
    color: "7c2d12",
    lineSpacing: 22,
    fontFace: "Arial"
  });

  return pptx;
}

// Route to export DOCX certificate
app.get("/api/export/docx", async (req, res) => {
  try {
    const studentName = String(req.query.studentName || "Bạn nhỏ hiếu học");
    const score = String(req.query.score || "4");
    const doc = generateDocxCertificate(studentName, score);
    const b64 = await Packer.toBase64String(doc);
    const buffer = Buffer.from(b64, "base64");

    res.setHeader("Content-Disposition", `attachment; filename=ChungNhan_${encodeURIComponent(studentName)}.docx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buffer);
  } catch (err: any) {
    console.error("Lỗi xuất DOCX:", err);
    res.status(500).json({ error: "Không thể xuất file Word", message: err.message });
  }
});

// Route to export PPTX lesson slide
app.get("/api/export/pptx", async (req, res) => {
  try {
    const pptx = generatePptxLesson();
    const b64 = await pptx.write({ outputType: "base64" });
    const buffer = Buffer.from(b64 as string, "base64");

    res.setHeader("Content-Disposition", "attachment; filename=BaiGiang_PhongMayThongThai.pptx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.send(buffer);
  } catch (err: any) {
    console.error("Lỗi xuất PPTX:", err);
    res.status(500).json({ error: "Không thể xuất slide PowerPoint", message: err.message });
  }
});

// Route to generate TTS using Edge TTS (supports regional Vietnamese voices)
app.get("/api/tts", async (req, res): Promise<any> => {
  try {
    const text = String(req.query.text || "");
    const voice = String(req.query.voice || "vi-VN-HoaiMyNeural");
    
    if (!text.trim()) {
      res.status(400).json({ error: "Text parameter is required" });
      return;
    }

    // Convert numerical rate (e.g. 0.9) to Edge TTS format (e.g. -10%)
    let rateStr = "+0%";
    if (req.query.rate) {
      const rateNum = parseFloat(String(req.query.rate));
      if (!isNaN(rateNum)) {
        const percent = Math.round((rateNum - 1.0) * 100);
        rateStr = percent >= 0 ? `+${percent}%` : `${percent}%`;
      }
    }

    // Convert numerical pitch (e.g. 1.2) to Edge TTS format (e.g. +10Hz)
    let pitchStr = "+0Hz";
    if (req.query.pitch) {
      const pitchNum = parseFloat(String(req.query.pitch));
      if (!isNaN(pitchNum)) {
        const hzVal = Math.round((pitchNum - 1.0) * 50);
        pitchStr = hzVal >= 0 ? `+${hzVal}Hz` : `${hzVal}Hz`;
      }
    }

    const { EdgeTTS } = await import("edge-tts-universal");
    const tts = new EdgeTTS(text, voice, {
      rate: rateStr,
      pitch: pitchStr,
      volume: "+0%",
    });
    
    const result = await tts.synthesize();
    const arrayBuffer = await result.audio.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.send(audioBuffer);
    return;
  } catch (err: any) {
    console.error("Lỗi sinh TTS:", err);
    res.status(500).json({ error: "Không thể tạo giọng nói", message: err.message });
    return;
  }
});

// Endpoint to chat with the Gemini AI "Chú Chuột Thông Thái"
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const clientApiKey = req.headers["x-gemini-api-key"];
    const requestedModel = req.headers["x-gemini-model"] || "gemini-3-flash-preview";

    // Setup fallback chain
    const fallbackList = [
      "gemini-3-flash-preview",
      "gemini-3-pro-preview",
      "gemini-2.5-flash"
    ];

    // Remove duplicates and put requested model at the front
    const modelsToTry = [requestedModel as string];
    for (const m of fallbackList) {
      if (!modelsToTry.includes(m)) {
        modelsToTry.push(m);
      }
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

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role,
          parts: [{ text: h.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    let ai;
    try {
      ai = getAIClient(clientApiKey);
    } catch (keyErr: any) {
      return res.status(400).json({
        Audio_Script: "Bạn nhỏ ơi, chưa có API Key! Hãy nhấp nút Thiết Lập ở góc phải trên để điền API Key nhé!",
        Visual_Action: "Lo_Lắng",
        Sound_Effect: "Error_Squeak",
        error: keyErr.message
      });
    }

    let responseText = "";
    let successModel = "";
    let lastError: any = null;

    // Retry loop through all fallback models
    for (const currentModel of modelsToTry) {
      try {
        console.log(`[Gemini] Attempting content generation with model: ${currentModel}`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                Audio_Script: {
                  type: Type.STRING,
                  description: "Lời nói tiếng Việt thân thiện, siêu ngắn cho bé"
                },
                Visual_Action: {
                  type: Type.STRING,
                  description: "Hành động trực quan của Chú Chuột"
                },
                Sound_Effect: {
                  type: Type.STRING,
                  description: "Hiệu ứng âm thanh thích hợp"
                }
              },
              required: ["Audio_Script", "Visual_Action", "Sound_Effect"]
            }
          }
        });

        if (response && response.text) {
          responseText = response.text;
          successModel = currentModel;
          break; // Success!
        }
      } catch (err: any) {
        console.warn(`[Gemini] Model ${currentModel} failed:`, err.message || err);
        lastError = err;
        // Proceed to next model
      }
    }

    if (!responseText) {
      // All models failed!
      const errorMsg = lastError ? (lastError.message || String(lastError)) : "All models failed";
      console.error("[Gemini] All models failed in retry chain. Last error:", errorMsg);
      
      // Determine user friendly code or error snippet
      let displayError = errorMsg;
      if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        displayError = "429 RESOURCE_EXHAUSTED";
      } else if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("400") || errorMsg.includes("API key not valid")) {
        displayError = "API key not valid";
      }

      return res.status(500).json({
        Audio_Script: `Ối, Chú Chuột gặp sự cố kết nối rồi! Gặp lỗi: ${displayError}`,
        Visual_Action: "Lo_Lắng",
        Sound_Effect: "Error_Squeak",
        error: displayError
      });
    }

    console.log(`[Gemini] Content generated successfully using model: ${successModel}`);
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

    return res.json(parsed);
  } catch (error: any) {
    console.error("Internal Server Error in chat api:", error);
    return res.status(500).json({
      Audio_Script: "Ối, tớ bị nấc cụt một chút rồi! Bạn nhỏ thử lại sau nhé!",
      Visual_Action: "Lo_Lắng",
      Sound_Effect: "Error_Squeak",
      error: error.message || String(error)
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
