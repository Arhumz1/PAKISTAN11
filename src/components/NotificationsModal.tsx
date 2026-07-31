import React, { useState } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  FileText,
  Receipt,
  Building2,
  ShieldCheck,
  Check,
} from "lucide-react";
import { NotificationItem } from "../types";
import { mockNotifications } from "../data/mockData";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "passport":
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case "tax":
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case "utility":
        return <Building2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Government Official Notifications
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Mark all read
            </button>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start space-x-3 text-xs ${
                n.read
                  ? "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-700/50"
                  : "bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 font-medium"
              }`}
            >
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-xs shrink-0">
                {getIcon(n.category)}
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{n.title}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{n.date}</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
