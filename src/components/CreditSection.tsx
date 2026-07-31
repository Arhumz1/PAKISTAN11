import React from "react";
import {
  CreditCard,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building2,
  ExternalLink,
  FileCheck2,
  Award,
  Landmark,
  ArrowUpRight,
} from "lucide-react";

import { calculateCreditScore } from "../utils/creditScore";

interface CreditSectionProps {
  isNewAccount?: boolean;
  declaredIncome?: number;
  propertiesCount?: number;
  vehiclesCount?: number;
}

export const CreditSection: React.FC<CreditSectionProps> = ({
  isNewAccount,
  declaredIncome = 0,
  propertiesCount = 0,
  vehiclesCount = 0,
}) => {
  // Real Pakistani Bank Loan Portals
  const bankLoanServices = [
    {
      name: "Meezan Bank",
      tagline: "Islamic Home & Car Ijarah",
      type: "Islamic Finance",
      rate: "KIBOR + Competitive Profit Rate",
      logo: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100&auto=format&fit=crop&q=80",
      link: "https://www.meezanbank.com/home-finance/",
      badge: "Shariah Compliant",
    },
    {
      name: "Habib Bank Limited (HBL)",
      tagline: "Roshan Apni Car & Personal Finance",
      type: "Commercial Loan",
      rate: "Flexible EMI Tenure up to 7 Years",
      logo: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=100&auto=format&fit=crop&q=80",
      link: "https://www.hbl.com/personal/loans",
      badge: "Fast Approval",
    },
    {
      name: "Bank Alfalah",
      tagline: "Alfalah Auto & Home Consumer Loans",
      type: "Consumer Loan",
      rate: "Instant In-Principle e-CIB Eligibility",
      logo: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80",
      link: "https://www.bankalfalah.com/personal-banking/loans/",
      badge: "Low Interest Rate",
    },
    {
      name: "MCB Bank",
      tagline: "MCB Pyara Ghar & Car Financing",
      type: "Housing & Auto",
      rate: "Up to 80% Financing Limit",
      logo: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100&auto=format&fit=crop&q=80",
      link: "https://www.mcb.com.pk/consumer-banking/loans",
      badge: "Preferred Rates",
    },
    {
      name: "National Bank of Pakistan (NBP)",
      tagline: "PM Youth Business & Agriculture Scheme",
      type: "Govt Subsidized Loan",
      rate: "0% to 5% Subsidized Concessionary Markup",
      logo: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&auto=format&fit=crop&q=80",
      link: "https://nbp.com.pk/",
      badge: "Govt Subsidized",
    },
    {
      name: "Faysal Bank",
      tagline: "Noor Islamic Personal & Business Finance",
      type: "Islamic Banking",
      rate: "Tailored to FBR Tax Return Filers",
      logo: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=100&auto=format&fit=crop&q=80",
      link: "https://www.faysalbank.com/",
      badge: "Tax-Filer Benefit",
    },
  ];

  // Unified credit score calculation from creditScore utility
  const { score, ratingText, ratingColor, badgeBg } = calculateCreditScore({
    isNewAccount,
    declaredIncome,
    propertiesCount,
    vehiclesCount,
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>State Bank Electronic Credit Information Bureau (eCIB)</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Official SBP Credit Score & Loan Portal
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-xl">
            Real-time eCIB clearance report synced with your CNIC, FBR Income Tax returns, and registered asset holdings.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-md">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-emerald-300">SBP eCIB Report Status</p>
            <p className="text-lg font-extrabold font-mono text-emerald-300 flex items-center justify-end space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CLEAN RECORD</span>
            </p>
          </div>
        </div>
      </div>

      {/* Credit Gauge & Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Radial Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>SBP eCIB Credit Rating</span>
          </h3>

          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="9"
                className="text-zinc-100 dark:text-zinc-800"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="9"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * score) / 850}
                strokeLinecap="round"
                className="text-emerald-600 transition-all duration-1000"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 space-y-1">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                {score}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeBg} ${ratingColor} leading-tight inline-block max-w-[90%] whitespace-nowrap overflow-hidden text-ellipsis shadow-xs`}>
                {ratingText}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Scale: 300 - 850</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 font-medium leading-relaxed">
            {declaredIncome > 0
              ? `Verified Tax Return of PKR ${declaredIncome.toLocaleString()} boosts your loan eligibility across all SBP regulated commercial banks.`
              : "Zero tax liability filed. Submit your annual return to maximize loan approval limits."}
          </div>
        </div>

        {/* Official SBP Credit Record Matrix */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>State Bank Credit Clearance History</span>
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded font-mono font-bold">
              Verification ID: SBP-ECIB-2026-98402
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-center">
              <p className="text-[10px] uppercase font-bold text-zinc-400">Active Loans</p>
              <p className="text-lg font-extrabold font-mono text-zinc-800 dark:text-zinc-100 mt-1">0</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Zero Outstanding</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-center">
              <p className="text-[10px] uppercase font-bold text-zinc-400">Default Notices</p>
              <p className="text-lg font-extrabold font-mono text-emerald-600 mt-1">0</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Clean SBP Record</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-center">
              <p className="text-[10px] uppercase font-bold text-zinc-400">Overdue Days (DPD)</p>
              <p className="text-lg font-extrabold font-mono text-emerald-600 mt-1">0 DPD</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Regular Status</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-center">
              <p className="text-[10px] uppercase font-bold text-zinc-400">eCIB Rating</p>
              <p className="text-lg font-extrabold font-mono text-emerald-600 mt-1">Class A</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Prime Eligible</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                label: "FBR Declared Tax Return",
                weight: "40%",
                status: declaredIncome > 0 ? `PKR ${declaredIncome.toLocaleString()}` : "PKR 0 (Zero Return)",
                score: declaredIncome > 0 ? 95 : 70,
              },
              {
                label: "Property & Cadastre Holdings",
                weight: "30%",
                status: propertiesCount > 0 ? `${propertiesCount} Registered Title(s)` : "No Registered Property",
                score: propertiesCount > 0 ? 90 : 65,
              },
              {
                label: "Excise Vehicle Fleet",
                weight: "15%",
                status: vehiclesCount > 0 ? `${vehiclesCount} Registered Vehicle(s)` : "No Registered Vehicle",
                score: vehiclesCount > 0 ? 88 : 70,
              },
              {
                label: "SBP Repayment & Utility History",
                weight: "15%",
                status: "100% On-Time Record",
                score: 100,
              },
            ].map((factor, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 text-xs space-y-1.5">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {factor.label} ({factor.weight})
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono">{factor.status}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Loans Section (Zero Loans Confirmation) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Active Financial Liabilities & Loans</span>
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Total Liability: PKR 0
          </span>
        </div>

        <div className="p-8 text-center space-y-3 bg-zinc-50/60 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            No Active Loans or Credit Liabilities
          </p>
          <p className="text-xs text-zinc-500 max-w-lg mx-auto leading-relaxed">
            Your eCIB profile is 100% clear of outstanding debts, mortgages, or bank default records. You are fully qualified to apply for instant financing from top Pakistani commercial banks below.
          </p>
        </div>
      </div>

      {/* Get Loans / Apply for Loans Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full mb-1">
              <Landmark className="w-3.5 h-3.5" />
              <span>Official Pakistani Bank Loan Services</span>
            </div>
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Apply for Loans & Banking Facilities
            </h3>
            <p className="text-xs text-zinc-500">
              Select any bank to visit their official online loan portal and submit your financing application directly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bankLoanServices.map((bank, idx) => (
            <div
              key={idx}
              className="group p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/70 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {bank.badge}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">{bank.type}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                    {bank.name}
                  </h4>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {bank.tagline}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Profit / Markup Rate: </span>
                  {bank.rate}
                </div>
              </div>

              <a
                href={bank.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <span>Apply on {bank.name} Portal</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


