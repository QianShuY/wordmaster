@echo off
chcp 65001 >nul
"%~dp0runtime\node.exe" "%~dp0scripts\export-mobile-transfer.js"
if errorlevel 1 echo Export failed. Original learning data was not changed.
pause
