// Utility for Location-based Regional Authorities and Pakistan Standard Time

export function getTodayPakistanDate(): string {
  // Returns today's date in Pakistan Standard Time (PKT) as YYYY-MM-DD
  const now = new Date();
  // Adjust for PKT (UTC+5)
  const pktTime = new Date(now.getTime() + (5 * 60 + now.getTimezoneOffset()) * 60000);
  const year = pktTime.getFullYear();
  const month = String(pktTime.getMonth() + 1).padStart(2, "0");
  const day = String(pktTime.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatPakistanDateDisplay(dateStr?: string): string {
  if (!dateStr || dateStr === "N/A" || dateStr === "Pending Processing") return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

export interface RegionalOfficeInfo {
  passportOffice: string;
  taxOffice: string;
  licensingAuthority: string;
  utilityProvider: string;
  regionalAuthority: string;
}

export function getRegionalOffices(province: string = "ICT Islamabad", city: string = "Islamabad"): RegionalOfficeInfo {
  const p = province.trim().toLowerCase();
  const c = city.trim().toLowerCase();

  // Islamabad Capital Territory
  if (p.includes("islamabad") || c.includes("islamabad")) {
    return {
      passportOffice: "DGIP Headquarters & Passport Regional Office Sector G-10/4, Islamabad",
      taxOffice: "FBR Large Taxpayer Office (LTO) Islamabad, Mauve Area",
      licensingAuthority: "Islamabad Traffic Police (ITP) Licensing HQ, Sector F-8/1",
      utilityProvider: "IESCO (Islamabad Electric) & CDA Water Management",
      regionalAuthority: "Capital Development Authority (CDA) Islamabad",
    };
  }

  // Punjab
  if (p.includes("punjab") || c.includes("lahore") || c.includes("rawalpindi") || c.includes("faisalabad") || c.includes("multan") || c.includes("sialkot") || c.includes("gujranwala") || c.includes("bahawalpur") || c.includes("sargodha")) {
    let passOff = `${city} Regional Passport Office, Punjab`;
    let taxOff = `FBR Regional Tax Office (RTO) ${city}`;
    let licAuth = `Punjab CTP & Traffic Police ${city} License Center`;
    let util = `LESCO Electric & WASA ${city}`;

    if (c.includes("lahore")) {
      passOff = "Lahore Garden Town Executive Passport Office, Ferozepur Road";
      taxOff = "FBR Corporate Tax Office (CTO) Lahore, Nabha Road";
      licAuth = "CTO Lahore Driving License Testing Center, Manawan";
      util = "LESCO (Lahore Electric) & WASA Lahore";
    } else if (c.includes("rawalpindi")) {
      passOff = "Rawalpindi Executive Passport Office, Rehmanabad Murree Road";
      taxOff = "FBR Regional Tax Office (RTO) Rawalpindi, Kachehri Road";
      licAuth = "Rawalpindi Traffic Police DL HQ, Peshawar Road";
      util = "IESCO (Rawalpindi Circle) & WASA Rawalpindi";
    } else if (c.includes("faisalabad")) {
      passOff = "Faisalabad Regional Passport Office, Civil Lines";
      taxOff = "FBR Regional Tax Office (RTO) Faisalabad";
      licAuth = "Faisalabad Traffic Police DL Branch";
      util = "FESCO (Faisalabad Electric) & WASA Faisalabad";
    } else if (c.includes("multan")) {
      passOff = "Multan Executive Passport Office, LMQ Road";
      taxOff = "FBR Regional Tax Office (RTO) Multan";
      licAuth = "Multan Traffic Police Licensing Center";
      util = "MEPCO (Multan Electric) & WASA Multan";
    }

    return {
      passportOffice: passOff,
      taxOffice: taxOff,
      licensingAuthority: licAuth,
      utilityProvider: util,
      regionalAuthority: `Government of Punjab - ${city} Development Authority`,
    };
  }

  // Sindh
  if (p.includes("sindh") || c.includes("karachi") || c.includes("hyderabad") || c.includes("sukkur") || c.includes("larkana") || c.includes("mirpurkhas")) {
    let passOff = `${city} Regional Passport Office, Sindh`;
    let taxOff = `FBR Regional Tax Office (RTO) ${city}`;
    let licAuth = `Sindh Driving License Authority (DL Branch ${city})`;
    let util = `HESCO Electric & WASA ${city}`;

    if (c.includes("karachi")) {
      passOff = "Karachi Central Passport Office, Saddar Executive Hub";
      taxOff = "FBR Corporate Tax Office (CTO) Karachi, Shahrah-e-Attar Clifton";
      licAuth = "Sindh Driving License Branch Clifton & DL Nazimabad Karachi";
      util = "K-Electric & Karachi Water & Sewerage Corporation (KWSC)";
    } else if (c.includes("hyderabad")) {
      passOff = "Hyderabad Regional Passport Office, Thandi Sarak";
      taxOff = "FBR Regional Tax Office (RTO) Hyderabad";
      licAuth = "Sindh DL Branch Hyderabad";
      util = "HESCO (Hyderabad Electric) & WASA Hyderabad";
    }

    return {
      passportOffice: passOff,
      taxOffice: taxOff,
      licensingAuthority: licAuth,
      utilityProvider: util,
      regionalAuthority: `Government of Sindh - ${city} Development Authority`,
    };
  }

  // Khyber Pakhtunkhwa (KP)
  if (p.includes("khyber") || p.includes("kp") || c.includes("peshawar") || c.includes("abbottabad") || c.includes("mardan") || c.includes("swat") || c.includes("kohat")) {
    let passOff = `${city} Regional Passport Office, KP`;
    let taxOff = `FBR Regional Tax Office (RTO) ${city}`;
    let licAuth = `KP Traffic Police ${city} Licensing Branch`;
    let util = `PESCO Electric & WSSC ${city}`;

    if (c.includes("peshawar")) {
      passOff = "Peshawar Cantt Executive Passport Office, Mall Road";
      taxOff = "FBR Regional Tax Office (RTO) Peshawar, Jamrud Road";
      licAuth = "Peshawar Traffic Police HQ, Khyber Road";
      util = "PESCO (Peshawar Electric) & WSSC Peshawar";
    }

    return {
      passportOffice: passOff,
      taxOffice: taxOff,
      licensingAuthority: licAuth,
      utilityProvider: util,
      regionalAuthority: `Government of Khyber Pakhtunkhwa - ${city} Urban Authority`,
    };
  }

  // Balochistan
  if (p.includes("balochistan") || c.includes("quetta") || c.includes("gwadar") || c.includes("khuzdar")) {
    return {
      passportOffice: c.includes("quetta") ? "Quetta Cantt Regional Passport Office, Zarghoon Road" : `${city} Regional Passport Office, Balochistan`,
      taxOffice: "FBR Regional Tax Office (RTO) Quetta, Spiny Road",
      licensingAuthority: `Balochistan Traffic Police ${city} License Division`,
      utilityProvider: "QESCO (Quetta Electric) & Quetta Water Board",
      regionalAuthority: `Government of Balochistan - ${city} Development Authority`,
    };
  }

  // Azad Jammu & Kashmir (AJK)
  if (p.includes("kashmir") || p.includes("ajk") || c.includes("muzaffarabad") || c.includes("mirpur") || c.includes("rawalakot")) {
    return {
      passportOffice: `${city} Regional Passport Office, Azad Kashmir`,
      taxOffice: "AJK Central Board of Revenue (CBR), Muzaffarabad",
      licensingAuthority: `AJK Traffic Police ${city} License Authority`,
      utilityProvider: "AJK Electricity Department & Municipal Board",
      regionalAuthority: "Government of Azad Jammu & Kashmir",
    };
  }

  // Gilgit-Baltistan (GB)
  if (p.includes("gilgit") || p.includes("baltistan") || p.includes("gb") || c.includes("skardu")) {
    return {
      passportOffice: `${city} Regional Passport Office, Gilgit-Baltistan`,
      taxOffice: "Gilgit-Baltistan Revenue Council Authority",
      licensingAuthority: `GB Traffic Police License Branch ${city}`,
      utilityProvider: "Water & Power Department Gilgit-Baltistan",
      regionalAuthority: "Government of Gilgit-Baltistan Municipal Council",
    };
  }

  // Generic Fallback
  return {
    passportOffice: `${city} Regional Passport Office, ${province}`,
    taxOffice: `FBR Regional Tax Office (RTO) ${city}`,
    licensingAuthority: `${province} Traffic Police ${city} DL Center`,
    utilityProvider: `${city} Municipal Power & Water Utility`,
    regionalAuthority: `${city} Regional Development Authority`,
  };
}

export function generateCitizenId(cnic: string): string {
  const cleanCnic = cnic.replace(/\D/g, "");
  const regionCode = cleanCnic.length >= 5 ? cleanCnic.substring(0, 5) : "61101";
  const uniqueRand = Math.floor(100 + Math.random() * 900);
  return `PAK-${regionCode}-${uniqueRand}-2026`;
}
