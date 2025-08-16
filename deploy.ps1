# ZapDrop Windows Deploy Script
param(
  [string]$Target = "help"
)

Write-Host "🚀 ZapDrop Deployment Script" -ForegroundColor Blue
Write-Host ""

switch ($Target.ToLower()) {
  "build" {
    Write-Host "📦 Building application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
      Write-Host "✅ Build complete! Ready for deployment." -ForegroundColor Green
    }
    else {
      Write-Host "❌ Build failed!" -ForegroundColor Red
      exit 1
    }
  }
  "vercel" {
    Write-Host "🌐 Building for Vercel..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
      Write-Host "📤 Deploying to Vercel..." -ForegroundColor Yellow
      npx vercel --prod
    }
    else {
      Write-Host "❌ Build failed!" -ForegroundColor Red
      exit 1
    }
  }
  "netlify" {
    Write-Host "🌐 Building for Netlify..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
      Write-Host "📤 Deploying to Netlify..." -ForegroundColor Yellow
      npx netlify deploy --prod --dir=out
    }
    else {
      Write-Host "❌ Build failed!" -ForegroundColor Red
      exit 1
    }
  }
  default {
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1 build    - Build only" -ForegroundColor White
    Write-Host "  .\deploy.ps1 vercel   - Deploy to Vercel" -ForegroundColor White
    Write-Host "  .\deploy.ps1 netlify  - Deploy to Netlify" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1 build" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1 vercel" -ForegroundColor Gray
  }
}
