# ZapDrop - Free Peer-to-Peer File Transfer

**Zap it. Drop it. Share it.**

A modern, secure, and completely free peer-to-peer file sharing application built with Next.js and WebRTC. Share files directly between browsers with no servers involved - ensuring complete privacy and security.

![ZapDrop Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=ZapDrop+P2P+File+Transfer)

## ✨ Features

- **🔒 100% Private & Secure** - Files transfer directly between browsers, never touching our servers
- **⚡ Lightning Fast** - No upload delays, start sharing immediately with P2P connections
- **🔐 Password Protection** - Optional password security for sensitive files
- **📱 Mobile Friendly** - Works seamlessly on all devices including mobile browsers
- **🎨 Modern UI** - Beautiful interface with dark mode support
- **📦 Multiple Files** - Upload and share multiple files at once (auto-zipped for download)
- **📊 Real-time Progress** - Monitor transfer progress for both uploaders and downloaders
- **⏸️ Pause & Resume** - Download interruptions can be resumed from where they left off
- **🌐 Universal Access** - Works in any modern browser without installations

## 🆓 Completely Free Deployment

This application can be deployed and run **completely free forever** using these platforms:

### Free Hosting Options:
- **Frontend**: Vercel (unlimited deployments)
- **Alternative**: Netlify (100GB bandwidth/month)
- **Alternative**: GitHub Pages (static hosting)
- **STUN Servers**: Google's free STUN servers (included)
- **Domain**: Your custom domain or free subdomain

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone https://github.com/RajdeepKushwaha5/ZapDrop.git
cd zapdrop-app

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Environment Variables

Create a `.env.local` file in the root directory (optional):

```bash
# Optional: Custom STUN/TURN servers
CUSTOM_STUN_SERVER=stun:your-stun-server.com:19302
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_SERVER_USERNAME=your-username
TURN_SERVER_CREDENTIAL=your-password

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## 📦 Free Deployment Options

### 1. Vercel (Recommended - FREE Forever)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RajdeepKushwaha5/ZapDrop)

1. Fork this repository
2. Connect your GitHub account to Vercel
3. Import the project
4. Deploy (takes ~2 minutes)
5. Get your free `.vercel.app` domain or add your custom domain

**Cost: $0/month forever** ✅

### 2. Netlify (FREE Forever)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/RajdeepKushwaha5/ZapDrop)

1. Fork this repository
2. Connect to Netlify
3. Build settings: `npm run build` and `out` folder
4. Deploy automatically

**Cost: $0/month forever** ✅

### 3. GitHub Pages (Static Only)

```bash
# Build static version
npm run build
npm run export

# Deploy to GitHub Pages
# (Upload the 'out' folder content)
```

**Cost: $0/month forever** ✅

## 🏗️ Architecture

```
┌─────────────────┐    WebRTC P2P     ┌─────────────────┐
│   Uploader      │◄─────────────────►│   Downloader    │
│   Browser       │                   │   Browser       │
└─────────────────┘                   └─────────────────┘
        │                                       │
        │ HTTPS API (ICE servers only)          │
        ▼                                       ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Server (FREE)                      │
│           - ICE server configuration                    │
│           - No file storage                            │
│           - No user data                               │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **WebRTC**: PeerJS (simplified WebRTC)
- **File Handling**: Web APIs (File API, Blob, ArrayBuffer)
- **Streaming**: Service Workers for download streaming
- **State**: React hooks and context
- **Icons**: Lucide React

## 🛡️ Security Features

- **End-to-End Encryption**: All data encrypted via WebRTC/DTLS
- **No Server Storage**: Files never touch our servers
- **Password Protection**: Optional AES-256 password protection
- **No Tracking**: No user data collected or stored
- **Content Security Policy**: XSS protection
- **HTTPS Only**: Secure connections required

## 📱 Browser Support

| Browser | Support | Features |
|---------|---------|----------|
| Chrome 60+ | ✅ Full | All features |
| Firefox 55+ | ✅ Full | All features |
| Safari 12+ | ✅ Full | All features |
| Edge 79+ | ✅ Full | All features |
| Mobile Chrome | ✅ Full | All features |
| Mobile Safari | ✅ Full | All features |

## 🔧 Advanced Configuration

### Custom STUN/TURN Servers

For better connectivity behind NATs, you can configure custom servers:

```javascript
// src/hooks/usePeer.ts
const customIceServers = [
  { urls: 'stun:your-stun-server.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'your-username',
    credential: 'your-password'
  }
];
```

### Free TURN Server Options:
1. **Metered.ca** - 50GB/month free
2. **Twilio** - Free tier available
3. **Self-hosted COTURN** - Free on your VPS

## 📊 Performance & Limits

| Metric | Limit | Notes |
|--------|--------|-------|
| File Size | Browser memory | Typically 1-4GB per file |
| Concurrent Downloads | Unlimited | P2P scales naturally |
| Transfer Speed | Network limited | Direct P2P connection |
| Storage Cost | $0 | No server storage |
| Bandwidth Cost | $0 | P2P transfer |

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [FilePizza](https://file.pizza) by Alex Kern & Neeraj Baid
- Built with love for the open-source community
- Uses free STUN servers provided by Google and others

## 🆘 Support & FAQ

### Common Issues

**Q: Files not transferring?**
A: Check if both users have the tab open and active. WebRTC requires active connections.

**Q: Connection failed behind corporate firewall?**
A: Use TURN servers for better NAT traversal.

**Q: Large files failing?**
A: Browser memory limits apply. Try smaller files or enable streaming downloads.

**Q: Mobile not working?**
A: Ensure HTTPS is enabled. WebRTC requires secure contexts.

### Need Help?

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/RajdeepKushwaha5/ZapDrop/issues)
- 💬 [Discussions](https://github.com/RajdeepKushwaha5/ZapDrop/discussions)

---

**Made with ❤️ for a free and open internet**

Deploy your own instance today and enjoy unlimited, private file sharing forever - completely free!
