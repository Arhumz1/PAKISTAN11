import { startRegistration, startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { fetchApi } from "./api";

/**
 * Detect if application is currently embedded inside an iframe or embedded preview context.
 */
export function isEmbeddedIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    // Cross-origin SecurityError when accessing window.top implies an iframe
    return true;
  }
}

/**
 * Open current web app in top-level secure browser window / new tab.
 */
export function openSecureTopLevelWindow(): void {
  if (typeof window === "undefined") return;
  const currentUrl = window.location.href;
  window.open(currentUrl, "_blank", "noopener,noreferrer");
}

/**
 * Audit and verify WebAuthn passkey support on current browser, domain, and device.
 */
export async function checkWebAuthnSupport(mode: "registration" | "authentication" = "registration"): Promise<{
  supported: boolean;
  hasPlatformAuthenticator: boolean;
  isIframe: boolean;
  reason?: string;
}> {
  if (typeof window === "undefined") {
    return { supported: false, hasPlatformAuthenticator: false, isIframe: false, reason: "Server-side context." };
  }

  // Requirement 1 & 2: Detect if running inside iframe or embedded preview
  const isIframe = isEmbeddedIframe();
  if (isIframe) {
    const actionLabel = mode === "registration" ? "registration" : "authentication";
    return {
      supported: false,
      hasPlatformAuthenticator: false,
      isIframe: true,
      reason: `Passkey ${actionLabel} requires opening the application directly in a secure browser window.`,
    };
  }

  // Requirement 5: HTTPS or Localhost Requirement
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
  if (!window.isSecureContext && !isLocalhost) {
    return {
      supported: false,
      hasPlatformAuthenticator: false,
      isIframe: false,
      reason: "WebAuthn Passkeys require a top-level secure context (HTTPS) or localhost.",
    };
  }

  // Requirement 6: Browser WebAuthn API availability
  if (!window.navigator?.credentials || !window.PublicKeyCredential) {
    return {
      supported: false,
      hasPlatformAuthenticator: false,
      isIframe: false,
      reason: "Your browser or device does not support WebAuthn Passkeys.",
    };
  }

  // Check 3: Library WebAuthn support check
  if (!browserSupportsWebAuthn()) {
    return {
      supported: false,
      hasPlatformAuthenticator: false,
      isIframe: false,
      reason: "WebAuthn is disabled or unsupported in this browser environment.",
    };
  }

  // Check 4: Device platform authenticator (Touch ID, Face ID, Windows Hello, Fingerprint)
  let hasPlatformAuthenticator = false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      hasPlatformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (err) {
    console.warn("[WebAuthn Audit] Warning checking platform authenticator availability:", err);
  }

  return {
    supported: true,
    hasPlatformAuthenticator,
    isIframe: false,
  };
}

export function isWebAuthnSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (isEmbeddedIframe()) return false;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
  if (!window.isSecureContext && !isLocalhost) return false;
  return Boolean(window.navigator?.credentials && window.PublicKeyCredential && browserSupportsWebAuthn());
}

/**
 * Validate that RP ID matches or is a valid domain suffix of window.location.hostname
 */
function validateRpIdAndOrigin(rpId: string) {
  if (typeof window === "undefined") return;
  const currentHostname = window.location.hostname.toLowerCase();
  const normalizedRpId = (rpId || "").toLowerCase();

  if (!normalizedRpId) {
    throw new Error("WebAuthn Configuration Error: Server returned an empty Relying Party ID (RP ID).");
  }

  // RP ID must match current window.location.hostname or be a valid domain suffix
  const isMatch = currentHostname === normalizedRpId || currentHostname.endsWith(`.${normalizedRpId}`);

  if (!isMatch) {
    console.error("[WebAuthn RP ID Mismatch Detected]:", {
      serverRpId: normalizedRpId,
      clientHostname: currentHostname,
      origin: window.location.origin,
    });
    throw new Error(
      `WebAuthn Configuration Error: Relying Party ID "${normalizedRpId}" does not match the current deployment domain "${currentHostname}".`
    );
  }
}

