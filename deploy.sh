#!/bin/bash
# ZapDrop Quick Deploy Script

echo "🚀 Deploying ZapDrop..."

if [ "$1" = "vercel" ]; then
  echo "🌐 Building for Vercel..."
  npm run build
  echo "📤 Deploying to Vercel..."
  npx vercel --prod
elif [ "$1" = "netlify" ]; then
  echo "🌐 Building for Netlify..."
  npm run build
  echo "📤 Deploying to Netlify..."
  npx netlify deploy --prod --dir=out
elif [ "$1" = "build" ]; then
  echo "📦 Building application..."
  npm run build
  echo "✅ Build complete! Ready for deployment."
else
  echo "Usage:"
  echo "  ./deploy.sh build    - Build only"
  echo "  ./deploy.sh vercel   - Deploy to Vercel"
  echo "  ./deploy.sh netlify  - Deploy to Netlify"
fi
