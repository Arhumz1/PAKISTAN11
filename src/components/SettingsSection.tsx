import React, { useState } from "react";
import {
  User,
  Shield,
  Key,
  Smartphone,
  Eye,
  CheckCircle2,
  Lock,
  Globe,
} from "lucide-react";
import { UserProfile } from "../types";
import { CountryPhoneInput } from "./CountryPhoneInput";

interface SettingsSectionProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  user,
  onUpdateUser,
}) => {
  const [formData, setFormData] = useState(user);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Citizen Profile & Security Preferences
            </h3>
            <p className="text-xs text-zinc-500">
              Manage personal details, 2FA security, and active government portal sessions.
            </p>
          </div>

          {savedSuccess && (
            <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile Saved</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                CNIC Number (Locked)
              </label>
              <input
                type="text"
                disabled
                value={formData.cnic}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Mobile Number
              </label>
              <CountryPhoneInput
                value={formData.mobile}
                onChange={(fullNumber) => setFormData({ ...formData, mobile: fullNumber })}
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Father / Guardian Name
              </label>
              <input
                type="text"
                value={formData.fatherName || ""}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                placeholder="e.g. Tariq Mahmood Khan"
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Mother's Legal Name
              </label>
              <input
                type="text"
                value={formData.motherName || ""}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                placeholder="e.g. Parveen Begum"
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Occupation
              </label>
              <input
                type="text"
                value={formData.occupation || ""}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g. Software Engineer"
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Marital Status
              </label>
              <select
                value={formData.maritalStatus || "Single"}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup || ""}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob || ""}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Province / Region
              </label>
              <select
                value={formData.province || "ICT Islamabad"}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              >
                <option value="ICT Islamabad">ICT Islamabad</option>
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                District / City
              </label>
              <input
                type="text"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Islamabad"
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Residential Home Address
            </label>
            <input
              type="text"
              value={formData.homeAddress}
              onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
            />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs"
            >
              Update Profile Details
            </button>
          </div>
        </form>

        {/* 2FA Security Switch */}
        <div className="pt-4 border-t space-y-4">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Two-Factor Authentication (2FA)</span>
          </h4>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border flex items-center justify-between">
            <div>
              <p className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                SMS / Authenticator App OTP
              </p>
              <p className="text-[11px] text-zinc-500">
                Requires 6-digit OTP sent to {user.mobile} on every portal login.
              </p>
            </div>

            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                twoFactorEnabled ? "bg-emerald-800 text-white" : "bg-zinc-300 text-zinc-700"
              }`}
            >
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