/**
 * Validate PublicKeyCredentialCreationOptions object before passing to startRegistration
 */
function validateRegistrationOptions(options: any) {
  if (!options || typeof options !== "object") {
    throw new Error("Server returned an invalid or empty WebAuthn registration options object.");
  }
  if (!options.challenge || typeof options.challenge !== "string") {
    throw new Error("Invalid WebAuthn registration options: missing challenge.");
  }
  if (!options.rp || !options.rp.id || !options.rp.name) {
    throw new Error("Invalid WebAuthn registration options: missing RP parameters (rp.id or rp.name).");
  }
  if (!options.user || !options.user.id || !options.user.name) {
    throw new Error("Invalid WebAuthn registration options: missing User parameters (user.id or user.name).");
  }
  if (!Array.isArray(options.pubKeyCredParams) || options.pubKeyCredParams.length === 0) {
    throw new Error("Invalid WebAuthn registration options: missing or empty pubKeyCredParams array.");
  }

  validateRpIdAndOrigin(options.rp.id);

  console.log("[WebAuthn Audit] Validated PublicKeyCredentialCreationOptions successfully:", {
    rpId: options.rp.id,
    rpName: options.rp.name,
    userName: options.user.name,
    userId: options.user.id,
    pubKeyCredParams: options.pubKeyCredParams,
    authenticatorSelection: options.authenticatorSelection,
  });
}

/**
 * Validate PublicKeyCredentialRequestOptions object before passing to startAuthentication
 */
function validateAuthenticationOptions(options: any) {
  if (!options || typeof options !== "object") {
    throw new Error("Server returned an invalid or empty WebAuthn authentication options object.");
  }
  if (!options.challenge || typeof options.challenge !== "string") {
    throw new Error("Invalid WebAuthn authentication options: missing challenge.");
  }
  if (!options.rpId) {
    throw new Error("Invalid WebAuthn authentication options: missing rpId.");
  }

  validateRpIdAndOrigin(options.rpId);

  console.log("[WebAuthn Audit] Validated PublicKeyCredentialRequestOptions successfully:", {
    rpId: options.rpId,
    allowCredentialsCount: options.allowCredentials?.length || 0,
    userVerification: options.userVerification,
  });
}

/**
 * Helper to wrap any async operation with a 30-second timeout.
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms = 30000,
  errorMsg = "WebAuthn operation timed out after 30 seconds. Please try again."
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMsg));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Prompt user to create a WebAuthn Passkey (Face ID, Touch ID, Windows Hello, Fingerprint, PIN)
 */
