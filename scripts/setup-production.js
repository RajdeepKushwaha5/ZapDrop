#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * Configures ZapDrop for production deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupProduction() {
  console.log('\n🚀 ZapDrop Production Setup\n');
  console.log('This script will configure your production environment.\n');

  // Get user inputs
  const configs = {};

  console.log('📡 TURN Server Configuration (for firewall bypass):');
  const useTurn = await question('Do you want to configure TURN servers? (y/N): ');

  if (useTurn.toLowerCase() === 'y') {
    console.log('\n💡 Recommended: Metered.ca (offers free tier)');
    console.log('   1. Sign up at https://www.metered.ca/');
    console.log('   2. Create a new app');
    console.log('   3. Get your credentials\n');

    configs.NEXT_PUBLIC_TURN_SERVER = await question('TURN Server URL (e.g., turn:relay.metered.ca:80): ') || 'turn:relay.metered.ca:80';
    configs.NEXT_PUBLIC_TURN_USERNAME = await question('TURN Username: ');
    configs.NEXT_PUBLIC_TURN_PASSWORD = await question('TURN Password: ');
  }

  console.log('\n📊 Optional Configuration:');
  configs.NEXT_PUBLIC_GA_TRACKING_ID = await question('Google Analytics Tracking ID (optional): ');
  configs.NEXT_PUBLIC_SENTRY_DSN = await question('Sentry DSN for error monitoring (optional): ');

  // Generate production .env file
  const productionEnv = `# ZapDrop Production Configuration
# Generated on ${new Date().toISOString()}

NODE_ENV=production

# WebRTC Configuration
NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
${configs.NEXT_PUBLIC_TURN_SERVER ? `NEXT_PUBLIC_TURN_SERVER=${configs.NEXT_PUBLIC_TURN_SERVER}` : '# NEXT_PUBLIC_TURN_SERVER=turn:relay.metered.ca:80'}
${configs.NEXT_PUBLIC_TURN_USERNAME ? `NEXT_PUBLIC_TURN_USERNAME=${configs.NEXT_PUBLIC_TURN_USERNAME}` : '# NEXT_PUBLIC_TURN_USERNAME=your-username'}
${configs.NEXT_PUBLIC_TURN_PASSWORD ? `NEXT_PUBLIC_TURN_PASSWORD=${configs.NEXT_PUBLIC_TURN_PASSWORD}` : '# NEXT_PUBLIC_TURN_PASSWORD=your-password'}

# PeerJS Configuration
NEXT_PUBLIC_PEERJS_HOST=0.peerjs.com
NEXT_PUBLIC_PEERJS_PORT=443
NEXT_PUBLIC_PEERJS_PATH=/
NEXT_PUBLIC_PEERJS_SECURE=true

# Application Configuration
NEXT_PUBLIC_APP_NAME=ZapDrop
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_MAX_FILE_SIZE=107374182400
NEXT_PUBLIC_CHUNK_SIZE=1048576

# Analytics & Monitoring
${configs.NEXT_PUBLIC_GA_TRACKING_ID ? `NEXT_PUBLIC_GA_TRACKING_ID=${configs.NEXT_PUBLIC_GA_TRACKING_ID}` : '# NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX'}
${configs.NEXT_PUBLIC_SENTRY_DSN ? `NEXT_PUBLIC_SENTRY_DSN=${configs.NEXT_PUBLIC_SENTRY_DSN}` : '# NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn'}
`;

  // Write production environment file
  fs.writeFileSync('.env.production', productionEnv);
  console.log('\n✅ Production environment file created: .env.production');

  // Generate deployment scripts
  const deploymentScript = `#!/bin/bash
# ZapDrop Deployment Script

echo "🚀 Deploying ZapDrop to production..."

# Build the application
echo "📦 Building application..."
npm run build

# Deploy based on platform
if [ "$1" = "vercel" ]; then
  echo "🌐 Deploying to Vercel..."
  npx vercel --prod
elif [ "$1" = "netlify" ]; then
  echo "🌐 Deploying to Netlify..."
  npx netlify deploy --prod --dir=out
else
  echo "Usage: ./deploy.sh [vercel|netlify]"
  exit 1
fi

echo "✅ Deployment complete!"
`;

  fs.writeFileSync('deploy.sh', deploymentScript);
  fs.chmodSync('deploy.sh', '755');
  console.log('✅ Deployment script created: deploy.sh');

  // Generate Vercel configuration
  const vercelConfig = {
    "name": "zapdrop",
    "version": 2,
    "builds": [
      {
        "src": "package.json",
        "use": "@vercel/next"
      }
    ],
    "env": {
      "NODE_ENV": "production"
    },
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "Cross-Origin-Embedder-Policy",
            "value": "require-corp"
          },
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin"
          }
        ]
      }
    ]
  };

  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  console.log('✅ Vercel configuration created: vercel.json');

  // Update next.config.js for static export
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  experimental: {
    esmExternals: false,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
`;

  fs.writeFileSync('next.config.js', nextConfig);
  console.log('✅ Next.js configuration updated for static export');

  console.log('\n🎉 Production setup complete!');
  console.log('\nNext steps:');
  console.log('1. Test your configuration: npm run build');
  console.log('2. Deploy to Vercel: ./deploy.sh vercel');
  console.log('3. Deploy to Netlify: ./deploy.sh netlify');
  console.log('\n💡 For free hosting options, see DEPLOYMENT.md');

  rl.close();
}

if (require.main === module) {
  setupProduction().catch(console.error);
}

module.exports = { setupProduction };
