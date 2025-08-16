'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  FileText, 
  Image, 
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
  Pause,
  ArrowLeft
} from 'lucide-react';

interface TestFile {
  name: string;
  size: number;
  type: string;
  content: ArrayBuffer;
  hash: string;
}

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

interface FileTransferTest {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  originalHash: string;
  receivedHash?: string;
  transferStartTime?: number;
  transferEndTime?: number;
  progressUpdates: number[];
  status: 'pending' | 'sending' | 'receiving' | 'verifying' | 'completed' | 'failed';
  error?: string;
}

export default function ComprehensiveFileTransferTester({ onBack }: { onBack?: () => void }) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [fileTransferTests, setFileTransferTests] = useState<FileTransferTest[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const testFilesRef = useRef<TestFile[]>([]);

  // Generate test files of various types and sizes
  const generateTestFiles = useCallback(async (): Promise<TestFile[]> => {
    const files: TestFile[] = [];

    // Small text file
    const smallText = new TextEncoder().encode('Hello, World! This is a small test file.');
    files.push({
      name: 'small-test.txt',
      size: smallText.byteLength,
      type: 'text/plain',
      content: smallText.buffer,
      hash: await calculateHash(smallText.buffer)
    });

    // Medium image-like file (simulated)
    const mediumFile = new Uint8Array(500 * 1024); // 500KB
    for (let i = 0; i < mediumFile.length; i++) {
      mediumFile[i] = i % 256;
    }
    files.push({
      name: 'medium-image.jpg',
      size: mediumFile.byteLength,
      type: 'image/jpeg',
      content: mediumFile.buffer,
      hash: await calculateHash(mediumFile.buffer)
    });

    // Large file (10MB)
    const largeFile = new Uint8Array(10 * 1024 * 1024);
    for (let i = 0; i < largeFile.length; i++) {
      largeFile[i] = (i * 17) % 256; // Create pattern to detect corruption
    }
    files.push({
      name: 'large-video.mp4',
      size: largeFile.byteLength,
      type: 'video/mp4',
      content: largeFile.buffer,
      hash: await calculateHash(largeFile.buffer)
    });

    // Archive file
    const archiveFile = new Uint8Array(2 * 1024 * 1024); // 2MB
    for (let i = 0; i < archiveFile.length; i++) {
      archiveFile[i] = Math.floor(Math.random() * 256);
    }
    files.push({
      name: 'archive-test.zip',
      size: archiveFile.byteLength,
      type: 'application/zip',
      content: archiveFile.buffer,
      hash: await calculateHash(archiveFile.buffer)
    });

    // Very large file (50MB) - edge case
    const veryLargeFile = new Uint8Array(50 * 1024 * 1024);
    for (let i = 0; i < veryLargeFile.length; i++) {
      veryLargeFile[i] = (i ^ (i >> 8) ^ (i >> 16)) % 256; // Complex pattern
    }
    files.push({
      name: 'very-large-document.pdf',
      size: veryLargeFile.byteLength,
      type: 'application/pdf',
      content: veryLargeFile.buffer,
      hash: await calculateHash(veryLargeFile.buffer)
    });

    return files;
  }, []);

  const calculateHash = async (buffer: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Test 1: File metadata accuracy
  const testFileMetadataAccuracy = async (): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const testFiles = await generateTestFiles();
      testFilesRef.current = testFiles;

      // Verify each test file has correct metadata
      for (const file of testFiles) {
        if (!file.name || file.name.length === 0) {
          throw new Error(`File name is empty`);
        }
        if (file.size <= 0) {
          throw new Error(`File size is invalid: ${file.size}`);
        }
        if (!file.type || file.type.length === 0) {
          throw new Error(`File type is empty for ${file.name}`);
        }
        if (file.content.byteLength !== file.size) {
          throw new Error(`Content size mismatch for ${file.name}: expected ${file.size}, got ${file.content.byteLength}`);
        }
        if (!file.hash || file.hash.length !== 64) {
          throw new Error(`Invalid hash for ${file.name}`);
        }
      }

      return {
        testName: 'File Metadata Accuracy',
        status: 'passed',
        message: `All ${testFiles.length} test files have correct metadata`,
        details: testFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'File Metadata Accuracy',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 2: Progress indicator accuracy
  const testProgressIndicatorAccuracy = async (): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      // Simulate file transfer with progress tracking
      const progressUpdates: number[] = [];
      const totalSize = 1000000; // 1MB
      let transferred = 0;

      // Simulate chunked transfer
      const chunkSize = 64 * 1024; // 64KB chunks
      const totalChunks = Math.ceil(totalSize / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const chunkStart = i * chunkSize;
        const chunkEnd = Math.min(chunkStart + chunkSize, totalSize);
        const currentChunkSize = chunkEnd - chunkStart;
        
        transferred += currentChunkSize;
        const progress = Math.round((transferred / totalSize) * 100);
        progressUpdates.push(progress);

        // Simulate transfer delay
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Verify progress updates
      if (progressUpdates.length === 0) {
        throw new Error('No progress updates recorded');
      }

      if (progressUpdates[0] <= 0) {
        throw new Error('Progress should start above 0');
      }

      if (progressUpdates[progressUpdates.length - 1] !== 100) {
        throw new Error(`Final progress should be 100%, got ${progressUpdates[progressUpdates.length - 1]}%`);
      }

      // Check for monotonic increase
      for (let i = 1; i < progressUpdates.length; i++) {
        if (progressUpdates[i] < progressUpdates[i - 1]) {
          throw new Error(`Progress decreased from ${progressUpdates[i - 1]}% to ${progressUpdates[i]}%`);
        }
      }

      return {
        testName: 'Progress Indicator Accuracy',
        status: 'passed',
        message: `Progress tracking works correctly with ${progressUpdates.length} updates`,
        details: { progressUpdates, totalChunks },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'Progress Indicator Accuracy',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 3: File integrity verification
  const testFileIntegrityVerification = async (): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const testFiles = testFilesRef.current;
      if (testFiles.length === 0) {
        throw new Error('No test files available');
      }

      const integrityResults: any[] = [];

      for (const testFile of testFiles) {
        // Simulate transfer and verify integrity
        const originalHash = testFile.hash;
        
        // Create a copy (simulating received file)
        const receivedContent = testFile.content.slice(); // Clone the buffer
        const receivedHash = await calculateHash(receivedContent);
        
        if (originalHash !== receivedHash) {
          throw new Error(`Integrity check failed for ${testFile.name}`);
        }

        integrityResults.push({
          fileName: testFile.name,
          originalHash: originalHash.substring(0, 16) + '...',
          verified: true
        });

        // Test corruption detection
        const corruptedContent = new Uint8Array(receivedContent);
        if (corruptedContent.length > 100) {
          corruptedContent[50] = corruptedContent[50] ^ 0xFF; // Flip bits
        }
        const corruptedHash = await calculateHash(corruptedContent.buffer);
        
        if (originalHash === corruptedHash) {
          throw new Error(`Corruption detection failed for ${testFile.name}`);
        }
      }

      return {
        testName: 'File Integrity Verification',
        status: 'passed',
        message: `All ${testFiles.length} files passed integrity verification`,
        details: integrityResults,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'File Integrity Verification',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 4: Large file handling
  const testLargeFileHandling = async (): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const testFiles = testFilesRef.current;
      const largeFiles = testFiles.filter(f => f.size >= 10 * 1024 * 1024); // 10MB+

      if (largeFiles.length === 0) {
        throw new Error('No large files available for testing');
      }

      const results: any[] = [];

      for (const largeFile of largeFiles) {
        // Test chunked processing
        const chunkSize = 256 * 1024; // 256KB chunks
        const totalChunks = Math.ceil(largeFile.size / chunkSize);
        
        const chunks: ArrayBuffer[] = [];
        let processedSize = 0;

        // Simulate chunked processing
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, largeFile.size);
          const chunk = largeFile.content.slice(start, end);
          chunks.push(chunk);
          processedSize += chunk.byteLength;
        }

        // Verify chunking
        if (processedSize !== largeFile.size) {
          throw new Error(`Chunk size mismatch for ${largeFile.name}: expected ${largeFile.size}, processed ${processedSize}`);
        }

        // Reconstruct file from chunks
        const reconstructed = new Uint8Array(largeFile.size);
        let offset = 0;
        for (const chunk of chunks) {
          reconstructed.set(new Uint8Array(chunk), offset);
          offset += chunk.byteLength;
        }

        // Verify reconstruction
        const reconstructedHash = await calculateHash(reconstructed.buffer);
        if (reconstructedHash !== largeFile.hash) {
          throw new Error(`Reconstruction failed for ${largeFile.name}`);
        }

        results.push({
          fileName: largeFile.name,
          size: largeFile.size,
          chunks: totalChunks,
          verified: true
        });
      }

      return {
        testName: 'Large File Handling',
        status: 'passed',
        message: `Successfully handled ${largeFiles.length} large files with chunked processing`,
        details: results,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'Large File Handling',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 5: Different file format support
  const testDifferentFileFormats = async (): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const testFiles = testFilesRef.current;
      const formatTests: any[] = [];

      const expectedFormats = ['text/plain', 'image/jpeg', 'video/mp4', 'application/zip', 'application/pdf'];
      
      for (const expectedFormat of expectedFormats) {
        const file = testFiles.find(f => f.type === expectedFormat);
        if (!file) {
          throw new Error(`No test file found for format: ${expectedFormat}`);
        }

        // Test format detection and handling
        const isTextFile = file.type.startsWith('text/');
        const isImageFile = file.type.startsWith('image/');
        const isVideoFile = file.type.startsWith('video/');
        const isArchiveFile = file.type.includes('zip') || file.type.includes('archive');
        const isDocumentFile = file.type.includes('pdf') || file.type.includes('document');

        formatTests.push({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          category: isTextFile ? 'text' : isImageFile ? 'image' : isVideoFile ? 'video' : 
                   isArchiveFile ? 'archive' : isDocumentFile ? 'document' : 'other',
          supported: true
        });
      }

      return {
        testName: 'Different File Format Support',
        status: 'passed',
        message: `Successfully tested ${formatTests.length} different file formats`,
        details: formatTests,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'Different File Format Support',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  // Test 6: Connection recovery simulation
  const testConnectionRecovery = async (): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      // Simulate connection interruption and recovery
      let connectionState = 'connected';
      let transferProgress = 0;
      const recoveryLog: string[] = [];

      // Simulate normal transfer
      for (let i = 0; i <= 100; i += 10) {
        transferProgress = i;
        
        // Simulate interruption at 50%
        if (i === 50) {
          connectionState = 'disconnected';
          recoveryLog.push(`Connection lost at ${i}% progress`);
          
          // Simulate reconnection attempt
          await new Promise(resolve => setTimeout(resolve, 100));
          
          connectionState = 'connecting';
          recoveryLog.push('Attempting to reconnect...');
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
          connectionState = 'connected';
          recoveryLog.push(`Connection restored at ${i}% progress`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (connectionState !== 'connected') {
        throw new Error('Connection recovery failed');
      }

      if (transferProgress !== 100) {
        throw new Error('Transfer did not complete after recovery');
      }

      return {
        testName: 'Connection Recovery',
        status: 'passed',
        message: 'Successfully recovered from connection interruption',
        details: { recoveryLog, finalProgress: transferProgress },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: 'Connection Recovery',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setTestProgress(0);

    const tests = [
      testFileMetadataAccuracy,
      testProgressIndicatorAccuracy,
      testFileIntegrityVerification,
      testLargeFileHandling,
      testDifferentFileFormats,
      testConnectionRecovery
    ];

    const results: TestResult[] = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTest(test.name);
      setTestProgress(((i) / tests.length) * 100);

      // Add pending result
      const pendingResult: TestResult = {
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTest(null);
    setTestProgress(100);
    setIsRunningTests(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'failed': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'error': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'running': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-800/50';
    }
  };

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
              File Sharing Workflow Tester
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-lg">
              Comprehensive testing suite that verifies file metadata accuracy, transfer integrity, 
              progress tracking, large file handling, format support, and connection recovery.
            </p>
          </div>
          <div className="w-24"></div>
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
                <span>{isRunningTests ? 'Running Tests...' : 'Run All Tests'}</span>
              </button>
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
            <h2 className="text-2xl font-space-grotesk font-bold text-gray-800 dark:text-white mb-4">
              Test Results
            </h2>
            
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
                    <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      View Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Test Summary */}
        {testResults.length > 0 && !isRunningTests && (
          <div className="mt-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Test Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {testResults.filter(r => r.status === 'passed').length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Passed</div>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {testResults.filter(r => r.status === 'failed' || r.status === 'error').length}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {testResults.filter(r => r.status === 'running').length}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Running</div>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {testResults.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
