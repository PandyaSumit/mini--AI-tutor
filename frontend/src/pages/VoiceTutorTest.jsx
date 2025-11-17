import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Volume2 } from 'lucide-react';
import VoiceChat from '../components/VoiceChat';

const VoiceTutorTest = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  // Get token from localStorage (adjust based on your auth implementation)
  const token = localStorage.getItem('token');

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // Handle messages from VoiceChat
  const handleMessage = (message) => {
    addLog(`New message from ${message.role}: ${message.content.substring(0, 50)}...`, 'success');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please login to test the voice tutor
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  🎤 Voice AI Tutor - Test Page
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Test real-time voice and text communication
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live Test</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Chat Component */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="h-[600px]">
                <VoiceChat
                  token={token}
                  onMessage={handleMessage}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* Instructions & Debug Panel */}
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📝 How to Test
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Voice Input</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Click the <Mic className="inline" size={14} /> microphone button, speak your question, then click again to stop.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Text Input</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Or type your message and press Enter or click send.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Listen to Response</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      AI will respond with both text and voice (if <Volume2 className="inline" size={14} /> is enabled).
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Make sure your backend server is running and OpenAI API key is configured for speech-to-text.
                </p>
              </div>
            </div>

            {/* Debug Logs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  🐛 Debug Logs
                </h2>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No logs yet. Start interacting with the voice chat.
                  </p>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded ${
                        log.type === 'success'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : log.type === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      <span className="font-mono opacity-70">{log.timestamp}</span>
                      <span className="ml-2">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Browser Support */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ✅ Browser Check
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">MediaRecorder API</span>
                  <span className={`font-medium ${
                    window.MediaRecorder ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {window.MediaRecorder ? '✓ Supported' : '✗ Not supported'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">getUserMedia</span>
                  <span className={`font-medium ${
                    navigator.mediaDevices?.getUserMedia ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {navigator.mediaDevices?.getUserMedia ? '✓ Supported' : '✗ Not supported'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Speech Synthesis</span>
                  <span className={`font-medium ${
                    window.speechSynthesis ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {window.speechSynthesis ? '✓ Supported' : '✗ Not supported'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">WebSocket</span>
                  <span className={`font-medium ${
                    window.WebSocket ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {window.WebSocket ? '✓ Supported' : '✗ Not supported'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTutorTest;
