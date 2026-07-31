import React, { useState } from "react";
import {
  ShieldCheck,
  FileText,
  Receipt,
  CreditCard,
  Car,
  Home,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  QrCode,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Building2,
  UserCheck,
} from "lucide-react";
import { UserProfile, PassportDetails, ActiveTab } from "../types";

import { calculateCreditScore } from "../utils/creditScore";

interface DashboardOverviewProps {
  user: UserProfile;
  passport: PassportDetails;
  onSelectTab: (tab: ActiveTab) => void;
  langUrdu: boolean;
  isNewAccount?: boolean;
  declaredIncome?: number;
  propertiesCount?: number;
  vehiclesCount?: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  passport,
  onSelectTab,
  langUrdu,
  isNewAccount,
  declaredIncome = 0,
  propertiesCount = 0,
  vehiclesCount = 0,
}) => {
  const [showCnicBack, setShowCnicBack] = useState(false);

  const passportStatusText = passport?.status || "Not Applied";
  const isPassportNotApplied = passportStatusText === "Not Applied";

  const { score, ratingText, creditText, ratingColor, badgeBg } = calculateCreditScore({
    isNewAccount,
    declaredIncome,
    propertiesCount,
    vehiclesCount,
  });

  const scoreText = String(score);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative bg-gradient-to-r from-emerald-800 to-[#01411C] rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {langUrdu ? `السلام علیکم، ${user.fullName}` : `Assalam-u-Alaikum, ${user.fullName}`}
          </h1>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            {isNewAccount
              ? "Welcome to your new digital portal account! All your services are ready to be linked, registered, and managed securely."
              : "Welcome back to your digital portal. You have active verified records and quick access to all public services."}
          </p>
          <div className="pt-3 flex flex-wrap gap-3">
            <button
              onClick={() => onSelectTab("settings")}
              className="bg-white text-emerald-900 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-50 transition"
            >
              Complete Profile
            </button>
            <button
              onClick={() => onSelectTab("passport")}
              className="bg-emerald-700/80 hover:bg-emerald-700 text-white border border-white/20 px-6 py-2.5 rounded-xl font-bold text-sm backdrop-blur-sm transition"
            >
              {isPassportNotApplied ? "Apply for Passport" : "Passport Tracking"}
            </button>
          </div>
        </div>

        {/* Hero Geometric Watermark Graphic */}
        <div className="absolute right-[-5%] top-[-20%] opacity-10 pointer-events-none hidden md:block">
          <svg className="w-96 h-96" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" />
          </svg>
        </div>
      </div>

      {/* Summary Grid: 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Passport Status Card */}
        <div
          onClick={() => onSelectTab("passport")}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Passport Status
                </h3>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{passportStatusText}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {isPassportNotApplied ? (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium">
                Passport not applied yet. Click here to submit your application online.
              </div>
            ) : (
              <>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full mb-3 overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: "65%" }}></div>
                </div>

                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-600">Submission</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Verification</span>
                  <span className="text-slate-300 dark:text-zinc-600">Printing</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Financial Health & Credit Grade */}
        <div
          onClick={() => onSelectTab("credit")}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Financial Health
                </h3>
                <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{ratingText}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-2 space-y-1">
              <div className="relative w-28 h-14 flex items-end justify-center">
                <div className="absolute inset-0 border-t-8 border-l-8 border-r-8 border-emerald-500/40 rounded-t-full"></div>
                <span className="absolute top-7 font-black text-2xl text-slate-900 dark:text-slate-100 font-mono">{scoreText}</span>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeBg} ${ratingColor} leading-tight`}>
                eCIB Clean Record
              </span>
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            State Bank Credit Bureau Integration
          </p>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
              Upcoming Deadlines
            </h3>
            {isNewAccount ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500 text-center">
                No pending deadlines or overdue bills for this account.
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => onSelectTab("taxes")}
                  className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 p-2 rounded-xl transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">
                    14d
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Annual Tax Filing</p>
                    <p className="text-xs text-slate-400">FBR Iris Portal: Open</p>
                  </div>
                </div>

                <div
                  onClick={() => onSelectTab("utilities")}
                  className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 p-2 rounded-xl transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                    22d
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Utility Bill Due</p>
                    <p className="text-xs text-slate-400">Ref: 04 1234 5678901</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Digital Smart CNIC Graphic Banner */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#01411C]" />
            <span>National Identity Credentials (NADRA Verified)</span>
          </h3>
          <button
            onClick={() => setShowCnicBack(!showCnicBack)}
            className="text-xs font-bold text-[#01411C] dark:text-emerald-400 hover:underline"
          >
            {showCnicBack ? "Show Front Side" : "Flip to Back & QR"}
          </button>
        </div>

        <div className="relative h-52 sm:h-56 rounded-3xl bg-gradient-to-br from-emerald-900 via-[#01411C] to-emerald-950 p-6 text-white shadow-xl border border-emerald-500/40 overflow-hidden flex flex-col justify-between max-w-xl mx-auto">
          {!showCnicBack ? (
            <>
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                    PK
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                    ISLAMIC REPUBLIC OF PAKISTAN • SMART CNIC
                  </span>
                </div>
                <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                  VERIFIED
                </span>
              </div>

              <div className="py-2.5 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-emerald-200 uppercase font-semibold">Name</p>
                    <p className="text-base font-bold text-white">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-200 uppercase font-semibold">CNIC Number</p>
                    <p className="font-mono font-bold text-white text-sm tracking-wider">{user.cnic}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/20">
                  <div>
                    <p className="text-[10px] text-emerald-200 uppercase font-semibold">Father Name</p>
                    <p className="text-xs text-emerald-100 font-medium">{user.fatherName || "Not Provided"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-200 uppercase font-semibold">Mother Name</p>
                    <p className="text-xs text-emerald-100 font-medium">{user.motherName || "Not Provided"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div>
                  <p className="text-[9px] text-emerald-200 uppercase">DOB</p>
                  <p className="font-mono font-semibold text-emerald-100 text-xs">{user.dob}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-emerald-200 uppercase">Status</p>
                  <p className="font-bold text-emerald-300 text-xs">VERIFIED CITIZEN</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <span className="text-[11px] font-bold text-emerald-100 uppercase">Address & Digital QR Record</span>
                <span className="text-[9px] font-mono text-emerald-200">NADRA SECURE</span>
              </div>

              <div className="flex items-center justify-between my-2">
                <div className="space-y-1 max-w-xs">
                  <p className="text-[9px] text-emerald-200 uppercase font-semibold">Present Address</p>
                  <p className="text-xs text-white leading-snug">{user.homeAddress}</p>
                </div>

                <div className="p-2 rounded-xl bg-white text-slate-900 flex flex-col items-center shrink-0">
                  <QrCode className="w-12 h-12 text-[#01411C]" />
                  <span className="text-[8px] font-mono font-bold mt-1">SCAN VERIFY</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-emerald-200">
                <span>Blood: {user.bloodGroup || "Not Provided"}</span>
                <span>Province: {user.province}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Services Navigation Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Explore Public Services</h2>
          <button
            onClick={() => onSelectTab("passport")}
            className="text-[#01411C] dark:text-emerald-400 text-sm font-bold hover:underline"
          >
            View All Services →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Vehicle Reg", tab: "license_vehicle" as ActiveTab, icon: Car },
            { label: "Property", tab: "property" as ActiveTab, icon: Home },
            { label: "Healthcare", tab: "healthcare" as ActiveTab, icon: CheckCircle2 },
            { label: "Education", tab: "healthcare" as ActiveTab, icon: UserCheck },
            { label: "Utilities", tab: "utilities" as ActiveTab, icon: Building2 },
          ].map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectTab(srv.tab)}
                className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:shadow-md transition-all text-center group cursor-pointer"
              >
                <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-800 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950 transition">
                  <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-[#01411C] dark:group-hover:text-emerald-400" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{srv.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
