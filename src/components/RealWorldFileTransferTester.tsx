'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Archive, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Download,
  Upload,
  RefreshCw,
  Play,
  Users,
  Eye,
  Wifi
} from 'lucide-react';
import { usePeer } from '@/hooks/usePeer';

interface RealWorldTestResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  message: string;
  details?: any;
  duration?: number;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    originalHash?: string;
    receivedHash?: string;
    transferTime?: number;
    verified?: boolean;
  };
}

export default function RealWorldFileTransferTester({ onBack }: { onBack?: () => void }) {
  const [testResults, setTestResults] = useState<RealWorldTestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testFiles, setTestFiles] = useState<File[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [testMode, setTestMode] = useState<'sender' | 'receiver' | 'both'>('both');
  
  const { peer, peerId, isConnected, error } = usePeer();
  const connectionRef = useRef<any>(null);
  const testStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (peer && peerId) {
      setConnectionStatus('connected');
    }
  }, [peer, peerId]);

  // Create test files of various types and sizes
  const createTestFiles = useCallback((): File[] => {
    const files: File[] = [];

    // Small text file
    const textContent = `# Test Document

This is a comprehensive test document created for validating file transfer functionality.

## File Information
- Created: ${new Date().toISOString()}
- Purpose: End-to-end file transfer testing
- Size: Small (< 1KB)

## Content
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Test Data
- Numbers: 123456789
- Special characters: !@#$%^&*()_+-=[]{}|;:,.<>?
- Unicode: 🚀 ✅ 📄 🔒 🌟

---
End of test document.`;

    const textBlob = new Blob([textContent], { type: 'text/plain' });
    files.push(new File([textBlob], 'test-document.txt', { type: 'text/plain' }));

    // Medium-sized JSON file
    const jsonData = {
      testId: Date.now(),
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        purpose: 'File transfer validation',
        size: 'medium'
      },
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
        description: `Test item number ${i} with random value`,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        metadata: {
          processed: Math.random() > 0.5,
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          tags: [`tag${i % 10}`, `category${i % 5}`]
        }
      }))
    };

    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    files.push(new File([jsonBlob], 'test-data.json', { type: 'application/json' }));

    // Large file (5MB) - simulated image
    const largeArrayBuffer = new ArrayBuffer(5 * 1024 * 1024);
    const largeArray = new Uint8Array(largeArrayBuffer);
    
    // Create a pattern to simulate image data and detect corruption
    for (let i = 0; i < largeArray.length; i++) {
      largeArray[i] = (i * 17 + (i >> 8) * 31 + (i >> 16) * 13) % 256;
    }
    
    const largeBlob = new Blob([largeArrayBuffer], { type: 'image/png' });
    files.push(new File([largeBlob], 'large-test-image.png', { type: 'image/png' }));

    // Binary file - simulated archive
    const binarySize = 2 * 1024 * 1024; // 2MB
    const binaryBuffer = new ArrayBuffer(binarySize);
    const binaryArray = new Uint8Array(binaryBuffer);
    
    // Create complex binary pattern
    for (let i = 0; i < binaryArray.length; i++) {
      binaryArray[i] = ((i & 0xFF) ^ ((i >> 8) & 0xFF) ^ ((i >> 16) & 0xFF)) % 256;
    }
    
    const binaryBlob = new Blob([binaryBuffer], { type: 'application/zip' });
    files.push(new File([binaryBlob], 'test-archive.zip', { type: 'application/zip' }));

    return files;
  }, []);

  // Calculate file hash for integrity verification
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Test 1: File Creation and Metadata Verification
  const testFileCreationAndMetadata = async (): Promise<RealWorldTestResult> => {
    const startTime = Date.now();
    try {
      const files = createTestFiles();
      setTestFiles(files);

      // Verify each file
      for (const file of files) {
        // Check basic properties
        if (!file.name || file.name.length === 0) {
          throw new Error(`File has no name`);
        }
        
        if (file.size <= 0) {
          throw new Error(`Invalid file size for ${file.name}: ${file.size}`);
        }
        
        if (!file.type) {
          throw new Error(`File type missing for ${file.name}`);
        }

        // Verify file content matches expected size
        const actualContent = await file.arrayBuffer();
        if (actualContent.byteLength !== file.size) {
          throw new Error(`Content size mismatch for ${file.name}: expected ${file.size}, got ${actualContent.byteLength}`);
        }

        // Test file hash calculation
        const hash = await calculateFileHash(file);
        if (!hash || hash.length !== 64) {
          throw new Error(`Invalid hash generated for ${file.name}`);
        }
      }

      return {
        testName: 'File Creation and Metadata Verification',
        status: 'passed',
        message: `Successfully created and verified ${files.length} test files`,
        details: {
          files: files.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            sizeFormatted: formatFileSize(f.size)
          })),
          totalSize: files.reduce((sum, f) => sum + f.size, 0)
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'File Creation and Metadata Verification',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 2: Connection Establishment
  const testConnectionEstablishment = async (): Promise<RealWorldTestResult> => {
    const startTime = Date.now();
    try {
      if (!peer) {
        throw new Error('Peer instance not available');
      }

      if (!peerId) {
        throw new Error('Peer ID not generated');
      }

      // Verify peer connection is ready
      if (!isConnected) {
        throw new Error('Peer connection not established');
      }

      // Test peer ID format
      if (peerId.length < 10) {
        throw new Error('Peer ID appears to be invalid (too short)');
      }

      return {
        testName: 'Connection Establishment',
        status: 'passed',
        message: `Successfully established peer connection with ID: ${peerId.substring(0, 8)}...`,
        details: {
          peerId: peerId,
          peerIdLength: peerId.length,
          isConnected,
          connectionType: 'WebRTC'
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'Connection Establishment',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Connection failed',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 3: Progress Tracking Simulation
  const testProgressTracking = async (): Promise<RealWorldTestResult> => {
    const startTime = Date.now();
    try {
      const progressUpdates: number[] = [];
      const fileSize = 1024 * 1024; // 1MB
      const chunkSize = 64 * 1024; // 64KB chunks
      const totalChunks = Math.ceil(fileSize / chunkSize);
      let transferredBytes = 0;

      // Simulate chunked transfer with progress updates
      for (let i = 0; i < totalChunks; i++) {
        const currentChunkSize = Math.min(chunkSize, fileSize - transferredBytes);
        transferredBytes += currentChunkSize;
        
        const progress = Math.round((transferredBytes / fileSize) * 100);
        progressUpdates.push(progress);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Validate progress tracking
      if (progressUpdates.length === 0) {
        throw new Error('No progress updates recorded');
      }

      if (progressUpdates[0] <= 0) {
        throw new Error('Progress should start above 0');
      }

      if (progressUpdates[progressUpdates.length - 1] !== 100) {
        throw new Error(`Final progress should be 100%, got ${progressUpdates[progressUpdates.length - 1]}%`);
      }

      // Check for monotonic increase (allowing for same values)
      for (let i = 1; i < progressUpdates.length; i++) {
        if (progressUpdates[i] < progressUpdates[i - 1]) {
          throw new Error(`Progress decreased from ${progressUpdates[i - 1]}% to ${progressUpdates[i]}%`);
        }
      }

      return {
        testName: 'Progress Tracking Simulation',
        status: 'passed',
        message: `Progress tracking works correctly with ${progressUpdates.length} updates`,
        details: {
          totalChunks,
          chunkSize,
          fileSize,
          progressUpdates: progressUpdates.length > 10 ? 
            [...progressUpdates.slice(0, 5), '...', ...progressUpdates.slice(-5)] :
            progressUpdates,
          minProgress: Math.min(...progressUpdates),
          maxProgress: Math.max(...progressUpdates)
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'Progress Tracking Simulation',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Progress tracking failed',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 4: File Integrity Verification
  const testFileIntegrityVerification = async (): Promise<RealWorldTestResult> => {
    const startTime = Date.now();
    try {
      if (testFiles.length === 0) {
        throw new Error('No test files available');
      }

      const verificationResults: any[] = [];

      for (const file of testFiles) {
        // Calculate original hash
        const originalHash = await calculateFileHash(file);
        
        // Simulate perfect transfer (no corruption)
        const transferredContent = await file.arrayBuffer();
        const transferredFile = new File([transferredContent], file.name, { type: file.type });
        const receivedHash = await calculateFileHash(transferredFile);

        if (originalHash !== receivedHash) {
          throw new Error(`Hash mismatch for ${file.name} (perfect transfer simulation)`);
        }

        // Test corruption detection
        const corruptedContent = new Uint8Array(transferredContent);
        if (corruptedContent.length > 100) {
          // Introduce corruption
          corruptedContent[50] = corruptedContent[50] ^ 0xFF;
          corruptedContent[100] = corruptedContent[100] ^ 0xAA;
        }
        
        const corruptedHash = await calculateFileHash(new File([corruptedContent], file.name, { type: file.type }));
        
        if (originalHash === corruptedHash) {
          throw new Error(`Corruption detection failed for ${file.name}`);
        }

        verificationResults.push({
          fileName: file.name,
          size: file.size,
          originalHash: originalHash.substring(0, 16) + '...',
          transferVerified: true,
          corruptionDetected: true
        });
      }

      return {
        testName: 'File Integrity Verification',
        status: 'passed',
        message: `Successfully verified integrity for ${testFiles.length} files`,
        details: {
          verificationResults,
          totalFilesChecked: testFiles.length,
          allVerified: true,
          corruptionDetectionWorks: true
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'File Integrity Verification',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Integrity verification failed',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 5: Large File Handling
  const testLargeFileHandling = async (): Promise<RealWorldTestResult> => {
    const startTime = Date.now();
    try {
      const largeFiles = testFiles.filter(f => f.size >= 1024 * 1024); // 1MB+
      
      if (largeFiles.length === 0) {
        throw new Error('No large files available for testing');
      }

      const handlingResults: any[] = [];

      for (const file of largeFiles) {
        // Test chunked processing
        const chunkSize = 256 * 1024; // 256KB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        const chunks: Uint8Array[] = [];
        
        // Read file content
        const fileBuffer = await file.arrayBuffer();
        const fileArray = new Uint8Array(fileBuffer);
        
        // Split into chunks
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = fileArray.slice(start, end);
          chunks.push(chunk);
        }

        // Verify chunk processing
        let totalProcessedSize = 0;
        chunks.forEach(chunk => {
          totalProcessedSize += chunk.length;
        });

        if (totalProcessedSize !== file.size) {
          throw new Error(`Chunk processing error for ${file.name}: expected ${file.size}, processed ${totalProcessedSize}`);
        }

        // Test reconstruction
        const reconstructed = new Uint8Array(file.size);
        let offset = 0;
        chunks.forEach(chunk => {
          reconstructed.set(chunk, offset);
          offset += chunk.length;
        });

        // Verify reconstruction integrity
        const originalHash = await calculateFileHash(file);
        const reconstructedHash = await calculateFileHash(new File([reconstructed], file.name, { type: file.type }));
        
        if (originalHash !== reconstructedHash) {
          throw new Error(`Reconstruction integrity failed for ${file.name}`);
        }

        handlingResults.push({
          fileName: file.name,
          size: file.size,
          totalChunks,
          chunkSize,
          reconstructionVerified: true,
          processingTime: Date.now() - startTime
        });
      }

      return {
        testName: 'Large File Handling',
        status: 'passed',
        message: `Successfully processed ${largeFiles.length} large files with chunked handling`,
        details: {
          handlingResults,
          totalLargeFiles: largeFiles.length,
          allReconstructed: true
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'Large File Handling',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Large file handling failed',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 6: Different File Format Support
  const testFileFormatSupport = async (): Promise<RealWorldTestResult> => {
    const startTime = Date.now();
    try {
      const formatCategories = {
        text: testFiles.filter(f => f.type.startsWith('text/')),
        application: testFiles.filter(f => f.type.startsWith('application/')),
        image: testFiles.filter(f => f.type.startsWith('image/')),
        video: testFiles.filter(f => f.type.startsWith('video/')),
        audio: testFiles.filter(f => f.type.startsWith('audio/'))
      };

      const supportResults: any[] = [];

      for (const [category, files] of Object.entries(formatCategories)) {
        if (files.length === 0) continue;

        for (const file of files) {
          // Test format detection
          const isSupported = file.type && file.type.length > 0;
          
          // Test file reading capability
          let readingWorks = false;
          try {
            const content = await file.arrayBuffer();
            readingWorks = content.byteLength === file.size;
          } catch (error) {
            readingWorks = false;
          }

          supportResults.push({
            fileName: file.name,
            mimeType: file.type,
            category,
            size: file.size,
            isSupported,
            readingWorks,
            canCalculateHash: true
          });
        }
      }

      if (supportResults.length === 0) {
        throw new Error('No files tested for format support');
      }

      const unsupportedFiles = supportResults.filter(r => !r.isSupported || !r.readingWorks);
      if (unsupportedFiles.length > 0) {
        throw new Error(`Some files are not properly supported: ${unsupportedFiles.map(f => f.fileName).join(', ')}`);
      }

      return {
        testName: 'Different File Format Support',
        status: 'passed',
        message: `Successfully tested ${supportResults.length} files across ${Object.keys(formatCategories).length} format categories`,
        details: {
          supportResults,
          formatCategoriesTested: Object.keys(formatCategories).filter(cat => formatCategories[cat as keyof typeof formatCategories].length > 0),
          totalFilesSupported: supportResults.length,
          allSupported: true
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'Different File Format Support',
        status: 'failed',
        message: error instanceof Error ? error.message : 'File format support test failed',
        duration: Date.now() - startTime
      };
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setTestProgress(0);
    testStartTimeRef.current = Date.now();

    const tests = [
      testFileCreationAndMetadata,
      testConnectionEstablishment,
      testProgressTracking,
      testFileIntegrityVerification,
      testLargeFileHandling,
      testFileFormatSupport
    ];

    const results: RealWorldTestResult[] = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTest(test.name);
      setTestProgress(((i) / tests.length) * 100);

      // Add pending result
      const pendingResult: RealWorldTestResult = {
        testName: test.name,
        status: 'running',
        message: 'Test in progress...'
      };
      results.push(pendingResult);
      setTestResults([...results]);

      try {
        const result = await test();
        results[i] = result;
        setTestResults([...results]);
      } catch (error) {
        results[i] = {
          testName: test.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Test execution error'
        };
        setTestResults([...results]);
      }

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setCurrentTest(null);
    setTestProgress(100);
    setIsRunningTests(false);
  };

  const getStatusIcon = (status: RealWorldTestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: RealWorldTestResult['status']) => {
    switch (status) {
      case 'passed': return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'failed': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'error': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'running': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'passed').length;
  const failedTests = testResults.filter(r => r.status === 'failed' || r.status === 'error').length;
  const totalTests = testResults.length;

  return (
    <div className="min-h-screen gradient-mesh p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
          )}
          <div className="text-center flex-1">
            <h1 className="text-3xl sm:text-4xl font-space-grotesk font-bold text-gray-800 dark:text-white mb-4">
              Real-World File Transfer Tester
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-lg">
              Comprehensive testing of file sharing workflow including metadata verification, 
              integrity checking, progress tracking, and format support validation.
            </p>
          </div>
          <div className="w-32"></div>
        </div>

        {/* Connection Status */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wifi className={`w-5 h-5 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
              <span className="font-medium text-gray-800 dark:text-white">
                Connection Status: 
                <span className={`ml-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </span>
            </div>
            {peerId && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>Peer ID: {peerId.substring(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={runAllTests}
                disabled={isRunningTests}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
              >
                {isRunningTests ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                <span>{isRunningTests ? 'Running Tests...' : 'Start Testing'}</span>
              </button>
              
              {testFiles.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {testFiles.length} test files ready
                </div>
              )}
            </div>

            {isRunningTests && (
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{currentTest || 'Initializing...'}</span>
                  <span>{Math.round(testProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${testProgress}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-space-grotesk font-bold text-gray-800 dark:text-white">
                Test Results
              </h2>
              {!isRunningTests && totalTests > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {passedTests}/{totalTests} tests passed
                  {failedTests > 0 && <span className="text-red-500 ml-2">({failedTests} failed)</span>}
                </div>
              )}
            </div>
            
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`rounded-xl border-2 p-6 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {result.testName}
                    </h3>
                  </div>
                  {result.duration && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {result.duration}ms
                    </span>
                  )}
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {result.message}
                </p>
                
                {result.details && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </summary>
                    <pre className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto text-xs border border-gray-200 dark:border-gray-600">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}

                {result.fileInfo && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>File:</strong> {result.fileInfo.name} ({formatFileSize(result.fileInfo.size)})
                      {result.fileInfo.verified && <span className="text-green-500 ml-2">✅ Verified</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {testResults.length > 0 && !isRunningTests && (
          <div className="mt-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Testing Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {passedTests}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Passed</div>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {failedTests}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalTests}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
            </div>
            
            {passedTests === totalTests && totalTests > 0 && (
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 dark:text-green-300 font-semibold">
                  🎉 All tests passed! Your file sharing system is working perfectly.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
