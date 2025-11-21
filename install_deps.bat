@echo off
echo Installing frontend dependencies...
call npm install

echo Installing backend dependencies...
cd server
call npm install
cd ..

echo All dependencies installed.
pause
