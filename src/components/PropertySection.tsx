import React, { useState } from "react";
import {
  Home,
  FileText,
  Download,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  X,
  PlusCircle,
  Building,
} from "lucide-react";
import { PropertyRecord, UserProfile } from "../types";

interface PropertySectionProps {
  user?: UserProfile;
  isNewAccount?: boolean;
  properties: PropertyRecord[];
  onAddProperty: (newProperty: PropertyRecord) => void;
}

export const PropertySection: React.FC<PropertySectionProps> = ({
  user,
  isNewAccount,
  properties,
  onAddProperty,
}) => {
  const [selectedFard, setSelectedFard] = useState<PropertyRecord | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Property Form State
  const [propForm, setPropForm] = useState({
    khasraNo: "",
    district: "",
    tehsil: "",
    areaSqFt: "",
    propertyType: "Residential Plot" as const,
    ownershipShare: "100% Sole Owner",
    estimatedValue: "",
  });

  const handleRegisterPropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProp: PropertyRecord = {
      khasraNo: propForm.khasraNo || "House/Plot " + Math.floor(100 + Math.random() * 900),
      district: propForm.district || "Islamabad",
      tehsil: propForm.tehsil || "ICT Islamabad",
      areaSqFt: Number(propForm.areaSqFt) || 2250,
      propertyType: propForm.propertyType,
      ownershipShare: propForm.ownershipShare || "100% Sole Owner",
      estimatedValue: Number(propForm.estimatedValue) || 10000000,
    };
    onAddProperty(newProp);
    setPropForm({
      khasraNo: "",
      district: "",
      tehsil: "",
      areaSqFt: "",
      propertyType: "Residential Plot" as const,
      ownershipShare: "100% Sole Owner",
      estimatedValue: "",
    });
    setShowRegisterModal(false);
    alert(`Property ${newProp.khasraNo} successfully registered on E-Zameen Digital Cadastre! Certified digital title generated.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>LAND REVENUE & DIGITAL CADASTRE AUTHORITY (E-ZAMEEN)</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Registered Property Plots, Houses & Digital Fard
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-xl">
            Verified land titles, Khasra records, property acquisitions, and instant Digital Fard certificates.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs transition shadow-md flex items-center space-x-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register / Buy House or Plot</span>
        </button>
      </div>

      {/* Property List / Empty State */}
      {properties.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
          <Home className="w-12 h-12 text-zinc-400 mx-auto" />
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            No Housing Units or Land Holdings Registered Yet
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            You currently have no registered real estate properties or housing titles linked to your CNIC. Click below to register or acquire a house or plot.
          </p>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md"
          >
            Register / Acquire House
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((prop, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <Home className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{prop.khasraNo}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {prop.propertyType}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p><span className="text-zinc-500">District / Tehsil:</span> <strong>{prop.district} ({prop.tehsil})</strong></p>
                <p><span className="text-zinc-500">Area Capacity:</span> <strong>{prop.areaSqFt} Sq. Ft.</strong></p>
                <p><span className="text-zinc-500">Ownership Share:</span> <strong className="text-emerald-700 dark:text-emerald-400">{prop.ownershipShare}</strong></p>
                <p><span className="text-zinc-500">Est. Market Value:</span> <strong className="font-mono text-zinc-900 dark:text-zinc-100">PKR {(prop.estimatedValue / 10000000).toFixed(2)} Crore</strong></p>
              </div>

              <button
                onClick={() => setSelectedFard(prop)}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Generate Certified Digital Fard</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: REGISTER PROPERTY / BUY HOUSE */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <span>Register House / Property Holding (E-Zameen)</span>
              </h3>
              <button onClick={() => setShowRegisterModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleRegisterPropertySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Property Title / Address / Khasra No.
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 14, Street 9, Sector F-11/2 Islamabad"
                  value={propForm.khasraNo}
                  onChange={(e) => setPropForm({ ...propForm, khasraNo: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Property Category
                  </label>
                  <select
                    value={propForm.propertyType}
                    onChange={(e) => setPropForm({ ...propForm, propertyType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
                  >
                    <option value="Residential Plot">Residential Plot / House</option>
                    <option value="Commercial Plaza">Commercial Building / Apartment</option>
                    <option value="Agricultural">Agricultural Land</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    District / Region
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Islamabad or Lahore"
                    value={propForm.district}
                    onChange={(e) => setPropForm({ ...propForm, district: e.target.value, tehsil: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Area Size (Sq. Ft)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2250"
                    value={propForm.areaSqFt}
                    onChange={(e) => setPropForm({ ...propForm, areaSqFt: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Estimated Market Value (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 35000000"
                    value={propForm.estimatedValue}
                    onChange={(e) => setPropForm({ ...propForm, estimatedValue: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono text-emerald-600 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm transition shadow-md"
              >
                Submit Title Registration & Update Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FARD MODAL */}
      {selectedFard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-xs uppercase text-zinc-500">Official E-Zameen Digital Fard</span>
              <button onClick={() => setSelectedFard(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950 text-white text-left font-mono text-xs space-y-2 border border-emerald-600">
              <p className="text-center font-bold text-emerald-400 pb-2 border-b border-emerald-800">
                GOVERNMENT OF PAKISTAN • BOARD OF REVENUE
              </p>
              <p>Record Khasra / Title: <strong>{selectedFard.khasraNo}</strong></p>
              <p>District: <strong>{selectedFard.district}</strong></p>
              <p>Owner Title: <strong>National Citizen Profile (Sole Owner)</strong></p>
              <p>Certified ID: <strong>FARD-2026-891024</strong></p>
            </div>

            <button
              onClick={() => {
                alert("Digital Fard PDF generated & downloaded!");
                setSelectedFard(null);
              }}
              className="w-full py-2.5 rounded-2xl bg-emerald-800 text-white font-bold text-xs"
            >
              Download PDF Fard Statement
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

