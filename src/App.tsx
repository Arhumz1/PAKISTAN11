import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { HeroLanding } from "./components/HeroLanding";
import { AuthModal } from "./components/AuthModal";
import { DashboardOverview } from "./components/DashboardOverview";
import { PassportSection } from "./components/PassportSection";
import { IncomeTaxSection } from "./components/IncomeTaxSection";
import { CreditSection } from "./components/CreditSection";
import { IdentitySection } from "./components/IdentitySection";
import { LicenseVehicleSection } from "./components/LicenseVehicleSection";
import { PropertySection } from "./components/PropertySection";
import { HealthcareEducationSection } from "./components/HealthcareEducationSection";
import { UtilityBillsSection } from "./components/UtilityBillsSection";
import { SettingsSection } from "./components/SettingsSection";
import { AiAssistantDrawer } from "./components/AiAssistantDrawer";
import { NotificationsModal } from "./components/NotificationsModal";

import { ActiveTab, UserProfile, PassportDetails, VehicleRecord, PropertyRecord, TaxFilingRecord } from "./types";
import { initialUserProfile, initialPassportDetails, vehiclesData, propertiesData, taxHistoryData } from "./data/mockData";
import { auth, getUserProfileFromFirestore, saveUserProfileToFirestore } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [langUrdu, setLangUrdu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Modals & Drawers
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login");
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // User Data State
  const [user, setUser] = useState<UserProfile>({
    ...initialUserProfile,
    atlStatus: "INACTIVE",
  });
  const [passport, setPassport] = useState<PassportDetails>({
    passportNumber: "Not Issued",
    bookletType: "36 Pages",
    urgency: "Normal",
    issueDate: "N/A",
    expiryDate: "N/A",
    status: "Not Applied",
    trackingId: "N/A",
    regionalOffice: "Islamabad Regional Passport Office",
  });
  const [isNewAccount, setIsNewAccount] = useState(true);

  // Clean Portal State - Citizen registers their own vehicles, properties, & taxes
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [taxFilings, setTaxFilings] = useState<TaxFilingRecord[]>([]);
  const [declaredIncome, setDeclaredIncome] = useState<number>(0);

  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<{ code?: string; message: string; details?: string } | null>(null);

  const loadUserProfile = useCallback(async (uid: string, fbUser: any) => {
    setIsLoadingProfile(true);
    setLoadError(null);
    try {
      console.log("[Firebase Auth] Retrieving user profile for UID:", uid);
      const firestoreDoc = await getUserProfileFromFirestore(uid);

      if (!firestoreDoc) {
        // Firebase credentials alone must not unlock the portal or create a
        // blank profile. Successful registration/login creates the real record.
        console.info("[Firestore] No portal profile is linked to UID:", uid);
        setIsAuthenticated(false);
        return;
      }

      saveUserProfileToFirestore(uid, { lastLogin: new Date().toISOString() }).catch((err) =>
        console.warn("[Firestore] Non-blocking lastLogin update warning:", err)
      );

      const fullProfile = firestoreDoc as UserProfile;
      setUser({
        ...fullProfile,
        id: uid,
        atlStatus: fullProfile.atlStatus || "INACTIVE",
      });

      if (Array.isArray(fullProfile.vehicles)) setVehicles(fullProfile.vehicles);
      if (Array.isArray(fullProfile.properties)) setProperties(fullProfile.properties);
      if (Array.isArray(fullProfile.taxFilings)) setTaxFilings(fullProfile.taxFilings);
      if (typeof fullProfile.declaredIncome === "number") setDeclaredIncome(fullProfile.declaredIncome);
      if (fullProfile.passport) setPassport(fullProfile.passport);
      if (fullProfile.preferences?.darkMode !== undefined) setDarkMode(fullProfile.preferences.darkMode);
      if (fullProfile.preferences?.langUrdu !== undefined) setLangUrdu(fullProfile.preferences.langUrdu);

      setIsAuthenticated(true);
    } catch (err: any) {
      console.error("[Firestore UserProfile Load Failure]:", {
        code: err?.code,
        message: err?.message,
        stack: err?.stack,
        raw: err,
      });
      setLoadError({
        code: err?.code || "FIRESTORE_FETCH_ERROR",
        message: err?.message || "Failed to load user profile from database.",
        details: err?.stack || String(err),
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Listen to Firebase Auth state change & restore profile strictly from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        console.log("[Firebase Auth] Active authenticated session detected UID:", fbUser.uid);
        await loadUserProfile(fbUser.uid, fbUser);
      } else {
        console.log("[Firebase Auth] No active auth session.");
        setIsAuthenticated(false);
        setIsLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleLoginSuccess = async (loggedInUser: UserProfile, isNew?: boolean) => {
    const targetUid = auth.currentUser?.uid || loggedInUser.id;
    const finalProfile: UserProfile = {
      ...loggedInUser,
      id: targetUid,
      lastLogin: new Date().toISOString(),
    };

    // Save strictly to Firestore users/{uid}
    try {
      await saveUserProfileToFirestore(targetUid, finalProfile);
    } catch (err) {
      console.error("[Firestore] Error saving user profile on login success:", err);
    }

    setUser(finalProfile);
    setIsNewAccount(true);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    try {
      auth.signOut().catch(() => {});
    } catch (e) {}
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    setIsAuthenticated(false);
    setActiveTab("overview");
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    const targetUid = auth.currentUser?.uid || updatedUser.id || user.id;
    const fullUpdatedProfile: UserProfile = {
      ...updatedUser,
      id: targetUid,
    };

    setUser(fullUpdatedProfile);

    // Save updated profile to Firestore immediately
    try {
      await saveUserProfileToFirestore(targetUid, fullUpdatedProfile);
      console.log("[Firestore] Profile updated successfully in Firestore users/" + targetUid);
    } catch (err) {
      console.error("[Firestore Error] Failed to update profile in Firestore:", err);
    }
  };


  // Save account assets helper to Firestore
  const saveUserAssets = async (
    updatedVehicles: VehicleRecord[],
    updatedProperties: PropertyRecord[],
    updatedTaxFilings: TaxFilingRecord[],
    updatedIncome: number,
    updatedPassport?: PassportDetails
  ) => {
    const targetUid = auth.currentUser?.uid || user.id;
    if (!targetUid) return;

    try {
      await saveUserProfileToFirestore(targetUid, {
        vehicles: updatedVehicles,
        properties: updatedProperties,
        taxFilings: updatedTaxFilings,
        declaredIncome: updatedIncome,
        ...(updatedPassport ? { passport: updatedPassport } : {}),
      });
      console.log("[Firestore] Account assets saved to users/" + targetUid);
    } catch (err) {
      console.error("[Firestore Error] Failed to save user assets to Firestore:", err);
    }
  };

  const handleAddVehicle = (newVehicle: VehicleRecord) => {
    setVehicles((prev) => {
      const next = [newVehicle, ...prev];
      saveUserAssets(next, properties, taxFilings, declaredIncome);
      return next;
    });
  };

  const handleUpdateVehicles = (updatedVehicles: VehicleRecord[]) => {
    setVehicles(updatedVehicles);
    saveUserAssets(updatedVehicles, properties, taxFilings, declaredIncome);
  };

  const handleAddProperty = (newProperty: PropertyRecord) => {
    setProperties((prev) => {
      const next = [newProperty, ...prev];
      saveUserAssets(vehicles, next, taxFilings, declaredIncome);
      return next;
    });
  };

  const handleRemoveVehicle = (registrationNo: string) => {
    setVehicles((prev) => {
      const next = prev.filter((v) => v.registrationNo !== registrationNo);
      saveUserAssets(next, properties, taxFilings, declaredIncome);
      return next;
    });
  };

  const handleRemoveProperty = (khasraNo: string) => {
    setProperties((prev) => {
      const next = prev.filter((p) => p.khasraNo !== khasraNo);
      saveUserAssets(vehicles, next, taxFilings, declaredIncome);
      return next;
    });
  };

  const handleFileTaxReturn = (newFiling: TaxFilingRecord) => {
    setTaxFilings((prev) => {
      const next = [newFiling, ...prev];
      const newInc = newFiling.declaredIncome;
      setDeclaredIncome(newInc);
      setUser((u) => ({ ...u, atlStatus: "ACTIVE" }));
      saveUserAssets(vehicles, properties, next, newInc);
      return next;
    });
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? "dark bg-zinc-950 text-zinc-100" : "bg-slate-50 text-zinc-900"}`}>
      {/* Top Navigation Bar */}
      <Navbar
        isAuthenticated={isAuthenticated}
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={() => {
          const next = !darkMode;
          setDarkMode(next);
          const targetUid = auth.currentUser?.uid || user.id;
          if (targetUid) {
            saveUserProfileToFirestore(targetUid, { preferences: { darkMode: next, langUrdu } }).catch(() => {});
          }
        }}
        langUrdu={langUrdu}
        onToggleLang={() => {
          const next = !langUrdu;
          setLangUrdu(next);
          const targetUid = auth.currentUser?.uid || user.id;
          if (targetUid) {
            saveUserProfileToFirestore(targetUid, { preferences: { darkMode, langUrdu: next } }).catch(() => {});
          }
        }}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setShowAuthModal(true);
        }}
        onOpenAi={() => setShowAiDrawer(true)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (!isAuthenticated) {
            setAuthMode("login");
            setShowAuthModal(true);
          }
        }}
      />

      {/* Global Load Error / Recovery Alert */}
      {loadError && (
        <div className="bg-red-50 border-b border-red-200 dark:bg-red-950/40 dark:border-red-900/60 p-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Data Loading Notice ({loadError.code || "ERR"})
                </h4>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                  {loadError.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (auth.currentUser) {
                  loadUserProfile(auth.currentUser.uid, auth.currentUser);
                } else {
                  setLoadError(null);
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!isAuthenticated ? (
        // LANDING PAGE FOR NON-AUTHENTICATED VISITORS
        <main>
          <HeroLanding
            langUrdu={langUrdu}
            onOpenAuth={(mode) => {
              setAuthMode(mode);
              setShowAuthModal(true);
            }}
            onExploreServices={() => {
              setAuthMode("signup");
              setShowAuthModal(true);
            }}
            onOpenAiAssistant={() => setShowAiDrawer(true)}
          />
        </main>
      ) : (
        // AUTHENTICATED CITIZEN DASHBOARD LAYOUT
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
          {/* Collapsible Sidebar (Desktop) */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            langUrdu={langUrdu}
            onOpenAi={() => setShowAiDrawer(true)}
          />

          {/* Mobile Horizontal Scrollable Tab Bar */}
          <div className="lg:hidden flex items-center overflow-x-auto scrollbar-none gap-1.5 px-3 py-2.5 bg-[#01411C] text-white border-b border-emerald-800 shrink-0 select-none">
            {[
              { id: "overview", label: "Dashboard" },
              { id: "passport", label: "Passport" },
              { id: "identity", label: "Smart CNIC" },
              { id: "taxes", label: "FBR Taxes" },
              { id: "credit", label: "Credit Health" },
              { id: "license_vehicle", label: "Vehicles" },
              { id: "property", label: "Property" },
              { id: "healthcare", label: "Health & Edu" },
              { id: "utilities", label: "Utilities" },
              { id: "settings", label: "Settings" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as ActiveTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === t.id
                    ? "bg-white text-[#01411C] shadow-sm"
                    : "text-white/80 hover:bg-white/15"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Views */}
          <main className="flex-1 px-3 py-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 overflow-x-hidden">
            {activeTab === "overview" && (
              <DashboardOverview
                user={user}
                passport={passport}
                onSelectTab={setActiveTab}
                langUrdu={langUrdu}
                isNewAccount={isNewAccount}
                declaredIncome={declaredIncome}
                propertiesCount={properties.length}
                vehiclesCount={vehicles.length}
              />
            )}

            {activeTab === "passport" && (
              <PassportSection
                passport={passport}
                user={user}
                langUrdu={langUrdu}
                onApplyPassport={(updated) => {
                  setPassport(updated);
                  saveUserAssets(vehicles, properties, taxFilings, declaredIncome, updated);
                }}
              />
            )}

            {activeTab === "taxes" && (
              <IncomeTaxSection
                user={user}
                langUrdu={langUrdu}
                isNewAccount={isNewAccount}
                taxFilings={taxFilings}
                onFileTaxReturn={handleFileTaxReturn}
              />
            )}

            {activeTab === "credit" && (
              <CreditSection
                isNewAccount={isNewAccount}
                declaredIncome={declaredIncome}
                propertiesCount={properties.length}
                vehiclesCount={vehicles.length}
              />
            )}

            {activeTab === "identity" && (
              <IdentitySection user={user} />
            )}

            {activeTab === "license_vehicle" && (
              <LicenseVehicleSection
                user={user}
                isNewAccount={isNewAccount}
                vehicles={vehicles}
                onAddVehicle={handleAddVehicle}
                onUpdateVehicles={handleUpdateVehicles}
                onRemoveVehicle={handleRemoveVehicle}
              />
            )}

            {activeTab === "property" && (
              <PropertySection
                user={user}
                isNewAccount={isNewAccount}
                properties={properties}
                onAddProperty={handleAddProperty}
                onRemoveProperty={handleRemoveProperty}
              />
            )}

            {activeTab === "healthcare" && (
              <HealthcareEducationSection isNewAccount={isNewAccount} user={user} />
            )}

            {activeTab === "utilities" && (
              <UtilityBillsSection user={user} properties={properties} onSelectTab={setActiveTab} />
            )}

            {activeTab === "settings" && (
              <SettingsSection user={user} onUpdateUser={handleUpdateUser} />
            )}
          </main>
        </div>
      )}

      {/* Auth Modal (Login / Signup / 2FA) */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authMode}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
        langUrdu={langUrdu}
      />

      {/* Gemini AI Floating Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        langUrdu={langUrdu}
      />

      {/* Official Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
    </div>
  );
}

export default App;
