import React from "react";
import { TeacherLog } from "../types";
import { Award, AlertTriangle, CheckCircle, Info, Download } from "lucide-react";

interface TeacherDashboardProps {
  logs: TeacherLog[];
  onExportPptx: () => void;
}

export default function TeacherDashboard({ logs, onExportPptx }: TeacherDashboardProps) {
  // 1. Calculate general stats
  const total = logs.length;
  const successCount = logs.filter(l => l.status === "success").length;
  const warningCount = logs.filter(l => l.status === "warning").length;
  const infoCount = logs.filter(l => l.status === "info").length;

  // 2. Count actions to see what is most frequent
  const actionCounts: { [key: string]: number } = {};
  logs.forEach(l => {
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
  });

  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Math for SVG Pie Chart of Statuses
  const totalStatus = successCount + warningCount + infoCount;
  
  // Calculate segments
  let currentAngle = 0;
  const pieSegments = [
    { count: successCount, color: "#10b981", name: "Thành công" },
    { count: warningCount, color: "#f43f5e", name: "Cảnh báo lỗi" },
    { count: infoCount, color: "#64748b", name: "Thông tin" }
  ].map(seg => {
    const percentage = totalStatus > 0 ? (seg.count / totalStatus) * 100 : 0;
    const angle = totalStatus > 0 ? (seg.count / totalStatus) * 360 : 0;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    // Polar to cartesian coordinates helper for SVG arcs
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
      };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "L", x, y,
        "Z"
      ].join(" ");
    };

    const d = percentage > 0 ? describeArc(100, 100, 80, startAngle, startAngle + angle) : "";
    return { ...seg, percentage, d };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl flex flex-col gap-6" id="teacher-dashboard">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            📊 Biểu Đồ Thống Kê Hành Vi Học Sinh
          </h3>
          <p className="text-[11px] text-slate-400">Trực quan hóa thời gian thực các sự kiện từ phòng máy ảo.</p>
        </div>
        
        {/* Export Lecture PPTX button for teachers */}
        <button
          onClick={onExportPptx}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md self-stretch sm:self-auto justify-center"
        >
          <Download className="w-3.5 h-3.5" />
          Tải Slide Bài Giảng (.PPTX)
        </button>
      </div>

      {total === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          Chưa có hoạt động nào được ghi nhận. Học sinh cần thực hành để sinh dữ liệu.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left: SVG Pie Chart (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-4">
              Tỷ lệ trạng thái hành vi
            </h4>
            
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {totalStatus > 0 ? (
                  pieSegments.map((seg, idx) => (
                    seg.percentage > 0 && (
                      <path
                        key={idx}
                        d={seg.d}
                        fill={seg.color}
                        className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                      >
                        <title>{`${seg.name}: ${seg.percentage.toFixed(1)}%`}</title>
                      </path>
                    )
                  ))
                ) : (
                  <circle cx="100" cy="100" r="80" fill="#334155" />
                )}
                {/* Inner cutout for donut chart effect */}
                <circle cx="100" cy="100" r="45" fill="#0b0f19" />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{total}</span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Ghi nhận</span>
              </div>
            </div>

            {/* Legends */}
            <div className="grid grid-cols-3 gap-2 w-full mt-4 text-[10px]">
              {pieSegments.map((seg, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: seg.color }} />
                    <span className="font-semibold text-slate-300">{seg.name}</span>
                  </div>
                  <span className="text-slate-400 font-mono mt-0.5">{seg.count} ({seg.percentage.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: SVG Bar Chart & Top actions (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <div>
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-3">
                Các sự kiện/lỗi xảy ra nhiều nhất
              </h4>
              <div className="space-y-3">
                {topActions.map(([action, count], idx) => {
                  const percent = total > 0 ? (count / total) * 100 : 0;
                  const isWarning = action.toLowerCase().includes("lỗi") || action.toLowerCase().includes("chập") || action.toLowerCase().includes("rút") || action.toLowerCase().includes("tắt nguồn");
                  return (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between font-medium text-slate-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          {isWarning ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {action}
                        </span>
                        <span className="font-mono text-slate-400 font-bold">{count} lần</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isWarning ? "bg-gradient-to-r from-rose-500 to-orange-400" : "bg-gradient-to-r from-emerald-500 to-indigo-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Education Card for teachers */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-900/30 flex gap-3 text-xs">
              <span className="text-2xl animate-pulse">💡</span>
              <div>
                <strong className="text-indigo-300 block mb-0.5">Gợi ý giảng dạy cho thầy cô:</strong>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Nếu tỷ lệ <span className="text-rose-400 font-bold">Cảnh báo lỗi</span> cao, hãy nhắc nhở học sinh chú ý hơn đến quy tắc **Tay khô khi cắm điện** và quy trình **Tắt máy qua Start Menu**, tránh ấn nút nguồn vật lý đột ngột.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
