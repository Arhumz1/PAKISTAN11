import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  QrCode,
  MapPin,
  Sparkles,
  Search,
  ArrowRight,
  Printer,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { PassportDetails, PassportTrackingStage, UserProfile } from "../types";
import { passportStages } from "../data/mockData";
import { getTodayPakistanDate, formatPakistanDateDisplay } from "../utils/pakistanLocations";

interface PassportSectionProps {
  passport: PassportDetails;
  user?: UserProfile;
  langUrdu: boolean;
  onApplyPassport?: (updatedPassport: PassportDetails) => void;
}

export const PassportSection: React.FC<PassportSectionProps> = ({ passport, user, langUrdu, onApplyPassport }) => {
  const isNotApplied = passport.status === "Not Applied" || !passport.applicationDate;
  const [activeSubTab, setActiveSubTab] = useState<"details" | "tracking" | "renewal" | "appointment">(
    isNotApplied ? "renewal" : "tracking"
  );
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Renewal / New Application Form State
  const defaultAddress = user?.homeAddress || "House 42, Street 18, Sector F-8/3, Islamabad, Pakistan";
  const [renewalForm, setRenewalForm] = useState({
    applicationType: isNotApplied ? "New Passport (First Issue)" : "Renewal",
    bookletPages: "36 Pages",
    validityYears: "10 Years",
    urgency: "Executive",
    deliveryAddress: defaultAddress,
    regionalOffice: passport.regionalOffice || "Executive Passport Office Sector G-10 Islamabad",
  });

  React.useEffect(() => {
    if (user?.homeAddress) {
      setRenewalForm((prev) => ({
        ...prev,
        deliveryAddress: user.homeAddress,
      }));
    }
  }, [user?.homeAddress]);

  // Appointment Booking State
  const [appointment, setAppointment] = useState({
    office: "Executive Passport Office Sector G-10 Islamabad",
    date: "2026-08-04",
    slot: "10:30 AM - 11:00 AM",
    applicantName: "Muhammad Ali Khan",
    cnic: "61101-8930192-3",
    booked: false,
  });

  // Compute dynamic passport progression based on application date vs current date in Pakistan
  const computeStagesAndStatus = () => {
    if (!passport.applicationDate || passport.status === "Not Applied") {
      return {
        hasApplication: false,
        daysPassed: 0,
        stages: [],
        currentHeadline: "No Active Application",
        currentStatusLabel: "Not Applied",
      };
    }

    const appDateObj = new Date(passport.applicationDate);
    const now = new Date();
    const startOfApp = new Date(appDateObj.getFullYear(), appDateObj.getMonth(), appDateObj.getDate());
    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = startOfNow.getTime() - startOfApp.getTime();
    const daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 3600 * 24)));

    const formatDateStr = (d: Date) => {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const addDays = (base: Date, count: number) => {
      const res = new Date(base);
      res.setDate(res.getDate() + count);
      return res;
    };

    const d0 = formatDateStr(appDateObj);
    const d1 = formatDateStr(addDays(appDateObj, 1));
    const d2 = formatDateStr(addDays(appDateObj, 2));
    const d3 = formatDateStr(addDays(appDateObj, 3));
    const d4 = formatDateStr(addDays(appDateObj, 4));

    const stages: PassportTrackingStage[] = [
      {
        title: "Online Application & Fee Verification",
        date: `${d0} - 10:30 AM`,
        status: "completed",
        description: `Application submitted & fee processed via e-Khidmat Gateway. Tracking ID: #${passport.trackingId}`,
      },
      {
        title: "Biometric & Facial Recognition Scan",
        date: daysPassed >= 1 ? `${d1} - 11:15 AM` : `Scheduled ${d1}`,
        status: daysPassed >= 1 ? "completed" : daysPassed === 0 ? "in_progress" : "upcoming",
        description: daysPassed >= 1
          ? "Biometric fingerprints and 1:1 facial recognition matched with NADRA database."
          : "Awaiting biometric verification at regional office.",
      },
      {
        title: "Security & FIA Record Clearance",
        date: daysPassed >= 2 ? `${d2} - 02:45 PM` : `Scheduled ${d2}`,
        status: daysPassed >= 2 ? "completed" : daysPassed === 1 ? "in_progress" : "upcoming",
        description: daysPassed >= 2
          ? "Security clearance certified by Ministry of Interior and Federal Police Database."
          : "Pending security clearance verification.",
      },
      {
        title: "Laser Engraving & Passport Printing",
        date: daysPassed >= 3 ? `${d3} - 09:00 AM` : `Scheduled ${d3}`,
        status: daysPassed >= 3 ? "completed" : daysPassed === 2 ? "in_progress" : "upcoming",
        description: daysPassed >= 3
          ? "High-security machine-readable document laser engraved and printed at HQ."
          : "Pending print queue at HQ Printing Facility Islamabad.",
      },
      {
        title: "TCS Courier Dispatch & Delivery",
        date: daysPassed >= 4 ? `${d4} - 04:00 PM` : `Expected ${d4}`,
        status: daysPassed >= 4 ? "completed" : daysPassed === 3 ? "in_progress" : "upcoming",
        description: daysPassed >= 4
          ? `Passport dispatched via TCS Courier to registered address (${user?.homeAddress || renewalForm.deliveryAddress}). Handover completed.`
          : `Will be dispatched via TCS Courier to registered delivery address (${user?.homeAddress || renewalForm.deliveryAddress}).`,
      },
    ];

    let headline = "";
    let statusLabel = "";

    if (daysPassed === 0) {
      headline = "Application Submitted • Biometrics Pending (Day 1)";
      statusLabel = "Application Received";
    } else if (daysPassed === 1) {
      headline = "Biometrics Verified • Security Clearance In Progress (Day 2)";
      statusLabel = "Biometrics Verified";
    } else if (daysPassed === 2) {
      headline = "Security Cleared • Passport Printing In Queue (Day 3)";
      statusLabel = "Security Cleared";
    } else if (daysPassed === 3) {
      headline = "Printing Completed • Courier Dispatch Pending (Day 4)";
      statusLabel = "Printing Completed";
    } else {
      headline = "Passport Issued & TCS Courier Dispatched (Complete)";
      statusLabel = "Valid / Issued";
    }

    return {
      hasApplication: true,
      daysPassed,
      stages,
      currentHeadline: headline,
      currentStatusLabel: statusLabel,
    };
  };

  const cycleData = computeStagesAndStatus();

  const calculateFee = () => {
    let base = 5000;
    if (renewalForm.bookletPages === "72 Pages") base += 3000;
    if (renewalForm.bookletPages === "100 Pages") base += 6000;

    if (renewalForm.validityYears === "10 Years") base *= 1.8;

    if (renewalForm.urgency === "Urgent") base += 4000;
    if (renewalForm.urgency === "Executive") base += 9000;

    return Math.round(base);
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setAppointment({ ...appointment, booked: true });
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              DG IMPLICIT & PASSPORTS
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {passport.trackingId ? `Tracking #${passport.trackingId}` : "Status: Not Applied"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            Machine Readable Passport Gateway
          </h2>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
          {[
            { id: "tracking", label: "Live Tracking" },
            { id: "details", label: "Passport Details" },
            { id: "renewal", label: "Online Application" },
            { id: "appointment", label: "Book Appointment" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeSubTab === tab.id
                  ? "bg-[#01411C] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: LIVE 5-STAGE TRACKING PIPELINE */}
      {activeSubTab === "tracking" && (
        <div className="space-y-6">
          {!cycleData.hasApplication ? (
            /* Clean Empty State when No Application Submitted */
            <div className="p-12 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  No Active Passport Application
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Nothing is currently processing. When you submit an application, tracking begins on your application date and progresses step-by-step through the 5-stage lifecycle.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab("renewal")}
                className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md inline-flex items-center space-x-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit Passport Application Now</span>
              </button>
            </div>
          ) : (
            <>
              {/* Status Overview Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border border-emerald-800/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Application Date: {passport.applicationDate} • SLA 4 Days</span>
                  </div>
                  <h3 className="text-xl font-bold">
                    {cycleData.currentHeadline}
                  </h3>
                  <p className="text-xs text-emerald-200/90 font-mono">
                    Tracking ID: {passport.trackingId} • Regional Office: {passport.regionalOffice}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center space-x-2"
                  >
                    <QrCode className="w-4 h-4 text-emerald-300" />
                    <span>Verification QR</span>
                  </button>
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs transition shadow-md flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>

              {/* 5-Stage Timeline Pipeline */}
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Passport Lifecycle (Calculated from Application Date)</span>
                </h3>

                <div className="relative pl-6 border-l-2 border-emerald-200 dark:border-emerald-900 space-y-8">
                  {cycleData.stages.map((stage, idx) => {
                    const isCompleted = stage.status === "completed";
                    const isInProgress = stage.status === "in_progress";
                    return (
                      <div key={idx} className="relative group">
                        {/* Circle Node Indicator */}
                        <div
                          className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                            isCompleted
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : isInProgress
                              ? "bg-amber-500 border-amber-500 text-white animate-pulse"
                              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>

                        <div className="pl-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                              <span>{stage.title}</span>
                              {isInProgress && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                  In Progress
                                </span>
                              )}
                              {isCompleted && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Done
                                </span>
                              )}
                            </h4>
                            <span className="text-xs font-mono text-zinc-400">{stage.date}</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">{stage.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 2: PASSPORT DETAILS */}
      {activeSubTab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Passport Record</span>
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  passport.status === "Not Applied"
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                }`}
              >
                {passport.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/50">
                <span className="text-zinc-500">Passport Number</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{passport.passportNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/50">
                <span className="text-zinc-500">Booklet Capacity</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{passport.bookletType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/50">
                <span className="text-zinc-500">Processing Urgency</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{passport.urgency}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/50">
                <span className="text-zinc-500">Application Date</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">{passport.applicationDate || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/50">
                <span className="text-zinc-500">Expiry Date</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">{passport.expiryDate}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Regional Passport Office</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">{passport.regionalOffice}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-emerald-950 text-white border border-emerald-800/40 shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <h3 className="text-lg font-bold">Biometric Security Standard</h3>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                All Pakistani Machine Readable Passports incorporate ICAO Document 9303 compliant chip encryption, facial recognition, and laser-engraved data pages.
              </p>
            </div>

            <div className="pt-4 border-t border-emerald-800/60">
              {passport.status === "Not Applied" ? (
                <button
                  onClick={() => setActiveSubTab("renewal")}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs transition shadow-md"
                >
                  Apply For Passport
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 text-center text-xs font-bold text-emerald-300">
                  ✓ Passport Application Active & Verified ({passport.status})
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ONLINE PASSPORT RENEWAL WIZARD */}
      {activeSubTab === "renewal" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-2xl mx-auto space-y-6">
          {passport.status !== "Not Applied" && cycleData.hasApplication ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Passport Application Submitted & Profile Complete
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Your Machine Readable Passport application is active and processing through official DGIP channels. All action buttons have been deactivated for your active account.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-mono space-y-1.5 text-zinc-700 dark:text-zinc-300 max-w-sm mx-auto">
                <p>Tracking ID: <strong className="text-emerald-700 dark:text-emerald-400">{passport.trackingId}</strong></p>
                <p>Status: <strong className="text-emerald-700 dark:text-emerald-400">{passport.status}</strong></p>
                <p>Delivery Address: <strong className="text-zinc-900 dark:text-zinc-100">{user?.homeAddress || renewalForm.deliveryAddress}</strong></p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Machine Readable Passport Renewal Application
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Complete details below to submit renewal request directly to DGIP Passport Server.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Booklet Size
                    </label>
                    <select
                      value={renewalForm.bookletPages}
                      onChange={(e) => setRenewalForm({ ...renewalForm, bookletPages: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="36 Pages">36 Pages (Standard Tourist)</option>
                      <option value="72 Pages">72 Pages (Frequent Traveler)</option>
                      <option value="100 Pages">100 Pages (Business Executive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Validity Period
                    </label>
                    <select
                      value={renewalForm.validityYears}
                      onChange={(e) => setRenewalForm({ ...renewalForm, validityYears: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="5 Years">5 Years</option>
                      <option value="10 Years">10 Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Processing Urgency
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "Normal", label: "Normal (10 Days)" },
                      { id: "Urgent", label: "Urgent (5 Days)" },
                      { id: "Executive", label: "Executive (2 Days)" },
                    ].map((urg) => (
                      <button
                        key={urg.id}
                        type="button"
                        onClick={() => setRenewalForm({ ...renewalForm, urgency: urg.id })}
                        className={`p-3 rounded-2xl border text-xs font-bold transition text-center ${
                          renewalForm.urgency === urg.id
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600"
                            : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {urg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Passport Delivery Address
                  </label>
                  <input
                    type="text"
                    value={renewalForm.deliveryAddress}
                    onChange={(e) => setRenewalForm({ ...renewalForm, deliveryAddress: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Fee Breakdown Summary */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                      Calculated Renewal Fee
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Includes e-Khidmat service tax & courier delivery
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-emerald-900 dark:text-emerald-300 font-mono">
                      PKR {calculateFee().toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const todayStr = getTodayPakistanDate();
                    const newTrackingId = "PK-PASS-" + Math.floor(100000 + Math.random() * 900000);
                    const updatedPass: PassportDetails = {
                      passportNumber: passport.passportNumber !== "Not Issued" && passport.passportNumber !== "" ? passport.passportNumber : ("PK" + Math.floor(10000000 + Math.random() * 90000000)),
                      bookletType: renewalForm.bookletPages as any,
                      urgency: renewalForm.urgency as any,
                      issueDate: "Pending Processing",
                      expiryDate: renewalForm.validityYears === "10 Years" ? "2036-08-01" : "2031-08-01",
                      status: "Renewal Pending",
                      trackingId: newTrackingId,
                      regionalOffice: renewalForm.regionalOffice,
                      applicationDate: todayStr,
                    };
                    if (onApplyPassport) {
                      onApplyPassport(updatedPass);
                    }
                    alert(`Passport application submitted successfully on ${todayStr} (Pakistan Standard Time)! Tracking ID: ${newTrackingId}. Fee PKR ${calculateFee().toLocaleString()} processed via e-Khidmat.`);
                    setActiveSubTab("tracking");
                  }}
                  className="w-full py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Application & Pay Fee</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 4: APPOINTMENT BOOKING */}
      {activeSubTab === "appointment" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Book Regional Passport Center Slot
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Select your nearest regional passport office, date, and appointment slot for fast-track biometric verification.
            </p>
          </div>

          {!appointment.booked ? (
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Regional Passport Office
                </label>
                <select
                  value={appointment.office}
                  onChange={(e) => setAppointment({ ...appointment, office: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100"
                >
                  <option value="Executive Passport Office Sector G-10 Islamabad">
                    Executive Passport Office Sector G-10 Islamabad
                  </option>
                  <option value="Regional Passport Office Garden Town Lahore">
                    Regional Passport Office Garden Town Lahore
                  </option>
                  <option value="Executive Passport Counter Saddar Karachi">
                    Executive Passport Counter Saddar Karachi
                  </option>
                  <option value="Passport Office Cantonment Peshawar">
                    Passport Office Cantonment Peshawar
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={appointment.date}
                    onChange={(e) => setAppointment({ ...appointment, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={appointment.slot}
                    onChange={(e) => setAppointment({ ...appointment, slot: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                    <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                    <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                    <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Confirm Appointment Booking</span>
              </button>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div>
                <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                  Appointment Confirmed!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                  Slot Reserved at {appointment.office}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 text-left text-xs space-y-1">
                <p><span className="text-zinc-500">Applicant:</span> <strong className="text-zinc-900 dark:text-zinc-100">{appointment.applicantName}</strong></p>
                <p><span className="text-zinc-500">CNIC:</span> <strong className="font-mono text-zinc-900 dark:text-zinc-100">{appointment.cnic}</strong></p>
                <p><span className="text-zinc-500">Date & Slot:</span> <strong className="text-emerald-700 dark:text-emerald-400">{appointment.date} ({appointment.slot})</strong></p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowQrModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition shadow-sm"
                >
                  Show QR Pass
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: RECEIPT PREVIEW */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Official E-Khidmat Fee Receipt
              </span>
              <button onClick={() => setShowReceiptModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 font-mono text-xs space-y-2 border border-zinc-200 dark:border-zinc-700">
              <div className="text-center font-bold text-emerald-800 dark:text-emerald-400 pb-2 border-b">
                GOVERNMENT OF PAKISTAN • DGIP PASSPORTS
              </div>
              <p>Receipt No: <strong className="text-zinc-900 dark:text-zinc-100">EP-902184-2026</strong></p>
              <p>Applicant: <strong className="text-zinc-900 dark:text-zinc-100">{passport.passportNumber}</strong></p>
              <p>Category: <strong className="text-zinc-900 dark:text-zinc-100">Executive 36-Pages 5-Years</strong></p>
              <p>Fee Paid: <strong className="text-emerald-700 dark:text-emerald-400">PKR 14,000 (PAID)</strong></p>
              <p>Date: <strong className="text-zinc-900 dark:text-zinc-100">18-JUL-2026</strong></p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-zinc-400 uppercase">Official Verification QR</span>
              <button onClick={() => setShowQrModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-950 text-white flex flex-col items-center justify-center">
              <QrCode className="w-32 h-32 text-emerald-400 mb-2" />
              <p className="font-mono font-bold text-xs tracking-wider">PAS-{passport.trackingId}</p>
            </div>

            <p className="text-xs text-zinc-500">
              Present this QR code at Executive Passport Counter for instant biometric intake.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
