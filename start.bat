@echo off
chcp 65001 >nul
title 水质健康 · 作品集启动器
echo ================================================
echo   水质健康 · 作品集（含可交互 Demo）
echo ================================================
echo.
echo 正在启动本地服务器并打开浏览器...
echo 请保留弹出的黑色服务器窗口，不要关闭它。
echo.

set PORT=8080

rem 优先探测 Microsoft Store 版真实 Python（绕过 0 字节的"应用执行别名"存根）
set "REALPY="
for /d %%D in ("%LOCALAPPDATA%\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.*") do if exist "%%D\python.exe" set "REALPY=%%D\python.exe"
if defined REALPY (
    echo 已检测到 Python，启动服务中...
    start "作品集-服务器" cmd /k "%REALPY% -m http.server %PORT%"
    goto :open
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo 已检测到 Python，启动服务中...
    start "作品集-服务器" cmd /k "python -m http.server %PORT%"
    goto :open
)

where py >nul 2>nul
if %errorlevel%==0 (
    start "作品集-服务器" cmd /k "py -m http.server %PORT%"
    goto :open
)

where npx >nul 2>nul
if %errorlevel%==0 (
    echo 已检测到 Node.js，启动服务中...
    start "作品集-服务器" cmd /k "npx --yes http-server -p %PORT%"
    goto :open
)

echo [出错] 未检测到 Python 或 Node.js。
echo 请先安装 Python：https://www.python.org/downloads/
echo.
pause
exit /b 1

:open
timeout /t 2 /nobreak >nul
start "" http://localhost:%PORT%/
echo 浏览器已打开作品集首页（含 Demo）。
echo.
pause
