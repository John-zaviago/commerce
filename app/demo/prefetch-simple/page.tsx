'use client';

import { useState } from 'react';

export default function SimplePrefetchDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [hoverCount, setHoverCount] = useState(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const handleHover = () => {
    setHoverCount(prev => prev + 1);
    addLog(`Product hovered! Count: ${hoverCount + 1}`);
    
    // Simulate prefetching
    setTimeout(() => {
      addLog('Prefetch completed - product details cached');
    }, 200);
  };

  const testPrefetch = () => {
    addLog('Testing prefetch functionality...');
    setTimeout(() => {
      addLog('Prefetch test completed successfully!');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🚀 Simple Prefetch Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📝 Live Logs</h3>
          <div className="h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs font-mono">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="text-green-600 mb-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No logs yet. Hover over products to see activity!</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📊 Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Hover Count:</span>
              <span className="font-mono">{hoverCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Logs:</span>
              <span className="font-mono">{logs.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 border border-gray-200 rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-4">🛍️ Product Grid (Hover to Test Prefetching)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              onMouseEnter={handleHover}
              className="bg-gray-100 p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <div className="aspect-square bg-gray-300 rounded mb-2"></div>
              <h4 className="font-semibold">Product {i + 1}</h4>
              <p className="text-gray-600">$29.99</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 border border-gray-200 rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-4">🎮 Test Controls</h3>
        <button
          onClick={testPrefetch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Prefetch Function
        </button>
      </div>

      <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Test Prefetching:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Hover over products</strong> - See logs appear in real-time</li>
          <li>• <strong>Watch the hover count</strong> - Tracks how many times you've hovered</li>
          <li>• <strong>Click "Test Prefetch Function"</strong> - Simulates prefetch operation</li>
          <li>• <strong>Check console</strong> - Open DevTools to see additional logs</li>
        </ul>
      </div>
    </div>
  );
}
