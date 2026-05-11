import React, { useState, useEffect } from "react";
import { Monitor } from "./types";
import { MonitorCard } from "./components/MonitorCard";
import { BrowserFrame } from "./components/BrowserFrame";
import { Plus, LayoutDashboard, Activity, Settings, Github, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newInterval] = useState(14); // Default 14m to stay under 15m sleep
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMonitors();
    const interval = setInterval(fetchMonitors, 10000); // UI poll every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchMonitors = async () => {
    try {
      const res = await fetch("/api/monitors");
      const data = await res.json();
      setMonitors(data);
      if (data.length > 0 && !selectedUrl) {
        setSelectedUrl(data[0].url);
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
      setSelectedUrl(data.url);
      setNewUrl("");
    } catch (err) {
      console.error("Failed to add", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMonitor = async (id: string) => {
    try {
      const monitorToDelete = monitors.find(m => m.id === id);
      await fetch(`/api/monitors/${id}`, { method: "DELETE" });
      setMonitors((prev) => prev.filter((m) => m.id !== id));
      if (monitorToDelete?.url === selectedUrl) {
        setSelectedUrl(null);
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

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
        <div className="bg-white border-2 border-black rounded-full px-4 py-1.5 flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-bold uppercase text-[10px] tracking-widest">Service Active</span>
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
                    onClick={() => setSelectedUrl(monitor.url)}
                    className={`cursor-pointer transition-all ${selectedUrl === monitor.url ? 'translate-x-1' : ''}`}
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
            {selectedUrl ? (
              <BrowserFrame url={selectedUrl} />
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
          <div className="h-28 bg-teal-300 border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col">
            <h4 className="text-[10px] font-black uppercase mb-1.5 flex items-center justify-between">
              Live Node Logs
              <Activity size={12} />
            </h4>
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] leading-tight text-indigo-900 pr-1">
              {monitors.map((m, idx) => (
                <div key={`${m.id}-log-${idx}`} className="flex gap-2">
                  <span className="opacity-60">[{m.lastPingTime ? new Date(m.lastPingTime).toLocaleTimeString() : 'INIT'}]</span>
                  <span className="font-bold">{m.lastPingStatus === 200 ? 'SUCCESS:' : 'PENDING:'}</span>
                  <span className="truncate">Ping delivered to {new URL(m.url).hostname}</span>
                </div>
              ))}
              {monitors.length === 0 && (
                <div className="opacity-40 italic">Waiting for active nodes...</div>
              )}
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

