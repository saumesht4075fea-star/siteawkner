export interface Monitor {
  id: string;
  url: string;
  interval: number;
  lastPingStatus: number | null;
  lastPingTime: string | null;
  lastPingDuration: number | null;
  isActive: boolean;
}
