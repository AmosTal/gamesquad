@echo off
call "%~dp0stop.bat" 2>nul
start cmd /k "cd /d %~dp0 && npm run dev"
