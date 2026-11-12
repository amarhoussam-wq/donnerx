/**
 * Security Microservice Client (Password Strength & Generator)
 * Integrates with FastAPI microservice deployed on Coolify
 */

export interface CharacterDiversity {
  has_lowercase: boolean;
  has_uppercase: boolean;
  has_digits: boolean;
  has_symbols: boolean;
  diversity_count: number;
}

export interface PasswordAnalysis {
  score: number; // 0 - 100
  label: "very weak" | "weak" | "moderate" | "strong" | "very strong" | string;
  entropy_bits: number;
  charset_size?: number;
  length?: number;
  crack_time_display: string;
  character_diversity?: CharacterDiversity;
  patterns_detected?: string[];
  suggestions?: string[];
  breached?: boolean | null;
  breach_count?: number | null;
  breach_message?: string | null;
  fallback?: boolean;
}

export interface GeneratePasswordOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  digits?: boolean;
  symbols?: boolean;
  exclude_ambiguous?: boolean;
}

export interface GeneratePasswordResponse {
  password: string;
  score: number;
  entropy_bits: number;
  crack_time_display?: string;
  fallback?: boolean;
}

const DEFAULT_API_URL = "https://r40owskko8c00wck04ogk8wg.194.34.232.105.sslip.io";

function getApiUrl(): string {
  return process.env.SECURITY_API_URL?.trim() || DEFAULT_API_URL;
}

/**
 * Local fallback calculation in case the remote API is unreachable or times out
 */
export function calculateLocalFallback(password: string): PasswordAnalysis {
  let score = 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);
  const length = password.length;

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigits) poolSize += 10;
  if (hasSymbols) poolSize += 32;

  const entropy = poolSize > 0 && length > 0 ? length * (Math.log(poolSize) / Math.LN2) : 0;

  if (length >= 8) score += 25;
  if (length >= 12) score += 15;
  if (length >= 16) score += 10;
  if (hasLower) score += 10;
  if (hasUpper) score += 15;
  if (hasDigits) score += 15;
  if (hasSymbols) score += 10;
  if (score > 100) score = 100;

  let label: string = "very weak";
  let crack_time = "ثوانٍ معدودة";
  if (score >= 80) {
    label = "very strong";
    crack_time = "قرون طويلة";
  } else if (score >= 65) {
    label = "strong";
    crack_time = "عدة سنوات";
  } else if (score >= 45) {
    label = "moderate";
    crack_time = "عدة أسابيع";
  } else if (score >= 25) {
    label = "weak";
    crack_time = "دقائق";
  }

  const suggestions: string[] = [];
  if (length < 10) suggestions.push("اجعل كلمة المرور أطول من 10 خانات");
  if (!hasUpper) suggestions.push("أضف حرفاً كبيراً على الأقل (A-Z)");
  if (!hasDigits) suggestions.push("أضف أرقاماً (0-9)");
  if (!hasSymbols) suggestions.push("أضف رموزاً خاصة (!@#$)");

  return {
    score,
    label,
    entropy_bits: Math.round(entropy * 100) / 100,
    charset_size: poolSize,
    length,
    crack_time_display: crack_time,
    character_diversity: {
      has_lowercase: hasLower,
      has_uppercase: hasUpper,
      has_digits: hasDigits,
      has_symbols: hasSymbols,
      diversity_count: [hasLower, hasUpper, hasDigits, hasSymbols].filter(Boolean).length,
    },
    patterns_detected: [],
    suggestions,
    fallback: true,
  };
}

/**
 * Local fallback password generator
 */
export function generateLocalFallback(length = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]:;?><,./-=";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Call the remote Coolify FastAPI microservice to analyze password
 */
export async function analyzePasswordRemote(
  password: string,
  checkBreach = false
): Promise<PasswordAnalysis> {
  if (!password) {
    return calculateLocalFallback("");
  }

  const baseUrl = getApiUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(`${baseUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, check_breach: checkBreach }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[SecurityAPI] Remote call failed with status: ${res.status}, falling back`);
      return calculateLocalFallback(password);
    }

    const data = await res.json();
    return {
      ...data,
      fallback: false,
    };
  } catch (err) {
    console.warn("[SecurityAPI] Failed to contact remote API, using local fallback:", err);
    return calculateLocalFallback(password);
  }
}

/**
 * Call the remote Coolify FastAPI microservice to generate password
 */
export async function generatePasswordRemote(
  options: GeneratePasswordOptions = {}
): Promise<GeneratePasswordResponse> {
  const baseUrl = getApiUrl();
  const body = {
    length: options.length ?? 16,
    uppercase: options.uppercase ?? true,
    lowercase: options.lowercase ?? true,
    digits: options.digits ?? true,
    symbols: options.symbols ?? true,
    exclude_ambiguous: options.exclude_ambiguous ?? false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${baseUrl}/generate/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const fallbackPwd = generateLocalFallback(body.length);
      const analysis = calculateLocalFallback(fallbackPwd);
      return {
        password: fallbackPwd,
        score: analysis.score,
        entropy_bits: analysis.entropy_bits,
        crack_time_display: analysis.crack_time_display,
        fallback: true,
      };
    }

    const data = await res.json();
    return {
      ...data,
      fallback: false,
    };
  } catch (err) {
    console.warn("[SecurityAPI] Failed to generate password remotely, using local fallback:", err);
    const fallbackPwd = generateLocalFallback(body.length);
    const analysis = calculateLocalFallback(fallbackPwd);
    return {
      password: fallbackPwd,
      score: analysis.score,
      entropy_bits: analysis.entropy_bits,
      crack_time_display: analysis.crack_time_display,
      fallback: true,
    };
  }
}