export async function registerPasskeyClient(
  user: { email: string; cnic: string; fullName: string; id?: string },
  firebaseUid?: string,
  onProgress?: (stage: string) => void
) {
  return withTimeout(
    (async () => {
      // Step 0: Perform WebAuthn browser and device support check
      const support = await checkWebAuthnSupport("registration");
      if (!support.supported) {
        throw new Error(support.reason || "Passkey registration requires opening the application directly in a secure browser window.");
      }

      const uId = firebaseUid || user.id || "user_" + Date.now();

      const clientHostname = window.location.hostname;
      const clientOrigin = window.location.origin;

      // Step 1: Generate registration challenge options from server
      console.log("[WebAuthn] 1. Requesting registration options from server...");
      if (onProgress) onProgress("Generating WebAuthn registration challenge...");

      const { options, challengeKey, rpID } = await fetchApi<{ options: any; challengeKey: string; rpID: string }>(
        "/api/webauthn/generate-registration-options",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            cnic: user.cnic,
            userId: uId,
            fullName: user.fullName,
            clientHostname,
            clientOrigin,
          }),
        }
      );

      // Validate PublicKeyCredentialCreationOptions object structure
      validateRegistrationOptions(options);

      // Step 2: Call navigator.credentials.create() via simplewebauthn startRegistration
      console.log("[WebAuthn] 2. Calling navigator.credentials.create()... Target RP ID:", rpID || options?.rp?.id);
      if (onProgress) onProgress("Please confirm Passkey prompt on your device (Face ID / Touch ID / Fingerprint / PIN)...");

      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
        console.log("[WebAuthn] startRegistration completed successfully! Credential ID:", attResp?.id);
      } catch (err: any) {
        // Detailed Logging & Stack Trace Audit (Requirements 1 & 2)
        console.error("[WebAuthn Registration Error Audit]:", {
          errorName: err?.name,
          errorMessage: err?.message,
          errorCode: err?.code,
          errorStack: err?.stack,
          rawError: err,
          optionsJSON: options,
        });

        const name = err?.name || "";
        const msg = (err?.message || "").toLowerCase();

        // Requirement 1 & 10: Determine whether cancellation vs error & display exact error
        if (name === "NotAllowedError") {
          if (msg.includes("not allowed in this context") || msg.includes("document is not allowed") || msg.includes("feature policy") || msg.includes("iframe")) {
            throw new Error(`Browser Iframe Policy Restriction: WebAuthn prompt is restricted in this embed context. Please open app in a new tab or browser window. (${err.message})`);
          }
          if (msg.includes("time") || msg.includes("timeout") || msg.includes("expired")) {
            throw new Error("Passkey prompt timed out waiting for biometric or PIN input. Please try again.");
          }
          if (msg.includes("cancel") || msg.includes("closed") || msg.includes("user denied") || msg.includes("user abort")) {
            const cancelErr = new Error("Passkey registration prompt was closed or cancelled by the user.");
            cancelErr.name = "PasskeyCancelledError";
            throw cancelErr;
          }
          const detailedErr = new Error(`Passkey Prompt Not Allowed: ${err.message || "Prompt was closed or not allowed in current context."}`);
          detailedErr.name = "NotAllowedError";
          throw detailedErr;
        }

        if (name === "SecurityError") {
          throw new Error(`WebAuthn Security Error: Origin domain mismatch with RP ID "${options?.rp?.id}". (${err.message})`);
        }

        if (name === "InvalidStateError") {
          throw new Error("A Passkey for this account is already registered on this device.");
        }

        if (name === "NotSupportedError") {
          throw new Error(`Passkeys Not Supported: ${err.message || "Your browser or device does not support this passkey configuration."}`);
        }

        if (name === "ConstraintError" || name === "TypeError") {
          throw new Error(`WebAuthn Parameter Error: ${err.message}`);
        }

        throw new Error(err.message || `Passkey registration failed (${name || "Unknown Browser Error"}).`);
      }

      // Step 3: Send credential attestation response to server for verification
      console.log("[WebAuthn] 3. Verifying registration response with server...");
      if (onProgress) onProgress("Verifying Passkey response with server...");

      const result = await fetchApi("/api/webauthn/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          cnic: user.cnic,
          userId: uId,
          response: attResp,
          challengeKey,
          clientHostname,
          clientOrigin,
        }),
      });

      console.log("[WebAuthn] 4. Passkey verified successfully on server!");
      if (onProgress) onProgress("Passkey registration completed successfully!");

      return result;
    })(),
    30000,
    "Passkey registration timed out after 30 seconds. Please try again."
  );
}

/**
 * Authenticate user using WebAuthn Passkey (Face ID, Touch ID, Windows Hello, Fingerprint, PIN)
 */
