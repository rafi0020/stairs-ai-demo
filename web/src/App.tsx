/**
 * App.tsx
 * 
 * Main application with two routes:
 * 1. Demo - Video-based safety visualization
 * 2. Documentation - Complete project documentation
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Play, BookOpen, Shield, Loader2 } from 'lucide-react';
import type { DemoData } from './lib/types';
import { loadAllDemoData, createPlaceholderData } from './lib/loadDemoData';
import InteractiveDemo from './pages/InteractiveDemo';
import Documentation from './pages/Documentation';

function App() {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllDemoData()
      .then((data: DemoData) => {
        if (data.framePackets.length === 0 && data.events.length === 0) {
          setDemoData(createPlaceholderData());
        } else {
          setDemoData(data);
        }
      })
      .catch(() => {
        setDemoData(createPlaceholderData());
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-green-500 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Stairs-AI</h2>
          <p className="text-gray-400">Loading demo...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/stairs-ai-demo">
      <div className="min-h-screen bg-gray-950">
        {/* Navigation Header */}
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <NavLink to="/" className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white leading-tight">Stairs-AI</h1>
                  <p className="text-[10px] text-gray-500 leading-tight">Safety Demo</p>
                </div>
              </NavLink>

              {/* Main Navigation */}
              <nav className="flex items-center space-x-1">
                <NavLink
                  to="/demo"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm font-medium">Demo</span>
                </NavLink>
                
                <NavLink
                  to="/docs"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Documentation</span>
                </NavLink>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <Routes>
          <Route
            path="/demo"
            element={<InteractiveDemo demoData={demoData} />}
          />
          <Route
            path="/docs"
            element={<Documentation />}
          />
          <Route path="/" element={<Navigate to="/demo" replace />} />
          <Route path="*" element={<Navigate to="/demo" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
