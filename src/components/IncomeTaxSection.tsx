import React, { useState, useEffect } from "react";
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calculator,
  PlusCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Sparkles,
  Search,
  Printer,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TaxFilingRecord, UserProfile } from "../types";
import { fetchApi } from "../lib/api";

interface IncomeTaxSectionProps {
  user?: UserProfile;
  langUrdu: boolean;
  isNewAccount?: boolean;
  taxFilings: TaxFilingRecord[];
  onFileTaxReturn: (filing: TaxFilingRecord) => void;
}

export const IncomeTaxSection: React.FC<IncomeTaxSectionProps> = ({
  user,
  langUrdu,
  isNewAccount,
  taxFilings,
  onFileTaxReturn,
}) => {
  const [incomeInputStr, setIncomeInputStr] = useState<string>(isNewAccount ? "" : "2850000");
  const incomeInput = incomeInputStr === "" ? 0 : Number(incomeInputStr) || 0;
  const [taxCalcResult, setTaxCalcResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const isAtlActive = taxFilings.length > 0;

  // Filing Form Simulator State
  const [filingForm, setFilingForm] = useState({
    taxYear: "TY 2025-2026",
    annualSalary: 0,
    rentalIncome: 0,
    otherIncome: 0,
    taxDeductedAtSource: 0,
    zakatExemption: 0,
  });

  const calculateTaxServer = async (incomeVal: number) => {
    setIsCalculating(true);
    if (incomeVal === 0) {
      setTaxCalcResult({
        annualIncome: 0,
        monthlyIncome: 0,
        annualTax: 0,
        monthlyTax: 0,
        effectiveTaxRate: "0%",
        slabRate: "Exempt (Below 600k)",
        formula: "FBR Standard Salaried Slab",
        netTakeHome: 0,
      });
      setIsCalculating(false);
      return;
    }
    try {
      const data = await fetchApi("/api/services/tax/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annualIncome: incomeVal }),
      });
      setIsCalculating(false);
      setTaxCalcResult(data);
    } catch (err) {
      setIsCalculating(false);
      // Local fallback
      const annualTax = Math.round((incomeVal - 1200000) * 0.15 + 30000);
      setTaxCalcResult({
        annualIncome: incomeVal,
        monthlyIncome: Math.round(incomeVal / 12),
        annualTax: annualTax > 0 ? annualTax : 0,
        monthlyTax: annualTax > 0 ? Math.round(annualTax / 12) : 0,
        effectiveTaxRate: annualTax > 0 ? ((annualTax / incomeVal) * 100).toFixed(1) + "%" : "0%",
        slabRate: "15%",
        formula: "FBR Standard Salaried Slab",
        netTakeHome: Math.round((incomeVal - (annualTax > 0 ? annualTax : 0)) / 12),
      });
    }
  };

  useEffect(() => {
    calculateTaxServer(incomeInput);
  }, [incomeInput]);

  const handleFilingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalInc = (Number(filingForm.annualSalary) || 0) + (Number(filingForm.rentalIncome) || 0) + (Number(filingForm.otherIncome) || 0);
    const newRecord: TaxFilingRecord = {
      taxYear: filingForm.taxYear,
      filingDate: new Date().toISOString().split("T")[0],
      declaredIncome: totalInc,
      taxPaid: Number(filingForm.taxDeductedAtSource) || 0,
      status: "Verified",
      acknowledgementNo: "FBR-IRIS-" + Math.floor(100000 + Math.random() * 900000),
    };

    onFileTaxReturn(newRecord);
    setIncomeInputStr(totalInc.toString());
    setShowFilingModal(false);
    alert(`Tax Return for ${filingForm.taxYear} submitted! Active Taxpayer (ATL) status updated successfully.`);
  };

  const chartData = taxFilings.map((item) => ({
    year: item.taxYear,
    Income: Math.round(item.declaredIncome / 1000), // in Thousands PKR
    TaxPaid: Math.round(item.taxPaid / 1000),
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-300 border border-emerald-500/30">
              FEDERAL BOARD OF REVENUE (FBR)
            </span>
            <span className="text-xs font-mono text-emerald-400">IRIS PORTAL V2.4</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Active Taxpayer List (ATL) Status:{" "}
            <span className={isAtlActive ? "text-emerald-400 underline" : "text-amber-400 underline"}>
              {isAtlActive ? "ACTIVE COMPLIANT" : "INACTIVE (No Returns Filed)"}
            </span>
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-2xl">
            {isAtlActive
              ? "You are officially registered on the Active Taxpayer List. Enjoy 0% non-filing surcharge penalties."
              : "No income returns filed yet. Submit your annual FBR Iris return to activate ATL status and raise your national credit rating."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilingModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs transition shadow-md flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File Income Tax Return</span>
          </button>
          {isAtlActive && (
            <button
              onClick={() => setShowCertificateModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs backdrop-blur-md transition flex items-center space-x-2"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>ATL Certificate</span>
            </button>
          )}
        </div>
      </div>

      {/* Calculator & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Slab Calculator Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>FBR Tax Slab Calculator</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
              TY 2025-2026
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Annual Taxable Gross Income (PKR)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={incomeInputStr}
              onChange={(e) => setIncomeInputStr(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 2,400,000"
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {taxCalcResult && (
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center">
                <span className="text-emerald-950 dark:text-emerald-200 font-semibold">Calculated Annual Tax</span>
                <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-300 font-mono">
                  PKR {taxCalcResult.annualTax?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/50">
                <span className="text-zinc-500">Monthly Tax Deduction</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  PKR {taxCalcResult.monthlyTax?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/50">
                <span className="text-zinc-500">Effective Tax Rate</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {taxCalcResult.effectiveTaxRate}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/50">
                <span className="text-zinc-500">Applicable Tax Slab Rate</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">
                  {taxCalcResult.slabRate}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Est. Net Monthly Take Home</span>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  PKR {taxCalcResult.netTakeHome?.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tax Payment Ledger & Graph */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Historical Declared Income vs Tax Paid (In Thousands PKR)</span>
            </h3>
          </div>

          {taxFilings.length === 0 ? (
            <div className="p-12 text-center space-y-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Receipt className="w-10 h-10 text-zinc-400 mx-auto" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                No Income Tax Returns Filed Yet
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                File your IT-1 Income Tax Return to declare salary/business income and activate your ATL status.
              </p>
              <button
                onClick={() => setShowFilingModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs"
              >
                File Return Now
              </button>
            </div>
          ) : (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="year" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#064e3b",
                        borderColor: "#10b981",
                        borderRadius: "12px",
                        color: "#ffffff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="Income" fill="#059669" radius={[6, 6, 0, 0]} name="Declared Income (k PKR)" />
                    <Bar dataKey="TaxPaid" fill="#10b981" radius={[6, 6, 0, 0]} name="Tax Paid (k PKR)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tax Filings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Tax Year</th>
                      <th className="p-3">Filing Date</th>
                      <th className="p-3">Declared Income</th>
                      <th className="p-3">Tax Paid</th>
                      <th className="p-3">Iris Ack #</th>
                      <th className="p-3 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {taxFilings.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="p-3 font-bold">{row.taxYear}</td>
                        <td className="p-3 text-zinc-500">{row.filingDate}</td>
                        <td className="p-3 font-mono font-semibold">PKR {row.declaredIncome.toLocaleString()}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          PKR {row.taxPaid.toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-zinc-400">{row.acknowledgementNo}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL 1: FILE TAX RETURN */}
      {showFilingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                FBR Iris Annual Tax Return Submission (IT-1 Form)
              </span>
              <button onClick={() => setShowFilingModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleFilingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tax Year Selection
                </label>
                <select
                  value={filingForm.taxYear}
                  onChange={(e) => setFilingForm({ ...filingForm, taxYear: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                >
                  <option value="TY 2025-2026">TY 2025-2026 (Current Active Filing)</option>
                  <option value="TY 2024-2025">TY 2024-2025 (Revised Return)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Annual Salary / Business Income
                  </label>
                  <input
                    type="number"
                    required
                    value={filingForm.annualSalary}
                    onChange={(e) => setFilingForm({ ...filingForm, annualSalary: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Rental / Other Income
                  </label>
                  <input
                    type="number"
                    value={filingForm.rentalIncome}
                    onChange={(e) => setFilingForm({ ...filingForm, rentalIncome: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tax Already Deducted at Source
                  </label>
                  <input
                    type="number"
                    value={filingForm.taxDeductedAtSource}
                    onChange={(e) => setFilingForm({ ...filingForm, taxDeductedAtSource: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-mono text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Zakat / Charity Tax Credit
                  </label>
                  <input
                    type="number"
                    value={filingForm.zakatExemption}
                    onChange={(e) => setFilingForm({ ...filingForm, zakatExemption: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm transition shadow-md"
              >
                Submit Iris Return & Activate ATL
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ATL CERTIFICATE STATEMENT */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-xs uppercase text-zinc-500">Official FBR Active Taxpayer Certificate</span>
              <button onClick={() => setShowCertificateModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-950 text-white space-y-2 text-left font-mono text-xs border border-emerald-600">
              <p className="font-bold text-center text-emerald-400 pb-2 border-b border-emerald-800">
                FEDERAL BOARD OF REVENUE • ISLAMABAD
              </p>
              <p>Registration Name: <strong>National Citizen Profile</strong></p>
              <p>Active Taxpayer Status: <strong className="text-emerald-400">ACTIVE (ATL)</strong></p>
              <p>Filing Category: <strong>Salaried / Individual</strong></p>
              <p>Certificate ID: <strong>FBR-ATL-2026-89012</strong></p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-2xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Certificate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

