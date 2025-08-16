'use client';

import { useState } from 'react';
import { Upload, Download, Shield, Zap, Lock, Users, Wifi, Eye, Settings, TestTube } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import FileDownloader from '../components/FileDownloader';
import FilePreviewTester from '../components/FilePreviewTester';
import ThemeToggle from '../components/ThemeToggle';
import P2PAnimation from '../components/P2PAnimation';
import ZapDropLogo from '../components/ZapDropLogo';
import NetworkDiagnostics from '../components/NetworkDiagnostics';
import ResponsiveTest from '../components/ResponsiveTest';
import ComprehensiveFileTransferTester from '../components/ComprehensiveFileTransferTester';
import RealWorldFileTransferTester from '../components/RealWorldFileTransferTester';

export default function Home() {
  const [mode, setMode] = useState<'upload' | 'download' | 'home' | 'test' | 'preview'>('home');
  const [shareId, setShareId] = useState<string>('');
  const [showNetworkDiagnostics, setShowNetworkDiagnostics] = useState(false);
  const [showResponsiveTest, setShowResponsiveTest] = useState(false);
  const [transferState, setTransferState] = useState({
    isConnected: false,
    isTransferring: false,
    transferProgress: 0,
    connectionCount: 0,
    transferStatus: 'idle' as 'idle' | 'connecting' | 'transferring' | 'complete' | 'error',
    errorMessage: ''
  });

  const handleStartUpload = () => {
    setMode('upload');
  };

  const handleStartDownload = () => {
    setMode('download');
  };

  const handleBackToHome = () => {
    setMode('home');
    setShareId('');
  };

  const handleStartTester = () => {
    setMode('test');
  };

  const handleStartPreviewDemo = () => {
    setMode('preview');
  };

  if (mode === 'preview') {
    return <FilePreviewTester />;
  }

  if (mode === 'test') {
    return <RealWorldFileTransferTester onBack={handleBackToHome} />;
  }

  if (mode === 'upload') {
    return <FileUploader onBack={handleBackToHome} onTransferStateChange={setTransferState} />;
  }

  if (mode === 'download') {
    return <FileDownloader shareId={shareId} onBack={handleBackToHome} onTransferStateChange={setTransferState} />;
  }

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="relative z-10 p-4 sm:p-6 safe-area-insets">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <ZapDropLogo size={48} variant="default" theme="auto" />
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowResponsiveTest(true)}
              className="touch-target p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg"
              title="Responsive Design Test"
              aria-label="Open Responsive Design Test"
            >
              <TestTube className="w-5 h-5" />
            </button>
            <button
              onClick={handleStartTester}
              className="touch-target p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg"
              title="File Transfer Tester"
              aria-label="Open File Transfer Tester"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              onClick={handleStartPreviewDemo}
              className="touch-target p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg"
              title="File Preview Demo"
              aria-label="Open File Preview Demo"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNetworkDiagnostics(true)}
              className="touch-target p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg"
              title="Network Diagnostics"
              aria-label="Open Network Diagnostics"
            >
              <Settings className="w-5 h-5" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Network Diagnostics Modal */}
      <NetworkDiagnostics 
        isOpen={showNetworkDiagnostics} 
        onClose={() => setShowNetworkDiagnostics(false)} 
      />

      {/* Responsive Test Modal */}
      <ResponsiveTest 
        isOpen={showResponsiveTest} 
        onClose={() => setShowResponsiveTest(false)} 
      />

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-4 sm:px-6 pb-20 safe-area-insets">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-slide-in">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-space-grotesk font-bold mb-4 sm:mb-6 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  Share Files
                </span>
                <br />
                <span className="text-gray-800 dark:text-white">
                  Instantly
                </span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl font-inter text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed font-normal px-4">
                Send files directly between browsers with 
                <span className="font-semibold text-blue-600 dark:text-blue-400"> zero servers</span>, 
                <span className="font-semibold text-purple-600 dark:text-purple-400"> maximum privacy</span>, and 
                <span className="font-semibold text-teal-600 dark:text-teal-400"> lightning speed</span>.
              </p>
            </div>

            {/* P2P Animation */}
            <P2PAnimation 
              isConnected={transferState.isConnected}
              isTransferring={transferState.isTransferring}
              transferProgress={transferState.transferProgress}
              connectionCount={transferState.connectionCount}
              transferStatus={transferState.transferStatus}
              errorMessage={transferState.errorMessage}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8 sm:mb-12 lg:mb-16 px-4">
              <button
                onClick={handleStartUpload}
                className="group relative overflow-hidden mobile-friendly-button px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-space-grotesk font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl tracking-tight"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:animate-bounce" />
                  Share Files
                </div>
              </button>
              
              <button
                onClick={handleStartDownload}
                className="group relative overflow-hidden mobile-friendly-button px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white rounded-2xl font-space-grotesk font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl tracking-tight"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center">
                  <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:animate-bounce" />
                  Receive Files
                </div>
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12 lg:mb-16 px-4">
            {[
              {
                icon: Shield,
                title: 'Private & Secure',
                description: 'Files transfer directly between browsers with end-to-end encryption. Nothing stored on servers.',
                color: 'from-green-500 to-emerald-600',
                bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'No upload delays or download queues. Start sharing instantly with peer-to-peer connections.',
                color: 'from-yellow-500 to-orange-600',
                bgColor: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
              },
              {
                icon: Lock,
                title: 'Password Protected',
                description: 'Add optional password protection for sensitive files and confidential documents.',
                color: 'from-purple-500 to-pink-600',
                bgColor: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`group p-6 sm:p-8 rounded-2xl bg-gradient-to-br ${feature.bgColor} border border-white/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl`}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:animate-float shadow-lg`}>
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-space-grotesk font-bold text-gray-800 dark:text-white mb-3 sm:mb-4 text-center tracking-tight">{feature.title}</h3>
                <p className="font-inter text-gray-600 dark:text-gray-300 text-center leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-white/20 p-6 sm:p-8 mb-8 sm:mb-12 lg:mb-16 glass-effect mx-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
              {[
                { label: 'Files Shared', value: '∞', icon: Upload, color: 'text-blue-600' },
                { label: 'Privacy Level', value: '100%', icon: Eye, color: 'text-green-600' },
                { label: 'Server Storage', value: '0 MB', icon: Shield, color: 'text-purple-600' },
                { label: 'Connection Speed', value: 'Direct', icon: Wifi, color: 'text-teal-600' }
              ].map((stat, index) => (
                <div key={index} className="group">
                  <div className={`inline-flex p-2 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-space-grotesk font-bold text-gray-800 dark:text-white mb-1 tracking-tight">{stat.value}</div>
                  <div className="text-xs sm:text-sm font-inter text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Download Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl border border-white/20 p-6 sm:p-8 text-center backdrop-blur-sm mx-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-space-grotesk font-bold text-gray-800 dark:text-white mb-3 sm:mb-4 tracking-tight">
                Have a Share Link?
              </h3>
              <p className="font-inter text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Enter the share ID or paste the complete link to connect and download files
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="text"
                  value={shareId}
                  onChange={(e) => setShareId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && shareId.trim()) {
                      handleStartDownload();
                    }
                  }}
                  placeholder="Enter share ID or paste link"
                  className="flex-1 px-6 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm text-center sm:text-left font-inter transition-colors duration-200"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Enter share ID or paste share link"
                />
                <button
                  onClick={handleStartDownload}
                  disabled={!shareId.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-space-grotesk font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg tracking-tight disabled:cursor-not-allowed"
                  aria-label="Connect to share"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center space-x-8 mb-6">
            {[
              { icon: Shield, label: 'Encrypted' },
              { icon: Zap, label: 'Fast' },
              { icon: Users, label: 'P2P' },
              { icon: Lock, label: 'Private' }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-inter font-medium">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-6"></div>
          
          {/* Creator Bio */}
          <div className="space-y-3">
            <p className="font-inter text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Built with WebRTC</span> • 
              <span className="mx-2">Free & Open Source</span> • 
              <span className="font-semibold">Zero Server Storage</span>
            </p>
            
            <p className="font-inter text-gray-700 dark:text-gray-300 flex items-center justify-center space-x-2 flex-wrap">
              <span>Built with ⚡ by</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Rajdeep Singh Kushwaha</span>
              <span className="text-gray-400">•</span>
              <a 
                href="https://github.com/RajdeepKushwaha5/ZapDrop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                aria-label="Visit GitHub profile"
                title="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                </svg>
              </a>
              <span className="text-gray-400">•</span>
              <a 
                href="https://x.com/rajdeeptwts" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                aria-label="Visit X (Twitter) profile"
                title="X (Twitter)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/10 via-transparent to-purple-400/10 animate-spin-slow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-teal-400/10 via-transparent to-blue-400/10 animate-spin-slow reverse-spin"></div>
      </div>
    </div>
  );
}


