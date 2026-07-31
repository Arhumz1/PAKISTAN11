import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Check, Phone } from "lucide-react";

export interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92" },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", dialCode: "+974" },
  { code: "OM", name: "Oman", flag: "🇴🇲", dialCode: "+968" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", dialCode: "+965" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", dialCode: "+973" },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", dialCode: "+90" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "IT", name: "Italy", flag: "🇮🇹", dialCode: "+39" },
  { code: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", dialCode: "+31" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", dialCode: "+82" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55" },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  required = false,
  className = "",
  placeholder = "300 8592014"
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial full phone value e.g. "+1 202 555 0123", "+92 300 8592014", or "2025550123"
  useEffect(() => {
    if (!value) return;

    const trimmed = value.trim();

    // 1. Value starts with '+'
    if (trimmed.startsWith("+")) {
      // Sort country codes by dial code length descending so +971 is matched before +9, +1 for US
      const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
      const matched = sortedCodes.find((c) => trimmed.startsWith(c.dialCode));
      if (matched) {
        setSelectedCountry(matched);
        setPhoneNumber(trimmed.slice(matched.dialCode.length).trim());
        return;
      }
    }

    // 2. Value is plain digits or formatted without '+'
    const cleanDigits = trimmed.replace(/\D/g, "");
    if (cleanDigits) {
      // Check for US number (11 digits starting with 1, or 10 digits starting with 2-9)
      if (cleanDigits.startsWith("1") && cleanDigits.length === 11) {
        const us = COUNTRY_CODES.find((c) => c.code === "US") || COUNTRY_CODES[1];
        setSelectedCountry(us);
        setPhoneNumber(cleanDigits.slice(1));
        return;
      } else if (cleanDigits.length === 10 && /^[2-9]/.test(cleanDigits)) {
        const us = COUNTRY_CODES.find((c) => c.code === "US") || COUNTRY_CODES[1];
        setSelectedCountry(us);
        setPhoneNumber(cleanDigits);
        return;
      } else if (cleanDigits.startsWith("0")) {
        const pk = COUNTRY_CODES.find((c) => c.code === "PK") || COUNTRY_CODES[0];
        setSelectedCountry(pk);
        setPhoneNumber(cleanDigits.slice(1));
        return;
      } else if (cleanDigits.startsWith("92") && cleanDigits.length >= 12) {
        const pk = COUNTRY_CODES.find((c) => c.code === "PK") || COUNTRY_CODES[0];
        setSelectedCountry(pk);
        setPhoneNumber(cleanDigits.slice(2));
        return;
      }
    }

    setPhoneNumber(trimmed);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery("");
    const combined = `${country.dialCode} ${phoneNumber}`.trim();
    onChange(combined);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    // Check if user pasted full international number e.g. "+1 202 555 0123"
    if (inputVal.trim().startsWith("+")) {
      const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
      const matched = sortedCodes.find((c) => inputVal.trim().startsWith(c.dialCode));
      if (matched) {
        setSelectedCountry(matched);
        const sub = inputVal.trim().slice(matched.dialCode.length).trim();
        setPhoneNumber(sub);
        onChange(`${matched.dialCode} ${sub}`.trim());
        return;
      }
    }

    setPhoneNumber(inputVal);
    const combined = `${selectedCountry.dialCode} ${inputVal}`.trim();
    onChange(combined);
  };

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 focus-within:ring-2 focus-within:ring-emerald-600 focus-within:border-emerald-600 transition overflow-hidden">
        {/* Country Code Scroller Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-700 text-xs font-semibold shrink-0 transition"
          title="Select Country Calling Code"
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {selectedCountry.dialCode}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Subscriber Phone Input */}
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="tel"
            required={required}
            placeholder={placeholder}
            value={phoneNumber}
            onChange={handleNumberChange}
            className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* Country Code Scrollable Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-[70] w-72 max-w-[90vw] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search country or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              autoFocus
            />
          </div>

          {/* Scroller List */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400">
                No matching country found
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition text-left ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="text-lg leading-none shrink-0">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 font-mono text-xs font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-400">{country.dialCode}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
