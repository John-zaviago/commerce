'use client';

import { useEffect, useState } from 'react';

// Simple prefetch manager without Redis
class SimplePrefetchManager {
  private queue: any[] = [];
  private activePrefetches = new Set<string>();
  private logs: string[] = [];

  addPrefetch(item: any): string {
    const id = `prefetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const prefetchItem = { id, ...item };
    
    this.queue.push(prefetchItem);
    this.log(`Added prefetch: ${item.strategy.name}`);
    this.processQueue();
    
    return id;
  }

  private async processQueue() {
    if (this.activePrefetches.size >= 3) return;
    
    const item = this.queue.shift();
    if (!item) return;

    this.activePrefetches.add(item.id);
    this.log(`Processing prefetch: ${item.strategy.name}`);
    
    try {
      await item.fetchFunction();
      this.log(`Completed prefetch: ${item.strategy.name}`);
    } catch (error) {
      this.log(`Error in prefetch: ${item.strategy.name}`);
    } finally {
      this.activePrefetches.delete(item.id);
      setTimeout(() => this.processQueue(), 0);
    }
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      activePrefetches: this.activePrefetches.size,
      logs: this.logs.slice(-10),
    };
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(`[Prefetch] ${message}`);
  }

  clearQueue() {
    this.queue = [];
    this.activePrefetches.clear();
    this.log('Cleared prefetch queue');
  }
}

const simplePrefetchManager = new SimplePrefetchManager();

export default function BasicPrefetchDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [hoverCount, setHoverCount] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      const newStats = simplePrefetchManager.getStats();
      setStats(newStats);
      setLogs(newStats.logs);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleProductHover = (productId: number) => {
    setHoverCount(prev => prev + 1);
    
    simplePrefetchManager.addPrefetch({
      strategy: {
        name: `product_${productId}_hover`,
        priority: 'medium',
        trigger: 'hover',
        delay: 200,
      },
      fetchFunction: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log(`[Prefetch] Product ${productId} details cached`);
      },
      cacheKey: `product:${productId}`,
      ttl: 300,
    });
  };

  const testPrefetch = () => {
    simplePrefetchManager.addPrefetch({
      strategy: {
        name: 'test_prefetch',
        priority: 'high',
        trigger: 'click',
      },
      fetchFunction: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('[Prefetch] Test prefetch completed');
      },
      cacheKey: 'test:prefetch',
      ttl: 300,
    });
  };

  const clearQueue = () => {
    simplePrefetchManager.clearQueue();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🚀 Basic Prefetch Demo</h1>
      
      {/* Stats and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📊 Prefetch Stats</h3>
          {stats ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Queue Length:</span>
                <span className="font-mono">{stats.queueLength}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Prefetches:</span>
                <span className="font-mono">{stats.activePrefetches}</span>
              </div>
              <div className="flex justify-between">
                <span>Hover Count:</span>
                <span className="font-mono">{hoverCount}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading stats...</div>
          )}
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">🎮 Controls</h3>
          <div className="space-y-2">
            <button
              onClick={testPrefetch}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Test Prefetch
            </button>
            <button
              onClick={clearQueue}
              className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Clear Queue
            </button>
          </div>
        </div>

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
              <div className="text-gray-500">No logs yet. Hover over products!</div>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-4">🛍️ Product Grid (Hover to Test Prefetching)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              onMouseEnter={() => handleProductHover(i + 1)}
              className="bg-gray-100 p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors group"
            >
              <div className="aspect-square bg-gray-300 rounded mb-3 group-hover:bg-gray-400 transition-colors"></div>
              <h4 className="font-semibold text-sm">Product {i + 1}</h4>
              <p className="text-gray-600 text-sm">${(Math.random() * 100 + 10).toFixed(2)}</p>
              <div className="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Hover to prefetch details
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-green-50 p-4 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">✅ How to Test Prefetching:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Hover over products</strong> - Triggers prefetching (watch logs and stats)</li>
          <li>• <strong>Click "Test Prefetch"</strong> - Manually trigger a prefetch operation</li>
          <li>• <strong>Watch the queue</strong> - See how prefetches are queued and processed</li>
          <li>• <strong>Check console</strong> - Open DevTools to see detailed logs</li>
          <li>• <strong>Monitor stats</strong> - Queue length and active prefetches update in real-time</li>
        </ul>
      </div>
    </div>
  );
}
