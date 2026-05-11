import { useState, useEffect, useRef } from "react";
import { RotateCw, ExternalLink, Globe } from "lucide-react";

interface Props {
  url: string | null;
}

export function BrowserFrame({ url }: Props) {
  const [reloadKey, setReloadKey] = useState(0);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!url) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setReloadKey((k) => k + 1);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [url]);

  const handleManualReload = () => {
    setReloadKey((k) => k + 1);
    setCountdown(600);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  if (!url) {
    return (
      <div className="flex flex-col h-full border border-white/10 rounded-xl overflow-hidden bg-black/40 items-center justify-center p-8 text-center">
        <Globe size={48} className="text-white/10 mb-4" />
        <p className="text-sm text-white/40 font-mono uppercase tracking-widest">No active frame selected</p>
        <p className="text-xs text-white/20 mt-2">Add a monitor to start viewing its live state.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden flex-1">
      <div className="bg-slate-200 border-b-4 border-black p-3 flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 shrink-0">
            <div className="w-3 h-3 bg-red-400 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"></div>
            <div className="w-3 h-3 bg-yellow-400 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"></div>
            <div className="w-3 h-3 bg-green-400 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"></div>
          </div>
          <div className="bg-white border-2 border-black rounded-lg px-3 py-1 text-[10px] font-bold text-slate-500 truncate max-w-sm">
            {url}
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
            <RotateCw size={10} className={countdown < 10 ? "animate-spin" : ""} />
            AUTO: {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleManualReload} 
              title="Manual Reload"
              className="bg-white border-2 border-black p-1.5 rounded hover:bg-slate-100 transition-all active:translate-y-0.5 cursor-pointer"
            >
              <RotateCw size={14} strokeWidth={3} />
            </button>
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              title="Open in New Tab"
              className="bg-blue-500 text-white border-2 border-black p-1.5 rounded hover:bg-black transition-all active:translate-y-0.5"
            >
              <ExternalLink size={14} strokeWidth={3} />
            </a>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-slate-50 relative overflow-hidden">
        <iframe
          key={`${url}-${reloadKey}`}
          ref={iframeRef}
          src={url}
          className="w-full h-full border-none"
          title="Remote View"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-x-0 bottom-0 pointer-events-none flex items-center justify-center p-6 text-center">
           <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md pointer-events-auto">
             <p className="text-[10px] font-black uppercase text-indigo-600 mb-1 flex items-center justify-center gap-2">
               <Globe size={12} /> Live Render Engine
             </p>
             <p className="text-[10px] font-bold text-slate-500">
               If page is blank, it's due to site security policies (like GitHub). 
               <br />
               <span className="text-green-600 uppercase font-black tracking-widest">Background pings are active!</span>
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}
