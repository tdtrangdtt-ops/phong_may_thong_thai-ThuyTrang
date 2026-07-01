@echo off
:: Chuyển mã nguồn sang UTF-8 để hiển thị tiếng Việt có dấu trong CMD
chcp 65001 >nul
title TRỢ LÝ ẢO PHÒNG MÁY THÔNG THÁI - KHỞI ĐỘNG

echo ==============================================================
echo        ĐANG KHỞI ĐỘNG TRỢ LÝ ẢO PHÒNG MÁY THÔNG THÁI
echo ==============================================================
echo.

:: 1. Kiểm tra Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LỖI] Không tìm thấy Node.js trên máy tính này!
    echo.
    echo Để chạy phần mềm, bạn cần cài đặt Node.js:
    echo 1. Tải bộ cài đặt cho Windows tại: https://nodejs.org/
    echo 2. Chọn phiên bản LTS (khuyên dùng) và cài đặt với các lựa chọn mặc định.
    echo 3. Sau khi cài đặt xong, hãy mở lại file này.
    echo.
    pause
    exit /b
)

:: 2. Kiểm tra thư mục node_modules, nếu chưa có thì chạy npm install
if not exist "node_modules\" (
    echo [THÔNG BÁO] Chưa tìm thấy các thư viện cần thiết.
    echo Đang tự động cài đặt thư viện (chỉ thực hiện lần đầu, cần kết nối internet)...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [LỖI] Quá trình cài đặt thư viện thất bại! Vui lòng kiểm tra lại kết nối mạng.
        pause
        exit /b
    )
    echo Cài đặt thư viện hoàn tất!
    echo.
)

:: 3. Lấy danh sách địa chỉ IP trong mạng nội bộ (LAN)
echo [THÔNG TIN] Danh sách địa chỉ IP của máy bạn:
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /i "IPv4"') do (
    echo   - http:%%A:3000
)
echo.
echo ==============================================================
echo [HƯỚNG DẪN CHIA SẺ]
echo - Để chạy trên máy tính này: Mở trình duyệt web và truy cập: http://localhost:3000
echo - Để chia sẻ cho đồng nghiệp: Đồng nghiệp của bạn chỉ cần kết nối chung mạng
echo   Wi-Fi hoặc mạng dây (LAN) với máy bạn, sau đó truy cập vào một trong các địa chỉ
echo   IP mạng nội bộ được hiển thị ở trên (Ví dụ: http://192.168.1.X:3000)
echo ==============================================================
echo.
echo Hệ thống đang khởi chạy server... Hãy giữ nguyên cửa sổ này để duy trì hoạt động.
echo.

:: Tự động mở trình duyệt web tới localhost
start "" "http://localhost:3000"

:: Khởi chạy ứng dụng bằng npm.cmd run dev
call npm.cmd run dev

pause