export async function authenticatePasskeyClient(
  emailOrCnic?: string,
  clientPasskeys: any[] = [],
  onProgress?: (stage: string) => void
) {
  return withTimeout(
    (async () => {
      // Step 0: Support Check
      const support = await checkWebAuthnSupport("authentication");
      if (!support.supported) {
        throw new Error(support.reason || "Passkey authentication requires opening the application directly in a secure browser window.");
      }

      const clientHostname = window.location.hostname;
      const clientOrigin = window.location.origin;

      // Step 1: Generate authentication challenge options from server
      console.log("[WebAuthn] 1. Requesting authentication options from server...");
      if (onProgress) onProgress("Generating WebAuthn authentication challenge...");

      const { options, challengeKey, rpID } = await fetchApi<{ options: any; challengeKey: string; rpID: string }>(
        "/api/webauthn/generate-authentication-options",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailOrCnic: emailOrCnic || "",
            clientHostname,
            clientOrigin,
          }),
        }
      );

      // Validate PublicKeyCredentialRequestOptions
      validateAuthenticationOptions(options);

      // Step 2: Call navigator.credentials.get() via simplewebauthn startAuthentication
      console.log("[WebAuthn] 2. Calling navigator.credentials.get()... Target RP ID:", rpID || options?.rpId);
      if (onProgress) onProgress("Please verify Face ID / Touch ID / Fingerprint / PIN on your device...");

      let asseResp;
      try {
        asseResp = await startAuthentication({ optionsJSON: options });
        console.log("[WebAuthn] startAuthentication completed successfully! Credential ID:", asseResp?.id);
      } catch (err: any) {
        // Detailed Logging & Stack Trace Audit (Requirements 1 & 2)
        console.error("[WebAuthn Authentication Error Audit]:", {
          errorName: err?.name,
          errorMessage: err?.message,
          errorCode: err?.code,
          errorStack: err?.stack,
          rawError: err,
          optionsJSON: options,
        });

        const name = err?.name || "";
        const msg = (err?.message || "").toLowerCase();

        if (name === "NotAllowedError") {
          if (msg.includes("not allowed in this context") || msg.includes("document is not allowed") || msg.includes("feature policy") || msg.includes("iframe")) {
            throw new Error(`Browser Iframe Policy Restriction: WebAuthn prompt is restricted in this embed context. Please open app in a new tab or browser window. (${err.message})`);
          }
          if (msg.includes("time") || msg.includes("timeout") || msg.includes("expired")) {
            throw new Error("Passkey prompt timed out waiting for biometric or PIN verification. Please try again.");
          }
          if (msg.includes("no passkey") || msg.includes("no credentials") || msg.includes("not found")) {
            throw new Error("No matching Passkey was found on this device for this account.");
          }
          if (msg.includes("cancel") || msg.includes("closed") || msg.includes("user denied") || msg.includes("user abort")) {
            const cancelErr = new Error("Passkey authentication prompt was closed or cancelled by the user.");
            cancelErr.name = "PasskeyCancelledError";
            throw cancelErr;
          }
          const detailedErr = new Error(`Passkey prompt closed or not allowed (${err.message || "Prompt closed or unavailable"}).`);
          detailedErr.name = "PasskeyCancelledError";
          throw detailedErr;
        }

        if (name === "SecurityError") {
          throw new Error(`WebAuthn Security Error: Origin domain mismatch with RP ID "${options?.rpId}". (${err.message})`);
        }

        if (name === "NotSupportedError") {
          throw new Error(`Passkeys Not Supported: ${err.message || "Your browser or device does not support passkey authentication."}`);
        }

        throw new Error(err.message || `Passkey authentication failed (${name || "Unknown Error"}).`);
      }

      // Step 3: Verify assertion response on server
      console.log("[WebAuthn] 3. Verifying assertion response with server...");
      if (onProgress) onProgress("Verifying Passkey assertion with server...");

      const result = await fetchApi("/api/webauthn/verify-authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrCnic: emailOrCnic || "",
          response: asseResp,
          challengeKey,
          passkeys: clientPasskeys,
          clientHostname,
          clientOrigin,
        }),
      });

      console.log("[WebAuthn] 4. Passkey authentication verified successfully!");
      if (onProgress) onProgress("Passkey authentication completed successfully!");

      return result;
    })(),
    30000,
    "Passkey authentication timed out after 30 seconds. Please try again."
  );
}
