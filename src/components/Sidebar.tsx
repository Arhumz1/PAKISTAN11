import React, { useState } from "react";
import {
  LayoutDashboard,
  User,
  FileText,
  CreditCard,
  Building2,
  Car,
  Home,
  HeartPulse,
  Receipt,
  Bell,
  Settings,
  ShieldAlert,
  ChevronRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import { ActiveTab } from "../types";

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  unreadNotifications?: number;
  onOpenAiAssistant?: () => void;
  onOpenAi?: () => void;
  langUrdu?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed: externalCollapsed,
  onToggleCollapse,
  unreadNotifications = 1,
  onOpenAiAssistant,
  onOpenAi,
  langUrdu,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const handleAiClick = () => {
    if (onOpenAi) onOpenAi();
    else if (onOpenAiAssistant) onOpenAiAssistant();
  };

  const navItems = [
    { id: "overview" as ActiveTab, label: langUrdu ? "ڈیش بورڈ" : "Dashboard", icon: LayoutDashboard },
    { id: "passport" as ActiveTab, label: langUrdu ? "پاسپورٹ سروسز" : "Passport Services", icon: FileText, badge: "Track" },
    { id: "identity" as ActiveTab, label: langUrdu ? "شناختی کارڈ (CNIC)" : "National Identity", icon: ShieldAlert },
    { id: "taxes" as ActiveTab, label: langUrdu ? "ٹیکس اور FBR" : "Taxes & FBR", icon: Receipt, badge: "ATL" },
    { id: "credit" as ActiveTab, label: langUrdu ? "کریڈٹ اسکور" : "Credit Health", icon: CreditCard },
    { id: "license_vehicle" as ActiveTab, label: langUrdu ? "گاڑیاں اور ڈرائیونگ" : "License & Vehicles", icon: Car },
    { id: "property" as ActiveTab, label: langUrdu ? "اراضی و جائیداد" : "Property Records", icon: Home },
    { id: "healthcare" as ActiveTab, label: langUrdu ? "صحت کارڈ و ڈگری" : "Healthcare & Education", icon: HeartPulse },
    { id: "utilities" as ActiveTab, label: langUrdu ? "یوٹیلیٹی بلز" : "Utility Payments", icon: Building2 },
    { id: "settings" as ActiveTab, label: langUrdu ? "سیکیورٹی و ترتیبات" : "Security & Settings", icon: Settings },
  ];

  return (
    <aside
      className={`hidden lg:flex ${
        isCollapsed ? "w-20" : "w-64"
      } shrink-0 bg-[#01411C] text-white min-h-[calc(100vh-5rem)] p-4 transition-all duration-300 flex-col justify-between select-none shadow-xl`}
    >
      <div className="space-y-2">
        {/* Top Sidebar Header & Brand Logo */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight text-base">CitizenPortal</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-white" />
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition ml-auto"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        {/* Navigation Link Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center ${
                  isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
                } py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white/15 text-white font-bold shadow-xs"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-white/80"}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Security Status Box & Help / AI Button */}
      {!isCollapsed && (
        <div className="p-4 bg-white/10 rounded-2xl space-y-3 mt-6 border border-white/10">
          <div>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-1">Security Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-white text-xs font-bold">2FA Active & NADRA Verified</span>
            </div>
          </div>
          <button
            onClick={handleAiClick}
            className="w-full py-2 bg-white text-[#01411C] hover:bg-emerald-50 rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>AI Help Center</span>
          </button>
        </div>
      )}
    </aside>
  );
};

