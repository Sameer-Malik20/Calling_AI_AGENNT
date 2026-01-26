# Start System Script

Write-Host "Starting AI Outbound Cold Calling System..." -ForegroundColor Cyan

# 1. Start Docker (LiveKit + Redis)
Write-Host "Starting LiveKit and Redis..." -ForegroundColor Yellow
cd livekit
docker-compose up -d
cd ..

# 2. Start Backend
Write-Host "Starting Backend..." -ForegroundColor Yellow
cd backend
Start-Process npm run dev -NoNewWindow
cd ..

# 3. Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
cd frontend
Start-Process npm run dev -NoNewWindow
cd ..

Write-Host "System is starting up!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend: http://localhost:5000"
Write-Host "ARI: http://localhost:8088"
