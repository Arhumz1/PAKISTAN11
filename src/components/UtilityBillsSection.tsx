import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Download,
  TrendingUp,
  Home,
  ArrowRight,
  Zap,
  Flame,
  Droplet,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { PropertyRecord, UserProfile, UtilityBill } from "../types";
import { getTodayPakistanDate } from "../utils/pakistanLocations";
import { auth, saveUserProfileToFirestore } from "../lib/firebase";

interface UtilityBillsSectionProps {
  user?: UserProfile;
  properties: PropertyRecord[];
  onSelectTab: (tab: string) => void;
}

export const UtilityBillsSection: React.FC<UtilityBillsSectionProps> = ({
  user,
  properties,
  onSelectTab,
}) => {
  // Compute registration days elapsed using PKT time
  const parsePktDate = (dateStr?: string) => {
    if (!dateStr) return new Date();
    try {
      const parsed = Date.parse(dateStr);
      return isNaN(parsed) ? new Date() : new Date(parsed);
    } catch {
      return new Date();
    }
  };

  const regDate = parsePktDate(user?.registrationDate);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - regDate.getTime());
  const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Base low rates on Day 0 (Registration Day), increasing daily
  const electricityAmount = 1250 + daysElapsed * 145;
  const gasAmount = 380 + daysElapsed * 45;
  const waterAmount = 220 + daysElapsed * 20;

  const initialBills: UtilityBill[] = [
    {
      id: "IESCO-882104",
      serviceType: "Electricity (IESCO)",
      consumerNumber: "14-2201-9812041",
      dueDate: "15-AUG-2026",
      amount: electricityAmount,
      status: "Unpaid",
      billingMonth: "Current Cycle (PKT)",
      unitsConsumed: 85 + daysElapsed * 12,
    },
    {
      id: "SNGPL-331029",
      serviceType: "Gas (SNGPL)",
      consumerNumber: "08-9921-4410298",
      dueDate: "20-AUG-2026",
      amount: gasAmount,
      status: "Unpaid",
      billingMonth: "Current Cycle (PKT)",
      unitsConsumed: 18 + daysElapsed * 3,
    },
    {
      id: "CDA-WATER-104",
      serviceType: "Water (CDA)",
      consumerNumber: "CDA-WTR-99120",
      dueDate: "25-AUG-2026",
      amount: waterAmount,
      status: "Unpaid",
      billingMonth: "Fixed Municipal Rate",
      unitsConsumed: 10,
    },
  ];

  const cnicKey = user?.cnic ? user.cnic.replace(/\D/g, "") : "default";

  const [bills, setBills] = useState<UtilityBill[]>(() => {
    if (cnicKey && cnicKey !== "default") {
      const saved = localStorage.getItem(`citizen_bills_${cnicKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return initialBills;
  });

  React.useEffect(() => {
    if (cnicKey && cnicKey !== "default") {
      const saved = localStorage.getItem(`citizen_bills_${cnicKey}`);
      if (saved) {
        try {
          setBills(JSON.parse(saved));
          return;
        } catch (e) {}
      }
    }
    setBills(initialBills);
  }, [cnicKey]);

  const handlePayBill = (id: string) => {
    const updated = bills.map((b) => (b.id === id ? { ...b, status: "Paid" as const } : b));
    setBills(updated);
    const targetUid = auth.currentUser?.uid || user?.id;
    if (targetUid) {
      saveUserProfileToFirestore(targetUid, { utilityBills: updated }).catch((err) =>
        console.error("Failed to save utility bill to Firestore:", err)
      );
    }
    alert(`Utility Bill #${id} successfully paid via e-Khidmat Gateway! Payment receipt issued.`);
  };

  const consumptionData = [
    { month: "Day 0 (Reg)", Electricity: 85, Gas: 18 },
    { month: "Day 1", Electricity: 97, Gas: 21 },
    { month: "Day 2", Electricity: 109, Gas: 24 },
    { month: "Day 3", Electricity: 121, Gas: 27 },
    { month: "Today (PKT)", Electricity: 85 + daysElapsed * 12, Gas: 18 + daysElapsed * 3 },
  ];

  const hasProperties = properties.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-300 border border-emerald-500/30">
            E-KHIDMAT MUNICIPAL UTILITIES GATEWAY
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">
            Consolidated Utility Bills & Metering
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-xl">
            Real-time municipal utility meters linked to your verified real estate titles. Tracking via Pakistan Standard Time (PKT).
          </p>
        </div>

        <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-mono text-emerald-200 shrink-0">
          <div className="flex items-center space-x-1.5 font-bold">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>PKT Date: {getTodayPakistanDate()}</span>
          </div>
          <p className="text-[10px] text-emerald-300 mt-0.5">Registration Day Elapsed: {daysElapsed} Days</p>
        </div>
      </div>

      {!hasProperties ? (
        /* Empty state when no properties registered */
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <Home className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              No Utility Bills or Meter Connections Found
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Municipal utility meters (Electricity IESCO, Natural Gas SNGPL, CDA Water) are automatically linked to your registered real estate property titles. No property is currently registered under your CNIC.
            </p>
          </div>
          <button
            onClick={() => onSelectTab("property")}
            className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md inline-flex items-center space-x-2 transition"
          >
            <span>Register Property / House Title First</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bills Table */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Active Utility Connections & Invoices</span>
              </h3>
              <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 font-mono">
                Linked to Khasra: {properties[0]?.khasraNo || "Registered Title"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-bold">Dynamic Registration Billing Active (Pakistan Time Tracking):</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Utility bills initialized at base low rates upon account registration ({user?.registrationDate || "Today"}) and scale gradually day by day based on meter consumption in Pakistan.
              </p>
            </div>

            <div className="space-y-3">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{bill.serviceType}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bill.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </div>
                    <p className="text-zinc-500 mt-1">
                      Consumer #: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{bill.consumerNumber}</strong>
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Units: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{bill.unitsConsumed} Units</strong> • Due Date: {bill.dueDate}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                      PKR {bill.amount.toLocaleString()}
                    </span>

                    {bill.status === "Unpaid" ? (
                      <button
                        onClick={() => handlePayBill(bill.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md"
                      >
                        Pay Bill
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Receipt Paid</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consumption Trend Chart */}
          <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2 border-b pb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Daily Consumption Units (PKT)</span>
            </h3>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumptionData}>
                  <XAxis dataKey="month" stroke="#a1a1aa" fontSize={10} />
                  <YAxis stroke="#a1a1aa" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="Electricity" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gas" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border space-y-1 text-xs">
              <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                <span className="flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Electricity (IESCO)</span>
                </span>
                <span className="font-mono font-bold">{85 + daysElapsed * 12} kWh</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                <span className="flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Natural Gas (SNGPL)</span>
                </span>
                <span className="font-mono font-bold">{18 + daysElapsed * 3} HM³</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
