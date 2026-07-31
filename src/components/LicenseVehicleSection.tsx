import React, { useState } from "react";
import {
  Car,
  QrCode,
  CheckCircle2,
  PlusCircle,
  ShieldCheck,
  Plus,
  X,
  CreditCard,
  Navigation,
  Wallet,
} from "lucide-react";
import { VehicleRecord, UserProfile } from "../types";
import { auth, saveUserProfileToFirestore } from "../lib/firebase";

interface LicenseVehicleSectionProps {
  user?: UserProfile;
  isNewAccount?: boolean;
  vehicles: VehicleRecord[];
  onAddVehicle: (newVehicle: VehicleRecord) => void;
  onUpdateVehicles?: (vehicles: VehicleRecord[]) => void;
}

export const LicenseVehicleSection: React.FC<LicenseVehicleSectionProps> = ({
  user,
  isNewAccount,
  vehicles,
  onAddVehicle,
  onUpdateVehicles,
}) => {
  const [showLicenseQr, setShowLicenseQr] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMtagModal, setShowMtagModal] = useState(false);

  // M-Tag Recharge Confirmation State
  const [confirmRechargeAmt, setConfirmRechargeAmt] = useState<number | null>(null);
  const [customRechargeInput, setCustomRechargeInput] = useState<string>("");
  const [rechargeSuccessNotice, setRechargeSuccessNotice] = useState<string | null>(null);

  const cnicKey = user?.cnic ? user.cnic.replace(/\D/g, "") : "default";

  const generateUniqueTagId = (key: string) => {
    if (!key || key === "default") {
      return `MTAG-901422-NHA`;
    }
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const positiveCode = Math.abs(hash) % 900000 + 100000;
    return `MTAG-${positiveCode}-NHA`;
  };

  const getDriverLicenseDetails = (u?: UserProfile) => {
    if (u?.driverLicenseExpiry) {
      return {
        expiryDate: u.driverLicenseExpiry,
        licenseNo: u.driverLicenseNumber || `891024`,
      };
    }

    const seed = `${u?.id || ''}_${u?.cnic || ''}_${u?.email || ''}_${u?.mobile || ''}_${u?.fullName || 'citizen'}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const pos = Math.abs(hash);

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = months[pos % 12];

    const years = [2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038];
    const yearIndex = (Math.floor(pos / 12) + (pos % 7)) % years.length;
    const year = years[yearIndex];

    const day = ((pos % 28) + 1).toString().padStart(2, "0");

    const expiryDate = `${day}-${month}-${year}`;
    const licenseNo = `${(pos % 899999) + 100000}`;

    return { expiryDate, licenseNo, month, year };
  };

  const licenseDetails = getDriverLicenseDetails(user);

  const [mtagAccountId, setMtagAccountId] = useState<string>(() => {
    if (cnicKey) {
      const saved = localStorage.getItem(`citizen_mtag_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.tagAccountId) return parsed.tagAccountId;
        } catch (e) {}
      }
    }
    return generateUniqueTagId(cnicKey);
  });

  const [mtagBalance, setMtagBalance] = useState<number>(() => {
    if (cnicKey) {
      const saved = localStorage.getItem(`citizen_mtag_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return typeof parsed.balance === "number" ? parsed.balance : 0;
        } catch (e) {}
      }
    }
    return 0;
  });

  const [mtagActivities, setMtagActivities] = useState<Array<{ title: string; amount: string; date: string }>>(() => {
    if (cnicKey) {
      const saved = localStorage.getItem(`citizen_mtag_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed.activities) ? parsed.activities : [];
        } catch (e) {}
      }
    }
    return [];
  });

  // Sync M-Tag data when active account changes
  React.useEffect(() => {
    if (cnicKey) {
      const saved = localStorage.getItem(`citizen_mtag_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMtagBalance(typeof parsed.balance === "number" ? parsed.balance : 0);
          setMtagActivities(Array.isArray(parsed.activities) ? parsed.activities : []);
          setMtagAccountId(parsed.tagAccountId || generateUniqueTagId(cnicKey));
          return;
        } catch (e) {}
      }
    }
    setMtagBalance(0);
    setMtagActivities([]);
    setMtagAccountId(generateUniqueTagId(cnicKey));
  }, [cnicKey]);

  const handleRechargeMtag = (amt: number) => {
    const newBalance = mtagBalance + amt;
    const newAct = {
      title: "Account Recharge",
      amount: `+PKR ${amt.toLocaleString()}`,
      date: new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    };
    const newActivities = [newAct, ...mtagActivities];

    setMtagBalance(newBalance);
    setMtagActivities(newActivities);

    const targetUid = auth.currentUser?.uid || user?.id;
    if (targetUid) {
      saveUserProfileToFirestore(targetUid, {
        mtagBalance: newBalance,
        mtagActivities: newActivities,
        mtagAccountId,
      }).catch((err) => console.error("Error saving M-Tag balance to Firestore:", err));
    }
  };

  // Token Tax Modal State
  const [selectedTaxVehicle, setSelectedTaxVehicle] = useState<VehicleRecord | null>(null);
  const [taxPaidReceipt, setTaxPaidReceipt] = useState<{ psaid: string; date: string; amount: number } | null>(null);

  // New Vehicle Form State
  const [vehicleForm, setVehicleForm] = useState({
    registrationNo: "",
    makeModel: "Toyota Corolla 1.8",
    year: 2024,
    engineCc: 1800,
    chassisNo: "",
  });

  const calculateTokenTax = (engineCc: number) => {
    if (engineCc <= 1000) return 1800;
    if (engineCc <= 1300) return 2800;
    if (engineCc <= 1800) return 4500;
    return 7500;
  };

  const handleOpenTokenTaxModal = (vehicle: VehicleRecord) => {
    setSelectedTaxVehicle(vehicle);
    setTaxPaidReceipt(null);
  };

  const handleConfirmPayTokenTax = () => {
    if (!selectedTaxVehicle) return;
    const taxAmount = calculateTokenTax(selectedTaxVehicle.engineCc);
    const updated = vehicles.map((v) =>
      v.registrationNo === selectedTaxVehicle.registrationNo
        ? { ...v, tokenTaxPaidUntil: "30-JUN-2028", status: "Clear" as const }
        : v
    );
    if (onUpdateVehicles) {
      onUpdateVehicles(updated);
    }
    const psaid = "PSID-ICT-" + Math.floor(10000000 + Math.random() * 90000000);
    setTaxPaidReceipt({
      psaid,
      date: new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }),
      amount: taxAmount,
    });
  };

  const handleRegisterVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.registrationNo) {
      alert("Please enter a valid Registration Number (e.g. ICT-LE-8821)");
      return;
    }
    const newVeh: VehicleRecord = {
      registrationNo: vehicleForm.registrationNo.toUpperCase(),
      chassisNo: vehicleForm.chassisNo || "NHA-CHS-" + Math.floor(100000 + Math.random() * 900000),
      makeModel: vehicleForm.makeModel,
      year: vehicleForm.year,
      tokenTaxPaidUntil: "30-JUN-2027",
      status: "Clear",
      engineCc: vehicleForm.engineCc,
    };
    onAddVehicle(newVeh);
    setShowRegisterModal(false);
    alert(`Vehicle ${newVeh.registrationNo} successfully registered under Excise & Taxation portal!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXCISE, TAXATION & MOTORWAY TOLL POLICE</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Digital Driving License, Vehicles & Tolls
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-xl">
            Register vehicles, pay Excise token taxes, and manage M-Tag highway toll passes instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs transition shadow-md flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Vehicle</span>
          </button>

          <button
            onClick={() => setShowMtagModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs backdrop-blur-md transition flex items-center space-x-2"
          >
            <Navigation className="w-4 h-4 text-emerald-300" />
            <span>M-Tag Highway Tolls</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Driving License Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Car className="w-4 h-4 text-emerald-600" />
              <span>Digital Driving License</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              LTV VALID
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950 text-white space-y-2 text-xs">
            <p className="text-[10px] uppercase font-bold text-emerald-400">ICT Police License # {licenseDetails.licenseNo}</p>
            <p className="text-sm font-bold">{user?.fullName || "National Citizen Profile"}</p>
            <p className="text-[11px] text-emerald-200">Categories: Motor Car / LTV</p>
            <p className="text-[11px] text-emerald-200 font-semibold">Valid Until: <span className="font-mono text-emerald-300 font-bold">{licenseDetails.expiryDate}</span></p>
          </div>

          <button
            onClick={() => setShowLicenseQr(!showLicenseQr)}
            className="w-full py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>{showLicenseQr ? "Hide License QR" : "Show Traffic QR"}</span>
          </button>

          {showLicenseQr && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center space-y-2 border">
              <QrCode className="w-24 h-24 text-emerald-900 dark:text-emerald-300 mx-auto" />
              <p className="text-[10px] font-mono text-zinc-500">Scan code during ICT Traffic inspection</p>
            </div>
          )}
        </div>

        {/* Registered Vehicles Table */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Car className="w-4 h-4 text-emerald-600" />
              <span>Registered Vehicles & Token Tax Status</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
              {vehicles.length} Registered
            </span>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-8 text-center space-y-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Car className="w-10 h-10 text-zinc-400 mx-auto" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                No vehicles registered on this citizen profile yet.
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Click "Register New Vehicle" above to link a motor vehicle or motorcycle to your CNIC.
              </p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs"
              >
                Register a Vehicle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {v.registrationNo}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {v.engineCc} CC
                      </span>
                    </div>
                    <p className="text-zinc-500 mt-1">
                      {v.makeModel} ({v.year}) • Chassis #{v.chassisNo}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                      Token Tax Valid Until: {v.tokenTaxPaidUntil}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenTokenTaxModal(v)}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shrink-0 flex items-center space-x-1.5 shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Token Tax (PKR {calculateTokenTax(v.engineCc).toLocaleString()})</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: REGISTER NEW VEHICLE */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Register New Vehicle (Excise Portal)
              </h3>
              <button onClick={() => setShowRegisterModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleRegisterVehicleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Registration / Number Plate
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICT-LE-9012 or LEB-2024-4411"
                  value={vehicleForm.registrationNo}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNo: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Make & Model
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.makeModel}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, makeModel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Model Year
                  </label>
                  <input
                    type="number"
                    required
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Engine Displacement (CC)
                  </label>
                  <input
                    type="number"
                    required
                    value={vehicleForm.engineCc}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, engineCc: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Chassis Serial #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NHA-CHS-881920"
                    value={vehicleForm.chassisNo}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, chassisNo: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm transition shadow-md"
              >
                Complete Vehicle Registration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: M-TAG HIGHWAY TOLL PORTAL */}
      {showMtagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-emerald-600" />
                <span>NHA M-Tag Highway Toll Portal</span>
              </h3>
              <button onClick={() => {
                setShowMtagModal(false);
                setConfirmRechargeAmt(null);
                setRechargeSuccessNotice(null);
              }}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {rechargeSuccessNotice && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{rechargeSuccessNotice}</span>
                </div>
                <button onClick={() => setRechargeSuccessNotice(null)}>
                  <X className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-emerald-950 text-white space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center border-b border-emerald-800 pb-2">
                <span className="text-emerald-400 uppercase font-bold">M-Tag Account Status</span>
                <span className="px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 text-[10px]">ACTIVE</span>
              </div>
              <p>Tag Account ID: <strong className="text-emerald-300 font-mono">{mtagAccountId}</strong></p>
              <p className="text-lg font-bold text-emerald-300 pt-1">
                Current Balance: PKR {mtagBalance.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-zinc-700 dark:text-zinc-300">Quick Recharge M-Tag Balance:</p>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setRechargeSuccessNotice(null);
                      setConfirmRechargeAmt(amt);
                    }}
                    className="py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold font-mono text-emerald-800 dark:text-emerald-300 transition text-center border border-zinc-200 dark:border-zinc-700"
                  >
                    +PKR {amt}
                  </button>
                ))}
              </div>

              {/* Custom amount entry */}
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Or Enter Custom Recharge Amount (PKR)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="100"
                    placeholder="e.g. 1500"
                    value={customRechargeInput}
                    onChange={(e) => setCustomRechargeInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseInt(customRechargeInput, 10);
                      if (!parsed || parsed <= 0) {
                        alert("Please enter a valid recharge amount (minimum PKR 100)");
                        return;
                      }
                      setRechargeSuccessNotice(null);
                      setConfirmRechargeAmt(parsed);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition"
                  >
                    Add Money
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs space-y-1.5 border border-zinc-200 dark:border-zinc-700">
              <p className="font-bold text-zinc-800 dark:text-zinc-200">Recent Toll Activity:</p>
              {mtagActivities.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic">No recent toll activity recorded for this account.</p>
              ) : (
                mtagActivities.map((act, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/50 pb-1 last:border-0 last:pb-0">
                    <div>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{act.title}</span>
                      <span className="block text-[10px] text-zinc-400">{act.date}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{act.amount}</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setShowMtagModal(false);
                setConfirmRechargeAmt(null);
                setRechargeSuccessNotice(null);
              }}
              className="w-full py-2.5 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-bold text-xs transition"
            >
              Close M-Tag Portal
            </button>
          </div>
        </div>
      )}

      {/* RECHARGE CONFIRMATION DIALOG */}
      {confirmRechargeAmt !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-800">
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Confirm M-Tag Recharge
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Are you sure you want to add funds to your National Highway Authority M-Tag balance?
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs space-y-2 font-sans">
              <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                <span>M-Tag Account ID</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{mtagAccountId}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                <span>Current Balance</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">PKR {mtagBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold pt-1 border-t border-zinc-200 dark:border-zinc-700">
                <span>Recharge Amount</span>
                <span className="font-mono text-base">+PKR {confirmRechargeAmt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                <span>New Expected Balance</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">PKR {(mtagBalance + confirmRechargeAmt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-500 text-[11px]">
                <span>Payment Channel</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">1Link / e-Khidmat Wallet</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const amt = confirmRechargeAmt;
                  handleRechargeMtag(amt);
                  setConfirmRechargeAmt(null);
                  setCustomRechargeInput("");
                  setRechargeSuccessNotice(`Successfully added PKR ${amt.toLocaleString()} to your M-Tag balance.`);
                }}
                className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Load PKR {confirmRechargeAmt.toLocaleString()}</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmRechargeAmt(null)}
                className="w-full py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCISE TOKEN TAX PAYMENT */}
      {selectedTaxVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Excise Token Tax Payment
                </h3>
              </div>
              <button onClick={() => setSelectedTaxVehicle(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {taxPaidReceipt ? (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs space-y-3">
                <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-100 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Token Tax Successfully Cleared!</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  <p>Vehicle Reg: <strong>{selectedTaxVehicle.registrationNo}</strong></p>
                  <p>Payment PSID: <strong>{taxPaidReceipt.psaid}</strong></p>
                  <p>Paid Amount: <strong>PKR {taxPaidReceipt.amount.toLocaleString()}</strong></p>
                  <p>Tax Paid Date: <strong>{taxPaidReceipt.date}</strong></p>
                  <p className="text-emerald-800 dark:text-emerald-300 font-bold">New Tax Validity: 30-JUN-2028</p>
                </div>
                <button
                  onClick={() => setSelectedTaxVehicle(null)}
                  className="w-full py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs"
                >
                  Done & Close Receipt
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Vehicle Registration</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{selectedTaxVehicle.registrationNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Make & Engine</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedTaxVehicle.makeModel} ({selectedTaxVehicle.engineCc} CC)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Chassis No</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">{selectedTaxVehicle.chassisNo}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-sm">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">Annual Token Tax Due</span>
                    <span className="font-mono font-extrabold text-emerald-800 dark:text-emerald-300">
                      PKR {calculateTokenTax(selectedTaxVehicle.engineCc).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Select E-Khidmat Gateway
                  </label>
                  <select className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-semibold">
                    <option>1Link e-Khidmat ICT (Bank Transfer)</option>
                    <option>JazzCash / EasyPaisa Wallet</option>
                    <option>Debit / Credit Card (Visa/MasterCard)</option>
                  </select>
                </div>

                <button
                  onClick={handleConfirmPayTokenTax}
                  className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition"
                >
                  Pay PKR {calculateTokenTax(selectedTaxVehicle.engineCc).toLocaleString()} Token Tax Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

