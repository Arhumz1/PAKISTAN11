import React, { useState } from "react";
import {
  Shield,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Bot,
  LogOut,
  Sparkles,
  ChevronDown,
  Globe,
  Lock,
  CheckCircle2,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Receipt,
  CreditCard,
  Car,
  Home,
  HeartPulse,
  Building2,
  Settings,
} from "lucide-react";
import { UserProfile } from "../types";

interface NavbarProps {
  isAuthenticated?: boolean;
  user: UserProfile | null;
  onOpenAuth: (view: "login" | "signup") => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  langUrdu: boolean;
  onToggleLang: () => void;
  onOpenAiAssistant?: () => void;
  onOpenAi?: () => void;
  onToggleNotifications?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  onSelectServiceTab?: (tab: string) => void;
  onSelectTab?: (tab: any) => void;
  onGoHome?: () => void;
  activeTab?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAuthenticated,
  user,
  onOpenAuth,
  onLogout,
  darkMode,
  onToggleDarkMode,
  langUrdu,
  onToggleLang,
  onOpenAiAssistant,
  onOpenAi,
  onToggleNotifications,
  onOpenNotifications,
  unreadCount = 1,
  onSelectServiceTab,
  onSelectTab,
  onGoHome,
  activeTab,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSelectTab = (tab: string) => {
    if (!isAuthenticated) {
      onOpenAuth("login");
      return;
    }
    if (onSelectTab) onSelectTab(tab);
    else if (onSelectServiceTab) onSelectServiceTab(tab);
    setShowMobileMenu(false);
  };

  const handleNotificationsClick = () => {
    if (onOpenNotifications) onOpenNotifications();
    else if (onToggleNotifications) onToggleNotifications();
  };

  const handleAiClick = () => {
    if (onOpenAi) onOpenAi();
    else if (onOpenAiAssistant) onOpenAiAssistant();
  };

  const availableServices = [
    { title: "Passport Renewal & Executive Booking", tab: "passport", tag: "NADRA / Passports" },
    { title: "Active Taxpayer List (ATL) & FBR Income Tax", tab: "taxes", tag: "FBR Iris" },
    { title: "Credit Health & Credit Score Gauge", tab: "credit", tag: "State Bank Credit" },
    { title: "Smart CNIC & Family Certificate (FRC)", tab: "identity", tag: "NADRA Digital" },
    { title: "Driving License & Vehicle Token Tax", tab: "license_vehicle", tag: "E-Routing ICT" },
    { title: "E-Zameen Land Record & Digital Fard", tab: "property", tag: "Land Cadastre" },
    { title: "Sehat Sahulat Health Card Locator", tab: "healthcare", tag: "Ministry of Health" },
    { title: "IESCO / SNGPL / Water Utility Payments", tab: "utilities", tag: "E-Khidmat Gateway" },
  ];

  const mobileNavItems = [
    { id: "overview", label: langUrdu ? "ڈیش بورڈ" : "Dashboard", icon: LayoutDashboard },
    { id: "passport", label: langUrdu ? "پاسپورٹ سروسز" : "Passport Services", icon: FileText },
    { id: "identity", label: langUrdu ? "شناختی کارڈ (CNIC)" : "National Identity", icon: ShieldAlert },
    { id: "taxes", label: langUrdu ? "ٹیکس اور FBR" : "Taxes & FBR", icon: Receipt },
    { id: "credit", label: langUrdu ? "کریڈٹ اسکور" : "Credit Health", icon: CreditCard },
    { id: "license_vehicle", label: langUrdu ? "گاڑیاں اور ڈرائیونگ" : "License & Vehicles", icon: Car },
    { id: "property", label: langUrdu ? "اراضی و جائیداد" : "Property Records", icon: Home },
    { id: "healthcare", label: langUrdu ? "صحت کارڈ و ڈگری" : "Healthcare & Education", icon: HeartPulse },
    { id: "utilities", label: langUrdu ? "یوٹیلیٹی بلز" : "Utility Payments", icon: Building2 },
    { id: "settings", label: langUrdu ? "سیکیورٹی و ترتیبات" : "Security & Settings", icon: Settings },
  ];

