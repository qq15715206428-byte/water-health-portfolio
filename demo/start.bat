@echo off
chcp 65001 >nul
title 水质健康管家 V1.0 - 启动器
echo ================================================
echo   家庭水质健康智能管理移动应用软件 V1.0
echo ================================================
echo.
echo 正在为你启动本地服务器，浏览器会自动打开...
echo.
echo 使用说明：
echo   1. 浏览器会自动打开软件页面，无需其他操作。
echo   2. 会弹出一个名为"水质健康管家-服务器"的黑色窗口，
echo      请保留它，不要关闭（关掉它软件就打不开了）。
echo   3. 用完想停止时，关闭那个服务器窗口即可。
echo.
echo ----------------------------------------------------

set PORT=8080

rem 优先探测 Microsoft Store 版真实 Python（绕过 0 字节的"应用执行别名"存根）
set "REALPY="
for /d %%D in ("%LOCALAPPDATA%\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.*") do if exist "%%D\python.exe" set "REALPY=%%D\python.exe"
if defined REALPY (
    echo 已检测到 Python，启动服务中...
    start "水质健康管家-服务器" cmd /k "%REALPY% -m http.server %PORT%"
    goto :open
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo 已检测到 Python，启动服务中...
    start "水质健康管家-服务器" cmd /k "python -m http.server %PORT%"
    goto :open
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo 已检测到 Python，启动服务中...
    start "水质健康管家-服务器" cmd /k "py -m http.server %PORT%"
    goto :open
)

where npx >nul 2>nul
if %errorlevel%==0 (
    echo 已检测到 Node.js，启动服务中...
    start "水质健康管家-服务器" cmd /k "npx --yes http-server -p %PORT%"
    goto :open
)

echo [出错了] 你的电脑上没有检测到 Python 或 Node.js。
echo 请先安装 Python（安装时勾选 Add Python to PATH）：
echo   https://www.python.org/downloads/
echo.
pause
exit /b 1

:open
timeout /t 2 /nobreak >nul
start "" http://localhost:%PORT%
echo 浏览器已打开。如果页面还没显示出来，稍等几秒后刷新一下即可。
echo.
pause
