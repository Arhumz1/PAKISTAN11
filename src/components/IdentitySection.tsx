import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  QrCode,
  Users,
  FileText,
  MapPin,
  Sparkles,
  CheckCircle2,
  Lock,
  X,
  Plus,
  Printer,
  Download,
  Fingerprint,
  RefreshCw,
  Globe,
  Home,
} from "lucide-react";
import { UserProfile } from "../types";
import { getRegionalOffices, getTodayPakistanDate } from "../utils/pakistanLocations";

interface IdentitySectionProps {
  user: UserProfile;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({ user }) => {
  const [hologramActive, setHologramActive] = useState(true);

  // Modals state
  const [showFrcModal, setShowFrcModal] = useState(false);
  const [frcStep, setFrcStep] = useState<"form" | "certificate">("form");
  const [frcCategory, setFrcCategory] = useState<"birth" | "marriage">("birth");
  const [familyMembers, setFamilyMembers] = useState<Array<{ name: string; cnic: string; relation: string; age: number }>>([
    { name: user.fatherName || "Father Record", cnic: "61101-9923181-1", relation: "Father", age: 58 },
    { name: user.motherName || "Mother Record", cnic: "61101-8812314-2", relation: "Mother", age: 54 },
    { name: user.fullName, cnic: user.cnic, relation: "Applicant (Self)", age: 28 },
  ]);

  React.useEffect(() => {
    setFamilyMembers([
      { name: user.fatherName || "Father Record", cnic: "61101-9923181-1", relation: "Father", age: 58 },
      { name: user.motherName || "Mother Record", cnic: "61101-8812314-2", relation: "Mother", age: 54 },
      { name: user.fullName, cnic: user.cnic, relation: "Applicant (Self)", age: 28 },
    ]);
  }, [user.fatherName, user.motherName, user.fullName, user.cnic]);
  const [newMember, setNewMember] = useState({ name: "", cnic: "", relation: "Sibling", age: 22 });
  const [frcTrackingId, setFrcTrackingId] = useState("");

  // Service Modals State
  const [activeServiceModal, setActiveServiceModal] = useState<"cnic_renewal" | "nicop" | "address" | "biometric" | null>(null);
  
  // CNIC Renewal Form
  const [cnicRenewalForm, setCnicRenewalForm] = useState({
    reason: "Renewal (Expiry)",
    urgency: "Executive (7 Days)",
    deliveryAddress: user.homeAddress || "Pakistan",
  });
  const [cnicServiceResult, setCnicServiceResult] = useState<string | null>(null);

  // Address Update Form
  const [addressForm, setAddressForm] = useState({
    province: user.province || "ICT Islamabad",
    city: user.city || "Islamabad",
    newAddress: user.homeAddress || "",
  });

  // Biometric Scan State
  const [biometricStatus, setBiometricStatus] = useState<"idle" | "scanning" | "verified">("idle");

  const fallbackOffices = getRegionalOffices(user.province, user.city);
  const passportOff = user.assignedPassportOffice || fallbackOffices.passportOffice;
  const taxOff = user.assignedTaxOffice || fallbackOffices.taxOffice;
  const licenseAuth = user.assignedLicensingAuthority || fallbackOffices.licensingAuthority;
  const utilityProv = user.assignedUtilityProvider || fallbackOffices.utilityProvider;
  const regionalAuth = user.assignedRegionalAuthority || fallbackOffices.regionalAuthority;

  const handleAddFamilyMember = () => {
    if (!newMember.name || !newMember.cnic) {
      alert("Please enter Name and CNIC / B-Form Number for the family member.");
      return;
    }
    setFamilyMembers([...familyMembers, { ...newMember, age: Number(newMember.age) || 20 }]);
    setNewMember({ name: "", cnic: "", relation: "Sibling", age: 22 });
  };

  const handleGenerateFrc = () => {
    const tid = "NADRA-FRC-" + Math.floor(100000 + Math.random() * 900000);
    setFrcTrackingId(tid);
    setFrcStep("certificate");
  };

  const handleBiometricScan = () => {
    setBiometricStatus("scanning");
    setTimeout(() => {
      setBiometricStatus("verified");
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>NATIONAL DATABASE AND REGISTRATION AUTHORITY (NADRA)</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Smart National Identity Credential
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-xl">
            Sovereign digital identity with ICAO compliant chip encryption and biometric authentication.
          </p>
        </div>

        <button
          onClick={() => {
            setFrcStep("form");
            setShowFrcModal(true);
          }}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs transition shadow-md flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Apply Family Certificate (FRC)</span>
        </button>
      </div>

      {/* Identity Card Display & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Holographic CNIC Graphic */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Smart CNIC Holographic View</span>
            </h3>

            <button
              onClick={() => setHologramActive(!hologramActive)}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300"
            >
              Hologram: {hologramActive ? "ON" : "OFF"}
            </button>
          </div>

          <div
            className={`relative h-56 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-5 text-white shadow-xl border border-emerald-500/40 overflow-hidden flex flex-col justify-between ${
              hologramActive ? "ring-2 ring-emerald-400/50" : ""
            }`}
          >
            {hologramActive && (
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-400/10 to-transparent pointer-events-none animate-pulse" />
            )}

            <div className="flex items-center justify-between border-b border-emerald-700/50 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold">
                  PK
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-emerald-200 uppercase">ISLAMIC REPUBLIC OF PAKISTAN</p>
                  <p className="text-[8px] text-emerald-300 font-mono">SMART NATIONAL IDENTITY CARD</p>
                </div>
              </div>
              <QrCode className="w-6 h-6 text-emerald-300" />
            </div>

            <div className="py-2.5 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-emerald-300 uppercase font-semibold">Name</p>
                  <p className="text-sm font-bold text-white tracking-tight">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-300 uppercase font-semibold">Identity No</p>
                  <p className="font-mono font-bold text-emerald-200 text-sm tracking-wider">{user.cnic}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-emerald-800/60">
                <div>
                  <p className="text-[9px] text-emerald-300 uppercase font-semibold">Father Name</p>
                  <p className="text-xs text-emerald-100 font-medium">{user.fatherName || "Not Provided"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-300 uppercase font-semibold">Mother Name</p>
                  <p className="text-xs text-emerald-100 font-medium">{user.motherName || "Not Provided"}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-700/50 text-xs">
              <div>
                <p className="text-[9px] text-emerald-300 uppercase">Identity No</p>
                <p className="font-mono font-bold text-emerald-200 text-sm">{user.cnic}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-emerald-300 uppercase">Status</p>
                <p className="font-bold text-emerald-400 text-xs">VERIFIED & ACTIVE</p>
              </div>
            </div>
          </div>
        </div>

        {/* NADRA Identity Services List */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>NADRA Digital Services</span>
          </h3>

          <div className="space-y-3">
            {[
              {
                title: "Family Registration Certificate (FRC)",
                desc: "Official NADRA document certifying family tree hierarchy and relationships.",
                action: () => {
                  setFrcStep("form");
                  setShowFrcModal(true);
                },
              },
              {
                title: "Smart CNIC Renewal / Duplicate",
                desc: "Request card renewal or lost card duplicate replacement with fast home delivery.",
                action: () => {
                  setCnicServiceResult(null);
                  setActiveServiceModal("cnic_renewal");
                },
              },
              {
                title: "NICOP Overseas Citizen Card",
                desc: "Convert Smart CNIC to Overseas NICOP for dual national privileges.",
                action: () => {
                  setCnicServiceResult(null);
                  setActiveServiceModal("nicop");
                },
              },
              {
                title: "Permanent Address Modification",
                desc: "Update official address and update assigned regional jurisdiction offices.",
                action: () => {
                  setCnicServiceResult(null);
                  setActiveServiceModal("address");
                },
              },
              {
                title: "Biometric Identity Verification",
                desc: "Perform live NADRA biometric fingerprint verification scan for instant clearance.",
                action: () => {
                  setBiometricStatus("idle");
                  setActiveServiceModal("biometric");
                },
              },
            ].map((srv, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between gap-2"
              >
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{srv.title}</h4>
                  <p className="text-[11px] text-zinc-500">{srv.desc}</p>
                </div>
                <button
                  onClick={srv.action}
                  className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] shrink-0"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assigned Regional Offices & Local Jurisdictions */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Citizen Assigned Jurisdictions ({user.city}, {user.province})</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            LOCATION LINKED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Passport Regional Office</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{passportOff}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">FBR Regional Tax Office (RTO)</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{taxOff}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Driving Licensing Authority</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{licenseAuth}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Utility Power & Water Board</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{utilityProv}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Development Authority</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{regionalAuth}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Account Creation Date</span>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
              {user.registrationDate || "Today (Pakistan Standard Time)"}
            </p>
          </div>
        </div>
      </div>

      {/* FULLY FUNCTIONAL FRC MODAL */}
      {showFrcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  NADRA Family Registration Certificate (FRC)
                </h3>
              </div>
              <button onClick={() => setShowFrcModal(false)}>
                <X className="w-5 h-5 text-zinc-400 hover:text-zinc-600" />
              </button>
            </div>

            {frcStep === "form" ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Select FRC Family Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFrcCategory("birth")}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition ${
                        frcCategory === "birth"
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-bold"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold">By Birth</span>
                      <span className="text-[11px] text-zinc-500 font-normal">With Parents & Siblings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrcCategory("marriage")}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition ${
                        frcCategory === "marriage"
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-bold"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold">By Marriage</span>
                      <span className="text-[11px] text-zinc-500 font-normal">With Spouse & Children</span>
                    </button>
                  </div>
                </div>

                {/* Family Members Tree List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-zinc-700 dark:text-zinc-300">
                      Family Members Included in Record ({familyMembers.length})
                    </label>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {familyMembers.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{m.name}</p>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            CNIC: {m.cnic} • {m.relation} ({m.age} Yrs)
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Member Form */}
                <div className="p-3.5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 space-y-2 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">Add Sibling or Dependent Family Member</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    />
                    <input
                      type="text"
                      placeholder="CNIC e.g. 61101-1234567-1"
                      value={newMember.cnic}
                      onChange={(e) => setNewMember({ ...newMember, cnic: e.target.value })}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newMember.relation}
                      onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    >
                      <option value="Sibling">Sibling (Brother / Sister)</option>
                      <option value="Spouse">Spouse (Husband / Wife)</option>
                      <option value="Child">Child (Son / Daughter)</option>
                      <option value="Parent">Parent (Father / Mother)</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddFamilyMember}
                      className="py-2 rounded-xl bg-zinc-800 dark:bg-zinc-700 text-white font-bold flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Family Member</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">NADRA Processing Fee</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Includes e-Khidmat Digital Seal & PDF Certificate</p>
                  </div>
                  <span className="font-mono font-extrabold text-base text-emerald-900 dark:text-emerald-200">PKR 1,000</span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateFrc}
                  className="w-full py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition"
                >
                  Pay PKR 1,000 & Issue Digital FRC Certificate
                </button>
              </div>
            ) : (
              /* OFFICIAL DIGITAL FRC CERTIFICATE VIEW */
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-emerald-950 text-white border-2 border-emerald-500/50 shadow-2xl space-y-4 font-sans relative overflow-hidden">
                  {/* Background Watermark Crest */}
                  <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
                    <ShieldCheck className="w-48 h-48 text-emerald-300" />
                  </div>

                  <div className="flex items-center justify-between border-b border-emerald-700/60 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                        PK
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs tracking-wider text-emerald-200">
                          GOVERNMENT OF PAKISTAN • NADRA
                        </h4>
                        <p className="text-sm font-bold text-white">
                          FAMILY REGISTRATION CERTIFICATE (FRC)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-emerald-300">TRACKING ID</p>
                      <p className="text-xs font-mono font-bold text-emerald-400">{frcTrackingId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-emerald-300 uppercase">Head of Family Applicant</p>
                      <p className="font-bold text-white">{user.fullName}</p>
                      <p className="font-mono text-emerald-200 text-[11px]">{user.cnic}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-300 uppercase">Issue Date (PKT)</p>
                      <p className="font-mono font-bold text-white">{getTodayPakistanDate()}</p>
                      <p className="text-[11px] text-emerald-300">Status: OFFICIAL SEALED</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <p className="text-[10px] font-bold text-emerald-300 uppercase">Verified Family Hierarchy</p>
                    <div className="bg-emerald-900/60 rounded-xl p-2.5 space-y-1.5 text-[11px] border border-emerald-700/50">
                      {familyMembers.map((m, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-emerald-800/50 pb-1 last:border-0 last:pb-0">
                          <span>{m.name} ({m.relation})</span>
                          <span className="font-mono text-emerald-200">{m.cnic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-emerald-700/60 text-[10px] text-emerald-300 font-mono">
                    <QrCode className="w-8 h-8 text-emerald-300" />
                    <span>VERIFIED VIA ICAO-NADRA PKI SOVEREIGN DATABASE</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert(`FRC Certificate #${frcTrackingId} PDF downloaded successfully!`);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF FRC</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-xs flex items-center justify-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NADRA DIGITAL SERVICE MODALS */}
      {activeServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {activeServiceModal === "cnic_renewal" && "Smart CNIC Renewal / Lost Duplicate"}
                {activeServiceModal === "nicop" && "Convert CNIC to Overseas NICOP"}
                {activeServiceModal === "address" && "Permanent Address Modification"}
                {activeServiceModal === "biometric" && "Live Biometric Identity Verification"}
              </span>
              <button onClick={() => setActiveServiceModal(null)}>✕</button>
            </div>

            {cnicServiceResult ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs space-y-3">
                <p className="font-bold text-emerald-900 dark:text-emerald-100">Application Submitted!</p>
                <p className="text-zinc-700 dark:text-zinc-300">{cnicServiceResult}</p>
                <button
                  onClick={() => setActiveServiceModal(null)}
                  className="w-full py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs"
                >
                  Close & Done
                </button>
              </div>
            ) : (
              <>
                {activeServiceModal === "cnic_renewal" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const tid = "NADRA-RN-" + Math.floor(100000 + Math.random() * 900000);
                      setCnicServiceResult(`Smart CNIC Renewal requested under tracking ID ${tid}. Expected delivery in 7 business days to: ${cnicRenewalForm.deliveryAddress}.`);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block font-bold mb-1">Reason for Application</label>
                      <select
                        value={cnicRenewalForm.reason}
                        onChange={(e) => setCnicRenewalForm({ ...cnicRenewalForm, reason: e.target.value })}
                        className="w-full p-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-800"
                      >
                        <option value="Renewal (Expiry)">Renewal due to Expiry</option>
                        <option value="Lost Duplicate">Lost / Stolen Duplicate Card</option>
                        <option value="Damaged Card">Damaged / Broken Chip Replacement</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Processing Priority</label>
                      <select
                        value={cnicRenewalForm.urgency}
                        onChange={(e) => setCnicRenewalForm({ ...cnicRenewalForm, urgency: e.target.value })}
                        className="w-full p-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-800"
                      >
                        <option value="Executive (7 Days)">Executive (PKR 2,500 - 7 Days)</option>
                        <option value="Urgent (15 Days)">Urgent (PKR 1,500 - 15 Days)</option>
                        <option value="Normal (30 Days)">Normal (PKR 750 - 30 Days)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Home Delivery Address</label>
                      <input
                        type="text"
                        value={cnicRenewalForm.deliveryAddress}
                        onChange={(e) => setCnicRenewalForm({ ...cnicRenewalForm, deliveryAddress: e.target.value })}
                        className="w-full p-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-800"
                      />
                    </div>

                    <button type="submit" className="w-full py-3 rounded-2xl bg-emerald-800 text-white font-bold text-xs">
                      Submit & Pay Renewal Fee
                    </button>
                  </form>
                )}

                {activeServiceModal === "nicop" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const tid = "NADRA-NICOP-" + Math.floor(100000 + Math.random() * 900000);
                      setCnicServiceResult(`NICOP Conversion request logged under tracking ID ${tid}. Visa & foreign passport validation initiated.`);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block font-bold mb-1">Overseas Residency Country</label>
                      <input type="text" required placeholder="e.g. United Kingdom / UAE / USA" className="w-full p-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Foreign Passport / Visa #</label>
                      <input type="text" required placeholder="e.g. GB-8821034" className="w-full p-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-800 font-mono" />
                    </div>
                    <button type="submit" className="w-full py-3 rounded-2xl bg-emerald-800 text-white font-bold text-xs">
                      Apply NICOP Card (PKR 4,200)
                    </button>
                  </form>
                )}

                {activeServiceModal === "address" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const offices = getRegionalOffices(addressForm.province, addressForm.city);
                      setCnicServiceResult(`Permanent address updated to ${addressForm.newAddress}, ${addressForm.city}, ${addressForm.province}. Reassigned Passport Office: ${offices.passportOffice}.`);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block font-bold mb-1">Province / Region</label>
                      <select
                        value={addressForm.province}
                        onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                        className="w-full p-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-800"
                      >
                        <option value="ICT Islamabad">ICT Islamabad</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Sindh">Sindh</option>
                        <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="Azad Kashmir">Azad Kashmir</option>
                        <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full p-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">New Home Address</label>
                      <input
                        type="text"
                        required
                        value={addressForm.newAddress}
                        onChange={(e) => setAddressForm({ ...addressForm, newAddress: e.target.value })}
                        className="w-full p-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-800"
                      />
                    </div>

                    <button type="submit" className="w-full py-3 rounded-2xl bg-emerald-800 text-white font-bold text-xs">
                      Update Address & Regional Jurisdictions
                    </button>
                  </form>
                )}

                {activeServiceModal === "biometric" && (
                  <div className="space-y-4 text-center text-xs">
                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border flex flex-col items-center justify-center space-y-3">
                      <Fingerprint className={`w-16 h-16 ${biometricStatus === "verified" ? "text-emerald-500" : biometricStatus === "scanning" ? "text-amber-500 animate-pulse" : "text-emerald-800 dark:text-emerald-400"}`} />
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {biometricStatus === "idle" && "Place Thumb on Scanner"}
                        {biometricStatus === "scanning" && "Scanning Biometric Minutiae..."}
                        {biometricStatus === "verified" && "Biometric Clearance PASSED!"}
                      </p>
                      <p className="text-zinc-500 text-[11px]">
                        CNIC: {user.cnic} • NADRA Bio-Match DB
                      </p>
                    </div>

                    {biometricStatus === "idle" && (
                      <button
                        onClick={handleBiometricScan}
                        className="w-full py-3 rounded-2xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Start Biometric Scan</span>
                      </button>
                    )}

                    {biometricStatus === "verified" && (
                      <button
                        onClick={() => setActiveServiceModal(null)}
                        className="w-full py-3 rounded-2xl bg-emerald-800 text-white font-bold text-xs"
                      >
                        Download Biometric Clearance Certificate
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
