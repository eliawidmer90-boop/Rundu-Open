@echo off
rem Use the project folder even when this file is opened from File Explorer.
cd /d "%~dp0"
rem A portable Node runtime was downloaded for the initial checks.
rem Prefer an installed Node; fall back to that portable copy if needed.
where node >nul 2>nul
if errorlevel 1 if exist "%TEMP%\rundu-node-runtime\node-v22.23.4-win-x64\node.exe" set "PATH=%TEMP%\rundu-node-runtime\node-v22.23.4-win-x64;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js LTS from https://nodejs.org and try again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Run npm install in this folder first. See README.md.
  pause
  exit /b 1
)
echo Open http://localhost:3000 after the server says Ready.
call npm.cmd run dev
