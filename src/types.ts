export interface HardwareComponent {
  id: string;
  name: string;
  englishName: string;
  avatar: string;
  description: string;
  metaphor: string;
  funFact: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  audioScript?: string;
  visualAction?: string;
  soundEffect?: string;
}

export interface TeacherLog {
  id: string;
  timestamp: string;
  studentName: string;
  action: string;
  status: "success" | "warning" | "info";
  step?: string;
  message: string;
}

export type AppMode = "welcome" | "explore" | "practice" | "challenge" | "typing";

export type PracticeStep = 
  | "step1_plug"      // Step 1: Check & Plug power cord
  | "step2_case"      // Step 2: Turn on Computer Case (CPU) Power Button
  | "step3_monitor"   // Step 3: Turn on Monitor Power Button
  | "step4_login"     // Step 4: Login into simulation OS
  | "step5_desktop"   // Step 5: Normal usage (Desktop) - waiting to shut down
  | "step6_shutdown"  // Step 6: Shut down safely via Start -> Shut down
  | "off";            // Computer is turned off safely

export interface LabState {
  isPluggedIn: boolean;
  isCaseOn: boolean;
  isMonitorOn: boolean;
  isLoggedIn: boolean;
  isWetHands: boolean;
  currentStep: PracticeStep;
  hasError: boolean;
  errorMessage: string;
  errorType: "none" | "short_out" | "unplugged_force" | "force_shutdown_case" | "wrong_step";
}

export const HARDWARE_LIST: HardwareComponent[] = [
  {
    id: "monitor",
    name: "Màn hình",
    englishName: "Monitor",
    avatar: "🖥️",
    description: "Gương mặt của máy tính, hiển thị những hình ảnh sắc màu và trò chơi rực rỡ.",
    metaphor: "Giống như chiếc tivi nhà bạn nhỏ, giúp chúng mình nhìn thấy mọi thứ!",
    funFact: "Màn hình cũng cần được lau sạch bụi bằng khăn mềm để luôn sáng bừng đấy!"
  },
  {
    id: "case",
    name: "Thân máy (CPU)",
    englishName: "Computer Case",
    avatar: "💻",
    description: "Bộ não thông thái của máy tính, chứa tất cả sức mạnh để chạy trò chơi và phần mềm.",
    metaphor: "Bộ não biết nghĩ, nơi lưu trữ mọi bí mật và kiến thức tin học!",
    funFact: "Bên trong thân máy có những chiếc quạt nhỏ xinh quay vù vù để giữ cho não luôn mát mẻ."
  },
  {
    id: "keyboard",
    name: "Bàn phím",
    englishName: "Keyboard",
    avatar: "⌨️",
    description: "Bảng gõ thần kỳ có nhiều nút chữ và số để bạn gõ văn bản và điều khiển.",
    metaphor: "Một phím đàn piano khổng lồ, mỗi lần gõ là một ký tự xuất hiện!",
    funFact: "Nút dài nhất trên bàn phím là phím Cách (Spacebar), giúp các chữ đứng xa nhau ra cho dễ đọc!"
  },
  {
    id: "mouse",
    name: "Chuột máy tính",
    englishName: "Mouse",
    avatar: "🖱️",
    description: "Thiết bị nhỏ xinh vừa lòng bàn tay giúp bạn di chuyển mũi tên trên màn hình.",
    metaphor: "Chú chuột nhắt tinh nghịch chạy trên bàn, đuôi là chiếc dây nối!",
    funFact: "Nhấp chuột 2 lần thật nhanh gọi là 'Double click' (nhấp đúp), giống như gõ cửa gọi máy tính mở ra vậy!"
  },
  {
    id: "speakers",
    name: "Loa máy tính",
    englishName: "Speakers",
    avatar: "🔊",
    description: "Bộ phận phát ra âm thanh, giúp bạn nghe nhạc, xem phim và nghe Chú Chuột nói chuyện.",
    metaphor: "Chiếc miệng ca hát vui tươi của máy tính!",
    funFact: "Âm lượng loa vừa phải giúp bảo vệ tai của bạn nhỏ luôn khỏe mạnh đấy!"
  },
  {
    id: "power",
    name: "Ổ cắm & Phích cắm",
    englishName: "Power Outlet & Plug",
    avatar: "🔌",
    description: "Nguồn cung cấp năng lượng điện kỳ diệu giúp máy tính hoạt động.",
    metaphor: "Bữa ăn đầy năng lượng thần kỳ cung cấp sức mạnh cho máy tính!",
    funFact: "Khi sử dụng ổ điện thật, chúng mình luôn phải có người lớn hướng dẫn để an toàn tuyệt đối nhé!"
  }
];
