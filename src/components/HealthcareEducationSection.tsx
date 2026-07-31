import React, { useState } from "react";
import {
  HeartPulse,
  Hospital,
  MapPin,
  Phone,
  ShieldCheck,
  Award,
  CheckCircle2,
  Search,
  PlusCircle,
  Building,
  X,
  QrCode,
  Download,
  Printer,
  FileCheck,
  Navigation,
  LocateFixed,
  Compass,
  ExternalLink,
  AlertCircle,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { HospitalItem, UserProfile } from "../types";
import { hospitalsData } from "../data/mockData";
import { getTodayPakistanDate } from "../utils/pakistanLocations";
import { auth, saveUserProfileToFirestore } from "../lib/firebase";

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5986, lng: 73.0441 },
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Quetta: { lat: 30.1798, lng: 66.9750 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Faisalabad: { lat: 31.4504, lng: 73.1350 },
};

interface HealthcareEducationSectionProps {
  isNewAccount?: boolean;
  user?: UserProfile;
}

export const HealthcareEducationSection: React.FC<HealthcareEducationSectionProps> = ({
  isNewAccount,
  user,
}) => {
  const cnicKey = user?.cnic ? user.cnic.replace(/\D/g, "") : "default";

  const [searchHospital, setSearchHospital] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    if (cnicKey && cnicKey !== "default") {
      const saved = localStorage.getItem(`citizen_health_edu_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.selectedDistrict !== undefined) return parsed.selectedDistrict;
        } catch (e) {}
      }
    }
    return isNewAccount ? "" : "Islamabad ICT";
  });
  const [isHealthcareActivated, setIsHealthcareActivated] = useState<boolean>(() => {
    if (cnicKey && cnicKey !== "default") {
      const saved = localStorage.getItem(`citizen_health_edu_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isHealthcareActivated !== undefined) return parsed.isHealthcareActivated;
        } catch (e) {}
      }
    }
    return !isNewAccount;
  });
  const [familyMembers, setFamilyMembers] = useState<number>(() => {
    if (cnicKey && cnicKey !== "default") {
      const saved = localStorage.getItem(`citizen_health_edu_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.familyMembers !== undefined) return parsed.familyMembers;
        } catch (e) {}
      }
    }
    return isNewAccount ? 1 : 4;
  });

  const registeredAddress = user?.homeAddress || "House 42, Street 18, Sector F-8/3, Islamabad, Pakistan";
  const registeredCity = user?.city || "Islamabad";
  const registeredCoords = CITY_COORDINATES[registeredCity] || CITY_COORDINATES["Islamabad"];

  // HEC Degree Attestation State
  const [showHecModal, setShowHecModal] = useState(false);
  const [hecFormStep, setHecFormStep] = useState<"form" | "submitted">("form");
  const [attestationForm, setAttestationForm] = useState({
    degreeLevel: "Bachelors (BS / BE / MBBS)",
    institution: "National University of Sciences & Technology (NUST)",
    rollNo: "NUST-2022-CS-9812",
    passingYear: 2024,
    mode: "Urgent Courier (PKR 1,500)",
  });
  
  const [attestedDegrees, setAttestedDegrees] = useState<Array<{
    trackingId: string;
    level: string;
    institution: string;
    rollNo: string;
    year: number;
    status: "Verified & Sealed" | "Under Processing";
  }>>(() => {
    if (cnicKey && cnicKey !== "default") {
      const saved = localStorage.getItem(`citizen_health_edu_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.attestedDegrees)) return parsed.attestedDegrees;
        } catch (e) {}
      }
    }
    return isNewAccount
      ? []
      : [
          {
            trackingId: "HEC-ATT-2024-890124",
            level: "Bachelors (BS CS)",
            institution: "NUST Islamabad",
            rollNo: "NUST-2022-CS-9812",
            year: 2024,
            status: "Verified & Sealed",
          },
        ];
  });

  // Sync state when cnicKey changes
  React.useEffect(() => {
    if (cnicKey && cnicKey !== "default") {
      const saved = localStorage.getItem(`citizen_health_edu_${cnicKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.selectedDistrict !== undefined) setSelectedDistrict(parsed.selectedDistrict);
          if (parsed.isHealthcareActivated !== undefined) setIsHealthcareActivated(parsed.isHealthcareActivated);
          if (parsed.familyMembers !== undefined) setFamilyMembers(parsed.familyMembers);
          if (Array.isArray(parsed.attestedDegrees)) setAttestedDegrees(parsed.attestedDegrees);
          return;
        } catch (e) {}
      }
    }
    setSelectedDistrict(isNewAccount ? "" : "Islamabad ICT");
    setIsHealthcareActivated(!isNewAccount);
    setFamilyMembers(isNewAccount ? 1 : 4);
    setAttestedDegrees(isNewAccount ? [] : [{
      trackingId: "HEC-ATT-2024-890124",
      level: "Bachelors (BS CS)",
      institution: "NUST Islamabad",
      rollNo: "NUST-2022-CS-9812",
      year: 2024,
      status: "Verified & Sealed",
    }]);
  }, [cnicKey]);

  const saveHealthEduData = (
    district: string,
    activated: boolean,
    members: number,
    degrees: typeof attestedDegrees
  ) => {
    const targetUid = auth.currentUser?.uid || user?.id;
    if (targetUid) {
      saveUserProfileToFirestore(targetUid, {
        selectedDistrict: district,
        isHealthcareActivated: activated,
        familyMembers: members,
        attestedDegrees: degrees,
      }).catch((err) => console.error("Error saving health edu data to Firestore:", err));
    }
  };

  const [lastSubmittedDegree, setLastSubmittedDegree] = useState<{
    trackingId: string;
    level: string;
    institution: string;
    rollNo: string;
    year: number;
  } | null>(null);

  const activeCoords = registeredCoords;

  const processedHospitals = hospitalsData.map((h) => {
    let computedDistance = h.distanceKm;
    if (activeCoords && h.lat && h.lng) {
      computedDistance = calculateHaversineDistance(activeCoords.lat, activeCoords.lng, h.lat, h.lng);
    }
    return {
      ...h,
      computedDistance,
    };
  });

  const filteredHospitals = processedHospitals
    .filter((h) => {
      const q = searchHospital.toLowerCase();
      const matchSearch =
        !searchHospital ||
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q);

      const matchDistrict =
        !selectedDistrict || h.city.toLowerCase().includes(selectedDistrict.toLowerCase());

      return matchSearch && matchDistrict;
    })
    .sort((a, b) => a.computedDistance - b.computedDistance);

  const handleActivateHealthcare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict) {
      alert("Please select your district to initialize Sehat Sahulat Card.");
      return;
    }
    setIsHealthcareActivated(true);
    saveHealthEduData(selectedDistrict, true, familyMembers, attestedDegrees);
    alert(`Sehat Sahulat Card successfully activated for ${selectedDistrict}! Annual family limit of PKR 1,000,000 is now live.`);
  };

  const handleApplyAttestationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attestationForm.institution || !attestationForm.rollNo) {
      alert("Please complete the University name and Roll / Registration Number.");
      return;
    }
    const trackingId = "HEC-ATT-" + Math.floor(100000 + Math.random() * 900000);
    const newDeg = {
      trackingId,
      level: attestationForm.degreeLevel,
      institution: attestationForm.institution,
      rollNo: attestationForm.rollNo,
      year: attestationForm.passingYear,
      status: "Verified & Sealed" as const,
    };
    const updatedDegrees = [newDeg, ...attestedDegrees];
    setAttestedDegrees(updatedDegrees);
    setLastSubmittedDegree(newDeg);
    setHecFormStep("submitted");
    saveHealthEduData(selectedDistrict, isHealthcareActivated, familyMembers, updatedDegrees);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>NATIONAL SEHAT SAHULAT PROGRAM & HEC DIGITAL</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Healthcare Coverage & HEC Degree Services
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-xl">
            Universal family health coverage up to PKR 10 Lakhs/year and Higher Education Commission (HEC) degree attestation.
          </p>
        </div>

        <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-md text-right shrink-0">
          <p className="text-[10px] uppercase font-bold text-emerald-300">Sehat Card Family Limit</p>
          <p className="text-lg font-extrabold font-mono text-white">
            {isHealthcareActivated ? "PKR 1,000,000 / Year" : "Setup Required"}
          </p>
        </div>
      </div>

      {/* LOCATION HEALTHCARE SETUP CARD FOR NEW ACCOUNTS */}
      {!isHealthcareActivated && (
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/40 shadow-lg space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Setup Sehat Sahulat Card & Regional Healthcare Plan
              </h3>
              <p className="text-xs text-zinc-500">
                Select your home district location to link with nearest empanelled hospitals and initialize free medical coverage.
              </p>
            </div>
          </div>

          <form onSubmit={handleActivateHealthcare} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Select Home District / Tehsil
              </label>
              <select
                required
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-medium"
              >
                <option value="">-- Choose Your District --</option>
                <option value="Islamabad ICT">Islamabad Capital Territory (ICT)</option>
                <option value="Lahore">Lahore District (Punjab)</option>
                <option value="Rawalpindi">Rawalpindi District (Punjab)</option>
                <option value="Peshawar">Peshawar District (KPK)</option>
                <option value="Karachi">Karachi Central / East (Sindh)</option>
                <option value="Quetta">Quetta District (Balochistan)</option>
                <option value="Gilgit">Gilgit District (Gilgit-Baltistan)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Total Household Family Members
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={familyMembers}
                onChange={(e) => setFamilyMembers(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-mono"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition shadow-md"
              >
                Activate Sehat Card Coverage
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HOSPITALS & HEC SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hospital Empanelled Locator */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <Hospital className="w-4 h-4 text-emerald-600" />
                <span>Empanelled Hospitals Locator</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Showing empanelled hospitals for <span className="font-semibold text-zinc-800 dark:text-zinc-200">{registeredCity}</span>.
              </p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search hospital or city..."
                  value={searchHospital}
                  onChange={(e) => setSearchHospital(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
            </div>
          </div>

          {/* City Badge & Address Header */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 text-emerald-900 dark:text-emerald-200">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold flex items-center space-x-2">
                  <span>Selected City:</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-extrabold">
                    {registeredCity}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1">
                  {registeredAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Embedded Google Maps Section */}
          {(() => {
            const currentMapQuery = searchHospital.trim()
              ? `Hospitals ${searchHospital.trim()}, Pakistan`
              : `Hospitals in ${registeredCity}, Pakistan`;
            const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(currentMapQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
            const directGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentMapQuery)}`;

            const popularCities = ["Islamabad", "Lahore", "Karachi", "Rawalpindi", "Peshawar", "Quetta", "Multan", "Faisalabad"];

            return (
              <div className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-700 text-white font-extrabold text-[11px] tracking-wide uppercase flex items-center space-x-1.5 shadow-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Google Maps</span>
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {currentMapQuery}
                    </span>
                  </div>

                  <a
                    href={directGoogleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 text-blue-600 dark:text-blue-400 font-bold text-xs border border-zinc-200 dark:border-zinc-700 transition flex items-center space-x-1.5 shadow-sm shrink-0"
                  >
                    <span>Open full Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Quick City Selector Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                  <span className="text-zinc-400 font-medium shrink-0">Quick Cities:</span>
                  {popularCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSearchHospital(c)}
                      className={`px-2.5 py-1 rounded-full font-semibold transition shrink-0 ${
                        (searchHospital || registeredCity).toLowerCase().includes(c.toLowerCase())
                          ? "bg-emerald-800 text-white shadow-sm"
                          : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Google Maps Embed iframe */}
                <div className="w-full h-96 sm:h-[450px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md bg-zinc-200 dark:bg-zinc-900 relative">
                  <iframe
                    title="Google Maps Hospital Locator"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={mapEmbedSrc}
                  ></iframe>
                </div>
              </div>
            );
          })()}
        </div>

        {/* HEC Degree Attestation Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>HEC Degree Attestation</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {attestedDegrees.length} Verified
            </span>
          </div>

          {attestedDegrees.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs space-y-2">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                No Attested Degrees Linked Yet
              </p>
              <p className="text-amber-800 dark:text-amber-300">
                Click below to submit your university transcripts and degrees to HEC Pakistan for digital QR attestation.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {attestedDegrees.map((d, i) => (
                <div key={i} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-zinc-900 dark:text-zinc-100">
                    <span>{d.level}</span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px]">{d.institution}</p>
                  <p className="text-[10px] font-mono text-zinc-400">
                    ID: {d.trackingId} • Roll: {d.rollNo}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setHecFormStep("form");
              setShowHecModal(true);
            }}
            className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply New Degree Attestation</span>
          </button>
        </div>
      </div>

      {/* FULLY FUNCTIONAL HEC DEGREE ATTESTATION MODAL */}
      {showHecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  HEC Pakistan Degree Attestation
                </h3>
              </div>
              <button onClick={() => setShowHecModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {hecFormStep === "form" ? (
              <form onSubmit={handleApplyAttestationSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Degree Qualification Level
                  </label>
                  <select
                    value={attestationForm.degreeLevel}
                    onChange={(e) => setAttestationForm({ ...attestationForm, degreeLevel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-medium"
                  >
                    <option value="Bachelors (BS / BE / MBBS)">Bachelors (BS / BE / BBA / MBBS - 16 Yrs)</option>
                    <option value="Masters (MS / MPhil)">Masters (MS / MPhil / MBA - 18 Yrs)</option>
                    <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                    <option value="Intermediate (FSc / A-Levels)">Intermediate / Equivalence (FSc)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    University / Awarding Institution
                  </label>
                  <input
                    type="text"
                    required
                    value={attestationForm.institution}
                    onChange={(e) => setAttestationForm({ ...attestationForm, institution: e.target.value })}
                    placeholder="e.g. NUST, Quaid-i-Azam University, Punjab University"
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Roll / Reg Number
                    </label>
                    <input
                      type="text"
                      required
                      value={attestationForm.rollNo}
                      onChange={(e) => setAttestationForm({ ...attestationForm, rollNo: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Passing Year
                    </label>
                    <input
                      type="number"
                      required
                      value={attestationForm.passingYear}
                      onChange={(e) => setAttestationForm({ ...attestationForm, passingYear: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Attestation Mode & Fee
                  </label>
                  <select
                    value={attestationForm.mode}
                    onChange={(e) => setAttestationForm({ ...attestationForm, mode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-medium"
                  >
                    <option value="Urgent Courier (PKR 1,500)">Urgent Courier Verification (PKR 1,500)</option>
                    <option value="Walk-in HEC Secretariat (PKR 3,000)">Walk-in Urgent HEC Secretariat (PKR 3,000)</option>
                    <option value="Normal Verification (PKR 800)">Normal Postal Verification (PKR 800)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-[11px] text-emerald-800 dark:text-emerald-300">
                  Official HEC e-Attestation uses ICAO cryptographic seals. You will receive an instant digital QR certificate upon payment.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition"
                >
                  Pay Fee & Generate HEC Attestation
                </button>
              </form>
            ) : (
              /* VERIFIED DIGITAL HEC CERTIFICATE DISPLAY */
              <div className="space-y-4">
                {lastSubmittedDegree && (
                  <div className="p-5 rounded-3xl bg-emerald-950 text-white border-2 border-emerald-500/50 shadow-xl space-y-3 relative overflow-hidden font-sans">
                    <div className="flex justify-between items-center border-b border-emerald-700/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="font-extrabold text-[10px] text-emerald-200 uppercase">HIGHER EDUCATION COMMISSION PAKISTAN</p>
                          <p className="font-bold text-xs">DIGITAL DEGREE ATTESTATION</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-300 bg-emerald-800 px-2 py-0.5 rounded">
                        {lastSubmittedDegree.trackingId}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p><span className="text-emerald-300">Degree Level:</span> <strong>{lastSubmittedDegree.level}</strong></p>
                      <p><span className="text-emerald-300">Institution:</span> <strong>{lastSubmittedDegree.institution}</strong></p>
                      <p><span className="text-emerald-300">Roll / Reg #:</span> <strong className="font-mono">{lastSubmittedDegree.rollNo}</strong></p>
                      <p><span className="text-emerald-300">Passing Year:</span> <strong className="font-mono">{lastSubmittedDegree.year}</strong></p>
                      <p><span className="text-emerald-300">Verification Date:</span> <strong className="font-mono">{getTodayPakistanDate()}</strong></p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-emerald-700/60 text-[10px] font-mono">
                      <div className="flex items-center space-x-2 text-emerald-300">
                        <QrCode className="w-6 h-6" />
                        <span>HEC DIGITAL EMBOSSED SEAL</span>
                      </div>
                      <span className="text-emerald-400 font-bold">VERIFIED & SEALED</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => alert(`HEC Digital Attestation Certificate PDF saved!`)}
                    className="flex-1 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download HEC PDF Certificate</span>
                  </button>
                  <button
                    onClick={() => setShowHecModal(false)}
                    className="px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
