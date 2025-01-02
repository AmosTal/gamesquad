@echo off
call "%~dp0stop.bat"
start cmd /k "cd /d %~dp0 && npm run dev"
