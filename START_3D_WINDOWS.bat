@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Starting Robo Adventure 3D server...
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8765"
  py -m http.server 8765
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    start "" "http://localhost:8765"
    python -m http.server 8765
  ) else (
    echo Python not found. Install Python, or publish the files to HTTPS hosting.
    pause
  )
)
