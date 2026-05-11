import React, { useState, useEffect } from "react";
import { Monitor } from "./types";
import { MonitorCard } from "./components/MonitorCard";
import { BrowserFrame } from "./components/BrowserFrame";
import { Plus, LayoutDashboard, Activity, Settings, Github, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newInterval] = useState(10); // Default 10m to stay under 15m sleep
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMonitors();
    const interval = setInterval(fetchMonitors, 5000); // Poll more frequently for logs
    return () => clearInterval(interval);
  }, []);

  const fetchMonitors = async () => {
    try {
      const res = await fetch("/api/monitors");
      const data = await res.json();
      setMonitors(data);
      
      // Auto-select if nothing selected
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch monitors", err);
    }
  };

  const addMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, interval: newInterval }),
      });
      const data = await res.json();
      setMonitors((prev) => [...prev, data]);
      setSelectedId(data.id);
      setNewUrl("");
    } catch (err) {
      console.error("Failed to add", err);
    } finally {
      setIsLoading(false);
    }
  };

  const forceWakeup = async () => {
    if (!selectedId) return;
    setIsLoading(true);
    try {
      await fetch(`/api/monitors/${selectedId}/ping`, { method: "POST" });
      await fetchMonitors(); // Refresh status
    } catch (err) {
      console.error("Force wakeup failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMonitor = async (id: string) => {
    try {
      await fetch(`/api/monitors/${id}`, { method: "DELETE" });
      setMonitors((prev) => prev.filter((m) => m.id !== id));
      if (id === selectedId) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const selectedMonitor = monitors.find(m => m.id === selectedId);

  return (
    <div className="h-screen w-full bg-indigo-600 font-sans text-slate-900 flex flex-col p-3 sm:p-4 box-border overflow-hidden">
      {/* Header Section */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
            <Zap size={20} fill="black" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md uppercase">
            WAKEUP.IO
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-indigo-900/20 border-2 border-black rounded-full px-4 py-1.5 items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="font-black uppercase text-[9px] tracking-widest text-white">Self-Wake: Active</span>
          </div>
          <div className="bg-white border-2 border-black rounded-full px-4 py-1.5 flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-bold uppercase text-[10px] tracking-widest">Service Online</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Sidebar Controls */}
        <div className="w-72 flex flex-col gap-4 overflow-hidden">
          {/* Add Form Card */}
          <div className="bg-yellow-400 border-4 border-black p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <form onSubmit={addMonitor}>
              <label className="block text-[10px] font-black uppercase mb-1 tracking-tighter">Target URL</label>
              <input 
                type="text" 
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://yourapp.render.com"
                className="w-full bg-white border-2 border-black rounded-lg p-2.5 mb-3 font-mono text-xs focus:outline-none focus:ring-2 ring-indigo-500"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white font-black py-3 rounded-xl hover:translate-y-0.5 transition-transform disabled:opacity-50 text-sm"
              >
                {isLoading ? "ADDING..." : "ADD TARGET"}
              </button>
            </form>
          </div>

          {/* Monitors List Card */}
          <div className="bg-pink-400 border-4 border-black p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-1 flex flex-col min-h-0">
            <h2 className="text-sm font-black mb-3 uppercase flex items-center justify-between">
              Infrastructure
              <span className="text-[10px] opacity-60 font-mono">{monitors.length} Nodes</span>
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {monitors.map((monitor) => (
                  <div 
                    key={monitor.id} 
                    onClick={() => setSelectedId(monitor.id)}
                    className={`cursor-pointer transition-all ${selectedId === monitor.id ? 'translate-x-1 ring-2 ring-black rounded-xl' : ''}`}
                  >
                    <MonitorCard 
                      monitor={monitor} 
                      onDelete={deleteMonitor} 
                    />
                  </div>
                ))}
                {monitors.length === 0 && (
                  <div className="h-24 bg-white/20 border-2 border-dashed border-black/20 rounded-xl flex items-center justify-center text-center p-3">
                    <p className="text-[10px] font-bold uppercase opacity-60">No targets found</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side: Browser & Logs */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Browser Container */}
          <div className="flex-1 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col relative min-h-0">
            <div className="bg-slate-100 border-b-2 border-black p-2 px-4 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-slate-500">Node Status: {selectedId ? 'Connected' : 'Idle'}</span>
              <button 
                onClick={forceWakeup}
                disabled={isLoading || !selectedId}
                className="bg-indigo-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-lg border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isLoading ? 'HANDSHAKING...' : 'FORCE WAKEUP'}
              </button>
            </div>
            {selectedMonitor ? (
              <BrowserFrame url={selectedMonitor.url} />
            ) : (
              <div className="flex-1 bg-slate-50 flex items-center justify-center p-10">
                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-indigo-200">
                    <span className="text-3xl">🌐</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Rendering Sandbox</h3>
                  <p className="text-slate-400 text-sm font-medium">Add a URL to activate live preview</p>
                </div>
              </div>
            )}
          </div>

          {/* Activity Logs Card */}
          <div className="h-44 bg-teal-300 border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col">
            <h4 className="text-[10px] font-black uppercase mb-1.5 flex items-center justify-between">
              Live Network Handshake
              <div className="flex items-center gap-2 bg-black/10 px-2 rounded-full py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-[8px]">Server-Side Active</span>
              </div>
            </h4>
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] leading-tight text-indigo-900 pr-1 custom-scrollbar">
              {monitors.map((m, idx) => (
                <div key={`${m.id}-log-${idx}`} className="flex gap-2 border-b border-black/5 pb-1 last:border-0 items-center">
                  <span className="opacity-60 text-[8px] whitespace-nowrap">[{m.lastPingTime ? new Date(m.lastPingTime).toLocaleTimeString() : 'WAIT'}]</span>
                  <span className={`font-black shrink-0 ${m.lastPingStatus === 200 ? 'text-green-700' : 'text-red-700'}`}>
                    {m.lastPingStatus === 200 ? 'ALIVE' : m.lastPingStatus === 0 ? 'FAIL' : 'INIT'}
                  </span>
                  <span className="truncate flex-1">→ {new URL(m.url).hostname}</span>
                  <span className="opacity-40 text-[8px]">{m.lastPingDuration || 0}ms</span>
                </div>
              ))}
              {monitors.length === 0 && (
                <div className="opacity-40 italic flex flex-col items-center justify-center h-full gap-1 text-center">
                  <Zap size={16} className="animate-pulse" />
                  <p>Service active in background.<br/>Add a URL to begin handshake.</p>
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-between items-center text-[7px] uppercase font-black opacity-60 border-t border-black/10 pt-1">
              <span>Cloud Run Persistence: ON</span>
              <span>Deploy to Render/Railway for 24/7 pings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-3 flex justify-between items-center text-white/80 text-[10px] font-bold uppercase tracking-widest">
        <div>UpKeep Engine v1.1.0</div>
        <div>Uptime: Continuous</div>
        <div>Status: Monitoring...</div>
      </footer>
    </div>
  );
}

