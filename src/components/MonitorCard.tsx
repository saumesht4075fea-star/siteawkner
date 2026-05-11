import { Monitor } from "../types";
import { Trash2, ExternalLink, Activity } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  monitor: Monitor;
  onDelete: (id: string) => void;
}

export function MonitorCard({ monitor, onDelete }: Props) {
  const statusColor = monitor.lastPingStatus === 200 ? "bg-green-500" : monitor.lastPingStatus === null ? "bg-slate-300" : "bg-red-500";
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border-2 border-black p-3 rounded-xl flex flex-col gap-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
    >
      <div className="flex justify-between items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-black uppercase text-slate-400">Endpoint</div>
          <h3 className="text-xs font-black truncate text-indigo-900">{monitor.url}</h3>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(monitor.id);
          }}
          className="bg-red-500 border border-black p-1 rounded-md text-white hover:bg-black transition-colors"
        >
          <Trash2 size={12} strokeWidth={3} />
        </button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full border border-black ${statusColor}`} />
          <span className="text-[10px] font-black uppercase">
            {monitor.lastPingStatus === 0 ? "OFFLINE" : (monitor.lastPingStatus || "---")}
          </span>
          {monitor.lastPingDuration && (
            <span className="text-[8px] font-mono text-slate-400">
              {monitor.lastPingDuration}ms
            </span>
          )}
        </div>
        <div className="text-[9px] font-bold text-slate-500">
          {monitor.lastPingTime ? new Date(monitor.lastPingTime).toLocaleTimeString() : "PENDING"}
        </div>
      </div>
    </motion.div>
  );
}