  const filteredServices = availableServices.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserInitials = () => {
    if (!user || !user.fullName) return "AK";
    const parts = user.fullName.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 sm:h-20 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs transition-colors">
      {/* Mobile Menu Button & Brand Emblem */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {isAuthenticated && (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            aria-label="Toggle Mobile Navigation Menu"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={onGoHome || (() => handleSelectTab("overview"))}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#01411C] flex items-center justify-center text-white font-bold shadow-sm shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-sm sm:text-lg">
                {langUrdu ? "قومی شہری پورٹل" : "CitizenPortal"}
              </span>
              <span className="inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-[#01411C] dark:bg-emerald-950 dark:text-emerald-300">
                GOV.PK
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
              {langUrdu ? "حکومتِ پاکستان باضابطہ پورٹل" : "National Digital Gateway"}
            </p>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center bg-slate-100 dark:bg-zinc-800 rounded-full px-4 py-2 w-72 lg:w-96 relative">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          placeholder={langUrdu ? "خدمت یا شناختی نمبر تلاش کریں..." : "Search for a service or application ID..."}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
          className="bg-transparent outline-none text-xs sm:text-sm w-full text-slate-900 dark:text-slate-100 placeholder-slate-400"
        />

        {/* Dropdown Results */}
        {showSearchResults && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden z-50 p-2">
            <div className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
              Citizen Services
            </div>
            {filteredServices.length > 0 ? (
              filteredServices.map((service, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleSelectTab(service.tab);
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl flex items-center justify-between transition group"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#01411C]">
                    {service.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#01411C] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    {service.tag}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                No matching service found. Try "Passport" or "Taxes".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center space-x-3">
        {/* Language Switcher */}
        <button
          onClick={onToggleLang}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1 transition"
          title="Toggle Language"
        >
          <Globe className="w-4 h-4 text-[#01411C] dark:text-emerald-400" />
          <span>{langUrdu ? "ENG" : "اردو"}</span>
        </button>

        {/* AI Guide */}
        <button
          onClick={handleAiClick}
          className="p-2 rounded-xl text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center gap-1.5 transition text-xs font-bold border border-emerald-200 dark:border-emerald-800"
          title="AI Assistant"
        >
          <Bot className="w-4 h-4 text-[#01411C] dark:text-emerald-400" />
          <span className="hidden sm:inline">AI Guide</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile Info / Auth Buttons */}
        {isAuthenticated && user ? (
          <div className="relative flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-zinc-800">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {user.fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {user.cnic}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#01411C] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                {getUserInitials()}
              </div>
            </div>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.fullName}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">{user.cnic}</p>
                </div>

                <button
                  onClick={() => {
                    handleSelectTab("settings");
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-xs text-left font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center space-x-2"
                >
                  <Lock className="w-3.5 h-3.5 text-[#01411C]" />
                  <span>Security & Settings</span>
                </button>

                <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />

                <button
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-xs text-left font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenAuth("login")}
              className="px-3.5 py-1.5 text-xs font-bold text-[#01411C] hover:bg-emerald-50 rounded-full transition"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth("signup")}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#01411C] hover:bg-emerald-900 rounded-full shadow-xs transition"
            >
              Register
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 top-16 sm:top-20 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col">
          <div className="bg-[#01411C] text-white p-4 max-h-[85vh] overflow-y-auto space-y-3 shadow-2xl border-b border-emerald-700">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Citizen Portal Services</span>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1 rounded-lg bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-white text-[#01411C] font-bold shadow-md"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#01411C]" : "text-emerald-300"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  handleAiClick();
                  setShowMobileMenu(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/15 text-xs font-bold text-white flex items-center space-x-1.5 hover:bg-white/20 transition"
              >
                <Bot className="w-4 h-4 text-emerald-300" />
                <span>Open AI Assistant</span>
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setShowMobileMenu(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600/80 text-xs font-bold text-white flex items-center space-x-1.5 hover:bg-rose-600 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMobileMenu(false)} />
        </div>
      )}
    </header>
  );
};
