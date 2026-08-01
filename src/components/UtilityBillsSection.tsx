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

  // Helper to format today's PKT date or any date into DD-MMM-YYYY (e.g., 31-JUL-2026)
  const formatPktDueDate = (dateStr?: string): string => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const dayPadded = String(d.getDate()).padStart(2, "0");
    const monthsAbbr = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${dayPadded}-${monthsAbbr[d.getMonth()]}-${d.getFullYear()}`;
  };

  // Helper to calculate next cycle: paying on July 31 shows next bill issued Aug 31 and due Sep 30
  const getNextCycleInfo = (currentDueDateStr: string, currentBillingMonthStr: string) => {
    const fullMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthsAbbr = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    let dayNum = 31;
    let monthIdx = 6; // July
    let year = 2026;

    if (currentDueDateStr) {
      const parts = currentDueDateStr.split("-");
      if (parts.length === 3) {
        dayNum = parseInt(parts[0], 10) || 31;
        const mIdx = monthsAbbr.indexOf(parts[1].toUpperCase());
        if (mIdx !== -1) monthIdx = mIdx;
        year = parseInt(parts[2], 10) || 2026;
      }
    }

    // Next issue date is 1 month later (e.g., July 31 -> August 31)
    let issueMonthIdx = (monthIdx + 1) % 12;
    let issueYear = monthIdx === 11 ? year + 1 : year;
    const maxDaysInIssueMonth = new Date(issueYear, issueMonthIdx + 1, 0).getDate();
    const issueDay = Math.min(dayNum, maxDaysInIssueMonth);
    const nextIssueDate = `${String(issueDay).padStart(2, "0")}-${monthsAbbr[issueMonthIdx]}-${issueYear}`;
    const nextMonthName = `${fullMonths[issueMonthIdx]} ${issueYear} (PKT)`;

    // Next due date is 1 month after next issue date (e.g., August 31 -> September 30)
    let dueMonthIdx = (issueMonthIdx + 1) % 12;
    let dueYear = issueMonthIdx === 11 ? issueYear + 1 : issueYear;
    const maxDaysInDueMonth = new Date(dueYear, dueMonthIdx + 1, 0).getDate();
    const dueDay = Math.min(issueDay, maxDaysInDueMonth);
    const nextDueDate = `${String(dueDay).padStart(2, "0")}-${monthsAbbr[dueMonthIdx]}-${dueYear}`;

    return { nextMonthName, nextIssueDate, nextDueDate };
  };

  // Helper to generate initial monthly bills for registered properties
  const generateMonthlyBills = (propsList: PropertyRecord[]): UtilityBill[] => {
    if (propsList.length === 0) return [];

    const generated: UtilityBill[] = [];
    const todayDueDate = formatPktDueDate(); // e.g. "31-JUL-2026"

    propsList.forEach((prop, pIdx) => {
      const sharePct = parseOwnershipSharePct(prop.ownershipShare);
      const shareRatio = sharePct / 100;
      const area = prop.areaSqFt || 2000;
      const cleanKhasra = prop.khasraNo.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || `PROP${pIdx + 1}`;

      // Electricity (IESCO)
      const baseElec = Math.round((2100 + area * 1.5) * shareRatio);
      generated.push({
        id: `IESCO-${cleanKhasra}-JUL26`,
        serviceType: `Electricity (IESCO) - ${prop.khasraNo}`,
        consumerNumber: `14-2201-${100000 + pIdx * 100}`,
        issueDate: todayDueDate,
        dueDate: todayDueDate,
        amount: Math.round(baseElec / 10) * 10,
        status: "Unpaid",
        billingMonth: "July 2026 (PKT)",
        unitsConsumed: Math.round(120 + area * 0.08),
        propertyKhasra: prop.khasraNo,
        ownershipShare: prop.ownershipShare,
      });

      // Gas (SNGPL)
      const baseGas = Math.round((650 + area * 0.4) * shareRatio);
      generated.push({
        id: `SNGPL-${cleanKhasra}-JUL26`,
        serviceType: `Gas (SNGPL) - ${prop.khasraNo}`,
        consumerNumber: `08-9921-${200000 + pIdx * 100}`,
        issueDate: todayDueDate,
        dueDate: todayDueDate,
        amount: Math.round(baseGas / 10) * 10,
        status: "Unpaid",
        billingMonth: "July 2026 (PKT)",
        unitsConsumed: Math.round(18 + area * 0.005),
        propertyKhasra: prop.khasraNo,
        ownershipShare: prop.ownershipShare,
      });

      // Water (CDA / WASA)
      const baseWater = Math.round((350 + area * 0.15) * shareRatio);
      generated.push({
        id: `WASA-${cleanKhasra}-JUL26`,
        serviceType: `Water & Municipal (CDA) - ${prop.khasraNo}`,
        consumerNumber: `CDA-WTR-${300000 + pIdx * 100}`,
        issueDate: todayDueDate,
        dueDate: todayDueDate,
        amount: Math.round(baseWater / 10) * 10,
        status: "Unpaid",
        billingMonth: "July 2026 (PKT)",
        unitsConsumed: 12,
        propertyKhasra: prop.khasraNo,
        ownershipShare: prop.ownershipShare,
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
    const pktTimeStr =
      now.toLocaleTimeString("en-PK", {
        timeZone: "Asia/Karachi",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " PKT";
    const paidAtDisplay = `${pktDateStr} at ${pktTimeStr}`;

    const targetBill = bills.find((b) => b.id === id);
    if (!targetBill) return;

    // 1. Mark target bill as Paid
    const updatedBills = bills.map((b) =>
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

    // 2. Calculate details for next month's bill
    const { nextMonthName, nextIssueDate, nextDueDate } = getNextCycleInfo(
      targetBill.dueDate,
      targetBill.billingMonth
    );

    // Check if next month's bill already exists for this consumer number
    const nextBillExists = updatedBills.some(
      (b) =>
        b.consumerNumber === targetBill.consumerNumber &&
        b.billingMonth === nextMonthName
    );

    if (!nextBillExists) {
      // Calculate a slightly varied amount for next month's consumption (±10% variation)
      const randomFactor = 0.92 + Math.random() * 0.18; // 0.92 to 1.10 multiplier
      const nextAmount = Math.max(200, Math.round((targetBill.amount * randomFactor) / 10) * 10);
      const nextUnits = Math.max(10, Math.round(targetBill.unitsConsumed * randomFactor));

      const cleanService = targetBill.serviceType.split("-")[0].replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase();
      const nextBillId = `${cleanService}-${targetBill.consumerNumber.slice(-4)}-${Date.now().toString().slice(-4)}`;

      const newNextBill: UtilityBill = {
        id: nextBillId,
        serviceType: targetBill.serviceType,
        consumerNumber: targetBill.consumerNumber,
        issueDate: nextIssueDate,
        dueDate: nextDueDate,
        amount: nextAmount,
        status: "Unpaid",
        billingMonth: nextMonthName,
        unitsConsumed: nextUnits,
        propertyKhasra: targetBill.propertyKhasra,
        ownershipShare: targetBill.ownershipShare,
      };

      updatedBills.push(newNextBill);
    }

    setBills(updatedBills);

    // 3. Save strictly to Firestore user document
    const targetUid = auth.currentUser?.uid || user?.id;
    if (targetUid) {
      saveUserProfileToFirestore(targetUid, { utilityBills: updatedBills })
        .then(() => {
          console.log("[Firestore] Utility bills updated (Paid + Next Month generated) in Firestore!");
        })
        .catch((err) => console.error("Error saving utility bills to Firestore:", err));
    }

    if (cnicKey && cnicKey !== "default") {
      localStorage.setItem(`citizen_bills_${cnicKey}`, JSON.stringify(updatedBills));
    }

    alert(
      `Bill successfully paid! Timestamped ${paidAtDisplay} in Pakistan and saved to Firestore.\n\nNext bill generated (${nextMonthName}):\n• Issued / Visible: ${nextIssueDate}\n• Due Date: ${nextDueDate}`
    );
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
                      <p className="text-[11px] flex flex-wrap items-center gap-x-1.5">
                        <span><span className="text-zinc-400">Units:</span> <strong>{bill.unitsConsumed}</strong></span>
                        <span className="text-zinc-400">•</span>
                        <span><span className="text-zinc-400">Issued:</span> <strong>{bill.issueDate || bill.dueDate}</strong></span>
                        <span className="text-zinc-400">•</span>
                        <span><span className="text-zinc-400">Due:</span> <strong className="text-emerald-700 dark:text-emerald-400">{bill.dueDate}</strong></span>
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
