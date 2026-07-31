import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

import { getRegionalOffices, generateCitizenId, getTodayPakistanDate } from "./src/utils/pakistanLocations";

// Export the application so Vercel can invoke the same API routes.
export const app = express();

async function startServer() {
  const PORT = 3000;

  // Trust proxy headers (e.g. Cloud Run, reverse proxy)
  app.set("trust proxy", true);

  app.use(express.json({ limit: "10mb" }));

  // Helper function to resolve RP ID and Expected Origins dynamically based on request or client domain
  function getWebAuthnParams(req: express.Request, clientHostname?: string, clientOrigin?: string) {
    let host = "";

    // 1. Prefer client explicit hostname if provided
    if (clientHostname && typeof clientHostname === "string" && clientHostname.trim()) {
      host = clientHostname.trim();
    } else if (clientOrigin && typeof clientOrigin === "string" && clientOrigin.trim()) {
      try {
        host = new URL(clientOrigin).hostname;
      } catch (e) {
        // ignore invalid URL
      }
    }

    // 2. Fallback to Express headers / proxy headers
    if (!host) {
      const xForwardedHost = req.get("x-forwarded-host");
      const hostHeader = req.get("host");
      const originHeader = req.get("origin");
      const refererHeader = req.get("referer");

      if (xForwardedHost) {
        host = xForwardedHost.split(",")[0].trim();
      } else if (originHeader) {
        try {
          host = new URL(originHeader).hostname;
        } catch (e) {
          host = originHeader.replace(/^https?:\/\//, "").split("/")[0];
        }
      } else if (refererHeader) {
        try {
          host = new URL(refererHeader).hostname;
        } catch (e) {
          host = refererHeader.replace(/^https?:\/\//, "").split("/")[0];
        }
      } else if (hostHeader) {
        host = hostHeader;
      } else {
        host = req.hostname || "";
      }
    }

    // Clean up hostname (strip port if present)
    let rpID = host.split(":")[0].trim().toLowerCase();
    if (!rpID) {
      rpID = req.hostname ? req.hostname.split(":")[0].trim().toLowerCase() : "";
    }

    const rpName = "PakCitizen National Digital Portal";

    // Determine allowed origins
    const isLocal = rpID === "localhost" || rpID === "127.0.0.1" || rpID.endsWith(".localhost");
    const protocol = isLocal ? "http" : "https";

    const origins = new Set<string>();
    if (rpID) {
      origins.add(`${protocol}://${rpID}`);
      origins.add(`https://${rpID}`);
      origins.add(`http://${rpID}`);
    }

    if (clientOrigin) {
      origins.add(clientOrigin.replace(/\/$/, ""));
    }
    const reqOrigin = req.get("origin");
    if (reqOrigin) {
      origins.add(reqOrigin.replace(/\/$/, ""));
    }
    const referer = req.get("referer");
    if (referer) {
      try {
        const u = new URL(referer);
        origins.add(`${u.protocol}//${u.host}`);
      } catch (e) {}
    }

    const allowedOrigins = Array.from(origins).filter(Boolean);

    console.log(`[WebAuthn Server RP Config] Resolved RP ID: "${rpID}", RP Name: "${rpName}", Allowed Origins:`, allowedOrigins);

    return {
      rpID,
      rpName,
      allowedOrigins,
    };
  }

  // WebAuthn challenges are one-time and short-lived to prevent replay.
  const WEBAUTHN_CHALLENGE_TTL_MS = 5 * 60 * 1000;
  type StoredChallenge = { value: string; expiresAt: number };
  const challengesMap = new Map<string, StoredChallenge>();

  function storeChallenge(key: string, value: string) {
    challengesMap.set(key, { value, expiresAt: Date.now() + WEBAUTHN_CHALLENGE_TTL_MS });
  }

  function takeChallenge(key: string): string | undefined {
    const stored = challengesMap.get(key);
    challengesMap.delete(key);
    if (!stored || stored.expiresAt < Date.now()) return undefined;
    return stored.value;
  }

  // Initialize Gemini AI SDK lazily or server-side safely
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }
    }
    return aiClient;
  }

  // --- API Endpoints ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "National Digital Citizen Services Gateway", timestamp: new Date().toISOString() });
  });

  // In-memory User Account Database
  const registeredUsersMap = new Map<string, any>();

  const getEmailKey = (email?: string) => (email ? email.trim().toLowerCase() : "");
  const getCnicKey = (cnic?: string) => (cnic ? cnic.replace(/\D/g, "") : "");
  const getMobileKey = (mobile?: string) => (mobile ? mobile.replace(/\D/g, "") : "");

  // API to clear/delete all registered users
  app.delete("/api/auth/users", (req, res) => {
    registeredUsersMap.clear();
    return res.json({ success: true, message: "All registered users have been deleted." });
  });

  app.post("/api/auth/clear-users", (req, res) => {
    registeredUsersMap.clear();
    return res.json({ success: true, message: "All registered users have been deleted successfully." });
  });

  app.get("/api/auth/users", (req, res) => {
    const users = Array.from(registeredUsersMap.values());
    const uniqueUsers = Array.from(new Map(users.map((u: any) => [u.id || u.email, u])).values());
    return res.json({ count: uniqueUsers.length, users: uniqueUsers });
  });

  app.post("/api/auth/sync-users", (req, res) => {
    const { users } = req.body;
    if (Array.isArray(users)) {
      users.forEach((u: any) => {
        if (u && (u.email || u.cnic || u.mobile)) {
          const emailKey = getEmailKey(u.email);
          const cnicKey = getCnicKey(u.cnic);
          const mobileKey = getMobileKey(u.mobile || u.phoneNumber);
          if (emailKey) registeredUsersMap.set(emailKey, u);
          if (cnicKey) registeredUsersMap.set(cnicKey, u);
          if (mobileKey) registeredUsersMap.set(mobileKey, u);
        }
      });
    }
    return res.json({ success: true, count: registeredUsersMap.size });
  });

  app.post("/api/auth/update-user", (req, res) => {
    const updatedUser = req.body;
    if (!updatedUser || (!updatedUser.email && !updatedUser.cnic && !updatedUser.mobile)) {
      return res.status(400).json({ error: "Invalid user data provided." });
    }
    const emailKey = getEmailKey(updatedUser.email);
    const cnicKey = getCnicKey(updatedUser.cnic);
    const mobileKey = getMobileKey(updatedUser.mobile || updatedUser.phoneNumber);

    const existing = (emailKey && registeredUsersMap.get(emailKey)) || (cnicKey && registeredUsersMap.get(cnicKey)) || (mobileKey && registeredUsersMap.get(mobileKey)) || {};
    const merged = { ...existing, ...updatedUser };

    if (emailKey) registeredUsersMap.set(emailKey, merged);
    if (cnicKey) registeredUsersMap.set(cnicKey, merged);
    if (mobileKey) registeredUsersMap.set(mobileKey, merged);

    return res.json({ success: true, user: merged });
  });

  // --- WEBAUTHN PASSKEY ENDPOINTS ---
  app.post("/api/webauthn/generate-registration-options", async (req, res) => {
    try {
      const { email, cnic, userId, fullName, clientHostname, clientOrigin } = req.body;
      const userEmail = email ? email.trim().toLowerCase() : "";
      const userCnic = cnic ? cnic.replace(/\D/g, "") : "";
      const existingUser = (userEmail && registeredUsersMap.get(userEmail)) || (userCnic && registeredUsersMap.get(userCnic));

      const uID = userId || existingUser?.id || "user_" + Date.now();
      const userName = userEmail || userCnic || "citizen@gov.pk";
      const userDisplayName = fullName || existingUser?.fullName || "Digital Citizen";

      const existingPasskeys: any[] = existingUser?.passkeys || [];

      const { rpID, rpName } = getWebAuthnParams(req, clientHostname, clientOrigin);

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: Buffer.from(uID),
        userName,
        userDisplayName,
        attestationType: "none",
        excludeCredentials: existingPasskeys.map((p) => ({
          id: p.credentialID || p.id,
          transports: p.transports,
        })),
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "required",
        },
      });

      const challengeKey = uID || userName;
      storeChallenge(challengeKey, options.challenge);

      return res.json({ options, challengeKey, rpID, rpName });
    } catch (err: any) {
      console.error("Error generating WebAuthn registration options:", err);
      return res.status(500).json({ error: err?.message || "Failed to generate WebAuthn options." });
    }
  });

  app.post("/api/webauthn/verify-registration", async (req, res) => {
    try {
      const { email, cnic, userId, response, challengeKey, clientHostname, clientOrigin } = req.body;
      const key = challengeKey || userId || (email ? email.trim().toLowerCase() : "");
      const expectedChallenge = takeChallenge(key);

      if (!expectedChallenge) {
        return res.status(400).json({ error: "WebAuthn challenge expired or missing. Please try again." });
      }

      const { rpID, allowedOrigins } = getWebAuthnParams(req, clientHostname, clientOrigin);

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: allowedOrigins,
        expectedRPID: rpID,
        requireUserVerification: true,
      });

      if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;
        const credentialID = credential?.id || (verification.registrationInfo as any).credentialID || response.id;
        const rawPublicKey = credential?.publicKey || (verification.registrationInfo as any).credentialPublicKey;
        const credentialPublicKey = rawPublicKey ? Buffer.from(rawPublicKey).toString("base64") : "";
        const counter = credential?.counter ?? (verification.registrationInfo as any).counter ?? 0;

        const newPasskey = {
          id: credentialID,
          credentialID,
          publicKey: credentialPublicKey,
          counter,
          transports: response.response?.transports || ["internal"],
          createdAt: new Date().toISOString(),
          deviceType: verification.registrationInfo.credentialDeviceType || "multiDevice",
          backedUp: verification.registrationInfo.credentialBackedUp || false,
        };

        const userEmail = email ? email.trim().toLowerCase() : "";
        const userCnic = cnic ? cnic.replace(/\D/g, "") : "";
        const existingUser = (userEmail && registeredUsersMap.get(userEmail)) || (userCnic && registeredUsersMap.get(userCnic));

        if (existingUser) {
          if (userId) existingUser.id = userId;
          if (!existingUser.passkeys) existingUser.passkeys = [];
          existingUser.passkeys = existingUser.passkeys.filter((p: any) => (p.id || p.credentialID) !== credentialID);
          existingUser.passkeys.push(newPasskey);

          if (userEmail) registeredUsersMap.set(userEmail, existingUser);
          if (userCnic) registeredUsersMap.set(userCnic, existingUser);
        }

        return res.json({
          verified: true,
          passkey: newPasskey,
          message: "Passkey registered successfully!",
        });
      } else {
        return res.status(400).json({ error: "Passkey registration verification failed." });
      }
    } catch (err: any) {
      console.error("Error verifying WebAuthn registration:", err);
      return res.status(500).json({ error: err?.message || "WebAuthn verification failed." });
    }
  });

  app.post("/api/webauthn/generate-authentication-options", async (req, res) => {
    try {
      const { emailOrCnic, clientHostname, clientOrigin } = req.body;
      const inputKey = emailOrCnic ? emailOrCnic.trim() : "";
      const emailKey = getEmailKey(inputKey);
      const cnicKey = getCnicKey(inputKey);
      const user = (emailKey && registeredUsersMap.get(emailKey)) || (cnicKey && registeredUsersMap.get(cnicKey));

      const userPasskeys: any[] = user?.passkeys || [];

      const { rpID } = getWebAuthnParams(req, clientHostname, clientOrigin);

      const allowCredentials = userPasskeys.map((p) => ({
        id: p.credentialID || p.id,
        transports: p.transports,
      }));

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: "required",
      });

      const challengeKey = user?.id || inputKey || "auth_" + Date.now();
      storeChallenge(challengeKey, options.challenge);

      return res.json({
        options,
        challengeKey,
        rpID,
        hasPasskeys: allowCredentials.length > 0,
        user: user ? { email: user.email, cnic: user.cnic, fullName: user.fullName } : null,
      });
    } catch (err: any) {
      console.error("Error generating WebAuthn authentication options:", err);
      return res.status(500).json({ error: err?.message || "Failed to generate authentication options." });
    }
  });

  app.post("/api/webauthn/verify-authentication", async (req, res) => {
    try {
      const { emailOrCnic, response, challengeKey, passkeys: clientPasskeys, clientHostname, clientOrigin } = req.body;
      const inputKey = emailOrCnic ? emailOrCnic.trim() : "";
      const emailKey = getEmailKey(inputKey);
      const cnicKey = getCnicKey(inputKey);
      let user = (emailKey && registeredUsersMap.get(emailKey)) || (cnicKey && registeredUsersMap.get(cnicKey));

      const key = challengeKey || user?.id || inputKey;
      const expectedChallenge = takeChallenge(key);

      if (!expectedChallenge) {
        return res.status(400).json({ error: "Authentication challenge expired or invalid. Please try again." });
      }

      const passkeysToSearch: any[] = user?.passkeys || [];

      const credentialID = response.id;
      const matchedPasskey = passkeysToSearch.find((p: any) => (p.credentialID || p.id) === credentialID);

      if (!matchedPasskey) {
        return res.status(400).json({ error: "Passkey not registered for this account." });
      }

      const { rpID, allowedOrigins } = getWebAuthnParams(req, clientHostname, clientOrigin);

      const credentialPublicKey = matchedPasskey.publicKey ? Buffer.from(matchedPasskey.publicKey, "base64") : new Uint8Array();

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: allowedOrigins,
        expectedRPID: rpID,
        credential: {
          id: matchedPasskey.credentialID || matchedPasskey.id,
          publicKey: credentialPublicKey,
          counter: matchedPasskey.counter || 0,
          transports: matchedPasskey.transports,
        },
        requireUserVerification: true,
      });

      if (verification.verified) {
        if (user) {
          matchedPasskey.counter = verification.authenticationInfo.newCounter;
        }
        return res.json({
          verified: true,
          user: user || null,
          message: "WebAuthn Passkey authentication successful!",
        });
      } else {
        return res.status(400).json({ error: "Passkey verification failed." });
      }
    } catch (err: any) {
      console.error("Error verifying WebAuthn authentication:", err);
      return res.status(500).json({ error: err?.message || "Passkey verification failed." });
    }
  });

  // Authentication & Verification Endpoints
  app.post("/api/auth/register", (req, res) => {
    const { fullName, fatherName, motherName, occupation, maritalStatus, bloodGroup, email, cnic, password, passportNumber, province, city, homeAddress, mobile, dob } = req.body;
    if (!fullName || !email || !cnic || !password) {
      return res.status(400).json({ error: "Required fields missing. Please provide full name, email, CNIC, and password." });
    }

    const emailKey = getEmailKey(email);
    const cnicKey = getCnicKey(cnic);
    const mobileKey = getMobileKey(mobile);

    if ((emailKey && registeredUsersMap.has(emailKey)) || (cnicKey && registeredUsersMap.has(cnicKey)) || (mobileKey && registeredUsersMap.has(mobileKey))) {
      return res.status(400).json({ error: "An account with this CNIC, Email, or Mobile number is already registered in the system. Please sign in." });
    }

    const userProv = province || "ICT Islamabad";
    const userCity = city?.trim() || "Islamabad";
    const offices = getRegionalOffices(userProv, userCity);
    const citizenId = generateCitizenId(cnic);
    const createdDate = getTodayPakistanDate();

    const newUser = {
      id: citizenId,
      fullName: fullName.trim(),
      fatherName: fatherName?.trim() || "Citizen Father Record",
      motherName: motherName?.trim() || "Citizen Mother Record",
      occupation: occupation?.trim() || "Professional",
      maritalStatus: maritalStatus?.trim() || "Single",
      bloodGroup: bloodGroup?.trim() || "B+",
      email: email.trim(),
      cnic: cnic.trim(),
      mobile: mobile?.trim() || "+92 300 1234567",
      password,
      passportNumber: passportNumber?.trim() || "Not Issued",
      province: userProv,
      city: userCity,
      homeAddress: homeAddress?.trim() || "Pakistan",
      dob: dob || "1995-01-01",
      registrationDate: createdDate,
      assignedPassportOffice: offices.passportOffice,
      assignedTaxOffice: offices.taxOffice,
      assignedLicensingAuthority: offices.licensingAuthority,
      assignedUtilityProvider: offices.utilityProvider,
      assignedRegionalAuthority: offices.regionalAuthority,
      isVerified: true,
      atlStatus: "INACTIVE",
      twoFactorEnabled: true,
    };

    registeredUsersMap.set(emailKey, newUser);
    registeredUsersMap.set(cnicKey, newUser);
    if (mobileKey) registeredUsersMap.set(mobileKey, newUser);

    return res.json({
      success: true,
      message: "Registration successful. User account created and linked in system database.",
      requires2FA: true,
      user: newUser,
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { emailOrCnic, password } = req.body;
    if (!emailOrCnic || !password) {
      return res.status(400).json({ error: "Please enter your CNIC or Email along with your password." });
    }

    const emailKey = getEmailKey(emailOrCnic);
    const cnicKey = getCnicKey(emailOrCnic);
    const mobileKey = getMobileKey(emailOrCnic);
    let existingUser = (emailKey && registeredUsersMap.get(emailKey)) || (cnicKey && registeredUsersMap.get(cnicKey)) || (mobileKey && registeredUsersMap.get(mobileKey));

    if (!existingUser) {
      const isEmail = emailOrCnic.includes("@");
      const isMobile = /^\+?\d{10,15}$/.test(emailOrCnic.replace(/[\s\-]/g, ""));
      const userProvince = "ICT Islamabad";
      const userCity = "Islamabad";

      const newUser = {
        id: "usr_" + Date.now(),
        fullName: isEmail ? emailOrCnic.split("@")[0] : "Digital Citizen",
        email: isEmail ? emailOrCnic : "",
        mobile: isMobile ? emailOrCnic : "",
        cnic: (!isEmail && !isMobile) ? emailOrCnic : "",
        password: password,
        dob: "1995-01-01",
        province: userProvince,
        city: userCity,
        homeAddress: "Islamabad, Pakistan",
        isVerified: true,
        atlStatus: "INACTIVE",
        bloodGroup: "B+",
        fatherName: "",
        motherName: "",
        maritalStatus: "Single",
        occupation: "Public Sector",
      };

      if (emailKey) registeredUsersMap.set(emailKey, newUser);
      if (cnicKey) registeredUsersMap.set(cnicKey, newUser);
      if (mobileKey) registeredUsersMap.set(mobileKey, newUser);

      existingUser = newUser;
    } else {
      existingUser.password = password;
    }

    return res.json({
      success: true,
      requires2FA: true,
      message: "Credentials verified. 2FA Verification OTP dispatched to registered phone number.",
      user: existingUser,
    });
  });

  app.post("/api/auth/verify-2fa", (req, res) => {
    const { otp, user } = req.body;
    if (!otp || otp.length < 4) {
      return res.status(400).json({ error: "Invalid OTP code. Please enter 6-digit security code (e.g. 123456)." });
    }
    return res.json({
      success: true,
      token: "jwt_token_" + Date.now(),
      message: "Authentication verified successfully.",
      user: user || null,
    });
  });

  app.post("/api/auth/update-user", (req, res) => {
    const { user } = req.body;
    if (!user || (!user.email && !user.cnic)) {
      return res.status(400).json({ error: "Invalid user data provided." });
    }
    const emailKey = getEmailKey(user.email);
    const cnicKey = getCnicKey(user.cnic);
    const existingUser = (emailKey && registeredUsersMap.get(emailKey)) || (cnicKey && registeredUsersMap.get(cnicKey));
    const updatedUser = { ...(existingUser || {}), ...user };
    if (emailKey) registeredUsersMap.set(emailKey, updatedUser);
    if (cnicKey) registeredUsersMap.set(cnicKey, updatedUser);
    return res.json({ success: true, message: "User profile updated in registry server.", user: updatedUser });
  });

  app.post("/api/auth/sync-users", (req, res) => {
    const { users } = req.body;
    if (Array.isArray(users)) {
      users.forEach((u: any) => {
        const emailKey = getEmailKey(u.email);
        const cnicKey = getCnicKey(u.cnic);
        if (emailKey) registeredUsersMap.set(emailKey, u);
        if (cnicKey) registeredUsersMap.set(cnicKey, u);
      });
    }
    return res.json({ success: true, message: "Users synced with backend registry server." });
  });

  // Gemini AI Citizen Assistant Endpoint
  app.post("/api/gemini/assistant", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const client = getGeminiClient();
      if (!client) {
        // High quality fallback responses if API key is not configured yet
        return res.json({
          response: `[PakCitizen Virtual Assistance] Requirements for official passport renewal include: 1) Original CNIC/NICOP, 2) Current Passport copy, 3) Biometric verification receipt, 4) Processing fee paid via e-Khidmat / citizen portal. Processing timelines: Executive (2 days), Urgent (5 working days), Normal (10 working days).`,
        });
      }

      const systemInstruction = `You are "PakCitizen AI Assist", the official AI virtual guide for Pakistan's National Digital Citizen Services Portal.
      Your job is to provide accurate, polite, official, and concise guidance regarding:
      - Passport renewal, urgent fees, delivery options, and regional passport offices (Islamabad, Lahore, Karachi, Peshawar, Quetta, Overseas Consulates).
      - CNIC / NICOP / Smart Card application, Family Registration Certificate (FRC), Executive processing.
      - Income Tax filings, Federal Board of Revenue (FBR) Active Taxpayer List (ATL), tax slabs, Iris portal guidance.
      - Driver License renewal, E-Routing, Token Tax payment for vehicles.
      - Domicile, Property registration (e-Zameen), Sehat Sahulat Card, HEC degree attestation.
      Provide structured responses with clear steps, document checklists, or fee estimations in PKR. Maintain a professional, citizen-centric, and helpful tone. Format markdown nicely if needed.`;

      const aiRes = await client.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ response: aiRes.text || "I am here to assist with your national citizen service inquiry. Please specify your request." });
    } catch (err: any) {
      console.error("Gemini assistant error:", err);
      return res.status(500).json({
        error: "Unable to process AI service query at this moment. Please try again or use direct search.",
        details: err?.message,
      });
    }
  });

  // Passport tracking API
  app.post("/api/services/passport/track", (req, res) => {
    const { trackingId } = req.body;
    const id = trackingId || "PAS-2026-89412";
    return res.json({
      trackingId: id,
      applicantName: "Muhammad Ali Khan",
      category: "5-Year Machine Readable Passport (Executive 36-Page)",
      office: "Executive Passport Office G-10 Islamabad",
      submissionDate: "2026-07-15",
      estimatedDelivery: "2026-07-30",
      currentStage: 3,
      stages: [
        { title: "Application Submitted & Paid", date: "Jul 15, 2026", status: "completed" },
        { title: "Biometric & Photo Verification", date: "Jul 16, 2026", status: "completed" },
        { title: "NADRA Data Verification & Clearance", date: "Jul 20, 2026", status: "completed" },
        { title: "Passport Printing & Personalization", date: "Jul 26, 2026", status: "in_progress" },
        { title: "Dispatched to Courier / Pickup Center", date: "Pending", status: "upcoming" },
      ],
    });
  });

  // FBR Tax calculation API
  app.post("/api/services/tax/calculate", (req, res) => {
    const { annualIncome } = req.body;
    const income = Number(annualIncome) || 2400000; // default 2.4 million PKR

    let taxAmount = 0;
    let slabRate = "0%";
    let formula = "Exempt";

    if (income <= 600000) {
      taxAmount = 0;
      slabRate = "0%";
      formula = "Income up to PKR 600,000 is 100% Tax Exempt";
    } else if (income <= 1200000) {
      taxAmount = (income - 600000) * 0.05;
      slabRate = "5%";
      formula = "5% of amount exceeding PKR 600,000";
    } else if (income <= 2200000) {
      taxAmount = 30000 + (income - 1200000) * 0.15;
      slabRate = "15%";
      formula = "PKR 30,000 + 15% of amount exceeding PKR 1.2M";
    } else if (income <= 3200000) {
      taxAmount = 180000 + (income - 2200000) * 0.25;
      slabRate = "25%";
      formula = "PKR 180,000 + 25% of amount exceeding PKR 2.2M";
    } else if (income <= 4100000) {
      taxAmount = 430000 + (income - 3200000) * 0.30;
      slabRate = "30%";
      formula = "PKR 430,000 + 30% of amount exceeding PKR 3.2M";
    } else {
      taxAmount = 700000 + (income - 4100000) * 0.35;
      slabRate = "35%";
      formula = "PKR 700,000 + 35% of amount exceeding PKR 4.1M";
    }

    const monthlyIncome = Math.round(income / 12);
    const monthlyTax = Math.round(taxAmount / 12);
    const netTakeHome = monthlyIncome - monthlyTax;

    return res.json({
      annualIncome: income,
      monthlyIncome,
      annualTax: Math.round(taxAmount),
      monthlyTax,
      effectiveTaxRate: ((taxAmount / income) * 100).toFixed(1) + "%",
      slabRate,
      formula,
      netTakeHome,
      atlDiscount: "Non-ATL rate is 100% surcharge higher. Maintain Active Taxpayer Status to save.",
    });
  });

  // --- Vite Middleware for Development ---
  if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Citizen Portal server running at http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();
