import { Document as DocxDocument, Paragraph, TextRun, AlignmentType } from "docx";
import pptxgen from "pptxgenjs";

// Helper to generate DOCX certificate
export function generateDocxCertificate(studentName: string, score: string) {
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

// Helper to generate PPTX lesson slide
export function generatePptxLesson() {
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
