@echo off
cd /d "%~dp0"
chcp 65001 >nul
title 水质健康物联网云平台 V1.0 - 启动器
echo ================================================
echo   家庭水质健康物联网云平台软件 V1.0
echo ================================================
echo.
echo 正在启动云平台服务，浏览器会自动打开管理控制台...
echo.
echo 使用说明：
echo   1. 首次运行会自动安装依赖（需要联网，约 1-2 分钟）。
echo   2. 会弹出一个名为"水质健康云平台-服务器"的黑色窗口，
echo      请保留它，不要关闭（关掉它云平台就打不开了）。
echo   3. 用完想停止时，关闭那个服务器窗口即可。
echo.
echo ----------------------------------------------------

set PORT=8090

rem 检测 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [出错了] 你的电脑上没有检测到 Node.js。
    echo 请先安装 Node.js（LTS 版本）：
    echo   https://nodejs.org/
    echo.
    pause
    exit /b 1
)

rem 首次运行安装依赖
if not exist node_modules (
    echo 首次运行，正在安装依赖（需要联网）...
    call npm install
)

echo 启动云平台服务中...
start "水质健康云平台-服务器" cmd /k "node server/index.js"

rem 等服务器就绪后打开浏览器
timeout /t 3 /nobreak >nul
start "" http://localhost:%PORT%
echo 管理控制台已打开。如果页面还没显示出来，稍等几秒后刷新一下即可。
echo.
pause
