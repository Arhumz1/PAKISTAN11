import React, { useState, useEffect } from "react";
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
  ShieldCheck,
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
  const cnicKey = user?.cnic ? user.cnic.replace(/\D/g, "") : "default";

  // Helper to parse ownership share percentage (e.g., "100% Sole Owner" -> 100, "50% Share" -> 50)
  const parseOwnershipSharePct = (shareStr?: string): number => {
    if (!shareStr) return 100;
    const match = shareStr.match(/\d+/);
    if (!match) return 100;
    const num = parseInt(match[0], 10);
    return isNaN(num) ? 100 : Math.min(100, Math.max(1, num));
  };

  // Helper to generate monthly bills based on registered properties & ownership share
  const generateMonthlyBills = (propsList: PropertyRecord[]): UtilityBill[] => {
    if (propsList.length === 0) return [];

    const generated: UtilityBill[] = [];

    // Monthly cycle variations for different amounts each month
    const cycles = [
      { monthName: "July 2026 (PKT)", dueDate: "15-JUL-2026", elecMult: 1.0, gasMult: 0.95, wtrMult: 1.0 },
      { monthName: "August 2026 (PKT)", dueDate: "15-AUG-2026", elecMult: 1.18, gasMult: 0.88, wtrMult: 1.08 },
      { monthName: "September 2026 (PKT)", dueDate: "15-SEP-2026", elecMult: 1.08, gasMult: 1.12, wtrMult: 0.96 },
    ];

    propsList.forEach((prop, pIdx) => {
      const sharePct = parseOwnershipSharePct(prop.ownershipShare);
      const shareRatio = sharePct / 100;
      const area = prop.areaSqFt || 2000;
      const cleanKhasra = prop.khasraNo.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || `PROP${pIdx + 1}`;

      cycles.forEach((cycle, cIdx) => {
        // Electricity (IESCO)
        const baseElec = Math.round((2100 + area * 1.5) * shareRatio * cycle.elecMult);
        generated.push({
          id: `IESCO-${cleanKhasra}-M${cIdx + 1}`,
          serviceType: `Electricity (IESCO) - ${prop.khasraNo}`,
          consumerNumber: `14-2201-${100000 + pIdx * 100 + cIdx}`,
          dueDate: cycle.dueDate,
          amount: Math.round(baseElec / 10) * 10,
          status: "Unpaid",
          billingMonth: cycle.monthName,
          unitsConsumed: Math.round((120 + area * 0.08) * cycle.elecMult),
          propertyKhasra: prop.khasraNo,
          ownershipShare: prop.ownershipShare,
        });

        // Gas (SNGPL)
        const baseGas = Math.round((650 + area * 0.4) * shareRatio * cycle.gasMult);
        generated.push({
          id: `SNGPL-${cleanKhasra}-M${cIdx + 1}`,
          serviceType: `Gas (SNGPL) - ${prop.khasraNo}`,
          consumerNumber: `08-9921-${200000 + pIdx * 100 + cIdx}`,
          dueDate: cycle.dueDate,
          amount: Math.round(baseGas / 10) * 10,
          status: "Unpaid",
          billingMonth: cycle.monthName,
          unitsConsumed: Math.round((18 + area * 0.005) * cycle.gasMult),
          propertyKhasra: prop.khasraNo,
          ownershipShare: prop.ownershipShare,
        });

        // Water (CDA / WASA)
        const baseWater = Math.round((350 + area * 0.15) * shareRatio * cycle.wtrMult);
        generated.push({
          id: `WASA-${cleanKhasra}-M${cIdx + 1}`,
          serviceType: `Water & Municipal (CDA) - ${prop.khasraNo}`,
          consumerNumber: `CDA-WTR-${300000 + pIdx * 100 + cIdx}`,
          dueDate: cycle.dueDate,
          amount: Math.round(baseWater / 10) * 10,
          status: "Unpaid",
          billingMonth: cycle.monthName,
          unitsConsumed: 12,
          propertyKhasra: prop.khasraNo,
          ownershipShare: prop.ownershipShare,
        });
      });
    });

    return generated;
  };

  const [bills, setBills] = useState<UtilityBill[]>(() => {
    if (user?.utilityBills && Array.isArray(user.utilityBills) && user.utilityBills.length > 0) {
      return user.utilityBills;
    }
    if (cnicKey && cnicKey !== "default") {
      const saved = localStorage.getItem(`citizen_bills_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return generateMonthlyBills(properties);
  });

  // Keep bills updated when properties change or user profile syncs
  useEffect(() => {
    if (user?.utilityBills && Array.isArray(user.utilityBills) && user.utilityBills.length > 0) {
      setBills(user.utilityBills);
    } else if (properties.length > 0) {
      const generated = generateMonthlyBills(properties);
      setBills((prev) => {
        if (prev.length === 0) return generated;
        // Merge generated missing properties while preserving paid status
        const existingMap = new Map(prev.map((b) => [b.id, b]));
        const merged = generated.map((gen) => {
          const existing = existingMap.get(gen.id);
          return existing || gen;
        });
        return merged;
      });
    }
  }, [properties, user?.utilityBills]);

  const handlePayBill = (id: string) => {
    const now = new Date();
    const pktDateStr = getTodayPakistanDate(); // YYYY-MM-DD
    const pktTimeStr = now.toLocaleTimeString("en-PK", {
      timeZone: "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " PKT";
    const paidAtDisplay = `${pktDateStr} at ${pktTimeStr}`;

    const updated = bills.map((b) =>
      b.id === id
        ? {
            ...b,
            status: "Paid" as const,
            paidAtDate: pktDateStr,
            paidAtTimePKT: pktTimeStr,
            paidAtDisplay,
          }
        : b
    );

    setBills(updated);

    // Save strictly to Firestore user document
    const targetUid = auth.currentUser?.uid || user?.id;
    if (targetUid) {
      saveUserProfileToFirestore(targetUid, { utilityBills: updated })
        .then(() => {
          console.log("[Firestore] Paid utility bill updated & saved to Firestore!");
        })
        .catch((err) => console.error("Error saving paid bill to Firestore:", err));
    }

    if (cnicKey && cnicKey !== "default") {
      localStorage.setItem(`citizen_bills_${cnicKey}`, JSON.stringify(updated));
    }

    alert(`Bill #${id} successfully paid! Receipt timestamped ${paidAtDisplay} in Pakistan and saved to Firestore.`);
  };

  const hasProperties = properties.length > 0;

  // Pakistan Current Date/Time Display
  const currentPktTimeDisplay = new Date().toLocaleTimeString("en-PK", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-300 border border-emerald-500/30">
            E-KHIDMAT MUNICIPAL UTILITIES GATEWAY
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">
            Consolidated Monthly Utility Bills & Metering
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-xl">
            Real-time municipal utility invoices linked to registered real estate property titles. Adjusted strictly according to ownership share percentage and Pakistan Standard Time (PKT).
          </p>
        </div>

        <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-mono text-emerald-200 shrink-0 space-y-1">
          <div className="flex items-center space-x-1.5 font-bold">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>PKT Date: {getTodayPakistanDate()}</span>
          </div>
          <p className="text-[10px] text-emerald-300">Live PKT Time: {currentPktTimeDisplay} PKT</p>
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
              Municipal utility meters (Electricity IESCO, Natural Gas SNGPL, CDA Water) are automatically generated for your registered house and property titles. No property is currently registered under your CNIC.
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
        <div className="space-y-6">
          {/* Summary / Ownership Share Info Banner */}
          <div className="p-4 rounded-2xl bg-emerald-950 text-white border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-300">
                  Monthly Bills Calculated via Property Ownership Share
                </p>
                <p className="text-emerald-200/90 text-[11px] mt-0.5">
                  Showing monthly recurring bills for {properties.length} registered house title(s). Utility charges are scaled directly to your ownership share percentage.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectTab("property")}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition"
            >
              + Register Another House
            </button>
          </div>

          {/* Bills List Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Monthly Recurring Utility Invoices</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                Total Invoices: {bills.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bills.map((bill) => {
                const isPaid = bill.status === "Paid";

                return (
                  <div
                    key={bill.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                      isPaid
                        ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                          {bill.billingMonth}
                        </span>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1">
                          {bill.serviceType}
                        </h4>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          Consumer #: {bill.consumerNumber}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-300"
                        }`}
                      >
                        {isPaid ? "PAID" : "DUE UNPAID"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300 border-t pt-2 border-zinc-200/60 dark:border-zinc-700/60">
                      {bill.ownershipShare && (
                        <p className="text-[11px]">
                          <span className="text-zinc-400">Ownership Share:</span>{" "}
                          <strong className="text-emerald-700 dark:text-emerald-400">{bill.ownershipShare}</strong>
                        </p>
                      )}
                      <p className="text-[11px]">
                        <span className="text-zinc-400">Consumption Units:</span>{" "}
                        <strong>{bill.unitsConsumed} Units</strong> • Due Date: {bill.dueDate}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t pt-2 border-zinc-200/60 dark:border-zinc-700/60">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Due Amount</span>
                        <span className="font-mono font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                          PKR {bill.amount.toLocaleString()}
                        </span>
                      </div>

                      {isPaid ? (
                        <div className="text-right">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center space-x-1 justify-end">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Paid & Saved in Firestore</span>
                          </span>
                          {(bill.paidAtDisplay || bill.paidAtDate) && (
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {bill.paidAtDisplay || `Paid on ${bill.paidAtDate}`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePayBill(bill.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Bill</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
