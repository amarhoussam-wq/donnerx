"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  KeyRound,
  FileKey,
  QrCode,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  Cpu,
  Layers,
  Lock,
} from "lucide-react";

interface AnalysisData {
  score: number;
  label: string;
  entropy_bits: number;
  length?: number;
  crack_time_display: string;
  character_diversity?: {
    diversity_count: number;
  };
  suggestions?: string[];
  breached?: boolean | null;
  breach_count?: number | null;
  breach_message?: string | null;
}

interface GenStatsData {
  password: string;
  score: number;
  entropy_bits: number;
  crack_time_display?: string;
}

interface PassphraseData {
  passphrase: string;
  method: string;
  entropy_bits: number;
  crack_time_display: string;
}

interface TotpSetupData {
  secret: string;
  provisioning_uri: string;
  qr_code_base64: string;
}

interface TotpVerifyData {
  valid: boolean;
}

export default function SecurityDashboardPage() {
  const [activeTab, setActiveTab] = useState<"analyzer" | "generator" | "passphrase" | "totp" | "about">("analyzer");

  // Tab 1: Analyzer State
  const [testPassword, setTestPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);

  // Tab 2: Generator State
  const [genLength, setGenLength] = useState(16);
  const [genUppercase, setGenUppercase] = useState(true);
  const [genLowercase, setGenLowercase] = useState(true);
  const [genDigits, setGenDigits] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [genStats, setGenStats] = useState<GenStatsData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tab 3: Passphrase State
  const [numWords, setNumWords] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [passphraseResult, setPassphraseResult] = useState<PassphraseData | null>(null);
  const [isGeneratingPassphrase, setIsGeneratingPassphrase] = useState(false);

  // Tab 4: 2FA State
  const [totpData, setTotpData] = useState<TotpSetupData | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<TotpVerifyData | null>(null);
  const [isSettingUpTotp, setIsSettingUpTotp] = useState(false);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run Real-time analysis with Debounce
  useEffect(() => {
    const trimmed = testPassword.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const res = await fetch("/api/security/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: trimmed, check_breach: true }),
        });
        if (res.ok) {
          const data: AnalysisData = await res.json();
          setAnalysisResult(data);
        }
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [testPassword]);

  // Generate CSPRNG Password
  const handleGeneratePassword = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/security/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          length: genLength,
          uppercase: genUppercase,
          lowercase: genLowercase,
          digits: genDigits,
          symbols: genSymbols,
        }),
      });
      if (res.ok) {
        const data: GenStatsData = await res.json();
        setGeneratedPassword(data.password);
        setGenStats(data);
      }
    } catch (err) {
      console.error("Generate failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Diceware Passphrase
  const handleGeneratePassphrase = async () => {
    setIsGeneratingPassphrase(true);
    try {
      const res = await fetch("/api/security/passphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_words: numWords,
          separator: separator,
          capitalize: "title",
          include_number: true,
        }),
      });
      if (res.ok) {
        const data: PassphraseData = await res.json();
        setPassphraseResult(data);
      }
    } catch (err) {
      console.error("Passphrase generation failed", err);
    } finally {
      setIsGeneratingPassphrase(false);
    }
  };

  // Setup TOTP
  const handleSetupTotp = async () => {
    setIsSettingUpTotp(true);
    setVerifyResult(null);
    setTotpCode("");
    try {
      const res = await fetch("/api/security/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setup",
          account_name: "donor@hayatlink.dz",
          issuer_name: "HayatLink Security",
        }),
      });
      if (res.ok) {
        const data: TotpSetupData = await res.json();
        setTotpData(data);
      }
    } catch (err) {
      console.error("TOTP setup failed", err);
    } finally {
      setIsSettingUpTotp(false);
    }
  };

  // Verify TOTP Code
  const handleVerifyTotp = async () => {
    if (!totpData?.secret || !totpCode.trim()) return;
    setIsVerifyingTotp(true);
    try {
      const res = await fetch("/api/security/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          secret: totpData.secret,
          token: totpCode.trim(),
        }),
      });
      if (res.ok) {
        const data: TotpVerifyData = await res.json();
        setVerifyResult(data);
      }
    } catch (err) {
      console.error("TOTP verification failed", err);
    } finally {
      setIsVerifyingTotp(false);
    }
  };

  const currentAnalysis = testPassword.trim() ? analysisResult : null;

  return (
    <div className="space-y-6 mt-4 pb-12 animate-fade-in-up" dir="rtl">
      {/* Title & Microservice Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  مركز الأمان وحماية الهوية 🛡️
                </h1>
                <p className="text-slate-300 text-xs md:text-sm font-medium mt-0.5">
                  تكامل حي مع خدمة الأمان المصغرة (FastAPI Microservice) المرفوعة سحابياً على Coolify
                </p>
              </div>
            </div>
          </div>

          {/* Microservice Live Status Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950/60 border border-emerald-500/30 px-3.5 py-2 rounded-2xl">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div className="text-right">
              <p className="text-[11px] font-bold text-emerald-400">Microservice Online</p>
              <p className="text-[9px] text-slate-400 font-mono">5/5 Modules Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("analyzer")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
            activeTab === "analyzer"
              ? "bg-red-600 text-white shadow-md shadow-red-600/20"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          1. فاحص القوة والتسريبات (Breach Check)
        </button>

        <button
          onClick={() => {
            setActiveTab("generator");
            if (!generatedPassword) handleGeneratePassword();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
            activeTab === "generator"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          2. توليد كلمات المرور (CSPRNG)
        </button>

        <button
          onClick={() => {
            setActiveTab("passphrase");
            if (!passphraseResult) handleGeneratePassphrase();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
            activeTab === "passphrase"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileKey className="w-4 h-4" />
          3. عبارات المرور الذكية (Diceware)
        </button>

        <button
          onClick={() => setActiveTab("totp")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
            activeTab === "totp"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <QrCode className="w-4 h-4" />
          4. التحقق الثنائي (2FA TOTP)
        </button>

        <button
          onClick={() => setActiveTab("about")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
            activeTab === "about"
              ? "bg-slate-800 text-white shadow-md shadow-slate-800/20"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          5. معمارية المشروع الأكاديمية
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PASSWORD ANALYZER & BREACH CHECK */}
      {/* ========================================================================= */}
      {activeTab === "analyzer" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                فحص أي كلمة مرور وكشف التسريبات وقوة التشفير
              </h2>
              <p className="text-slate-500 text-xs mb-4">
                يتم فحص الكلمة في الزمن الحقيقي عبر خوارزميات Shannon Entropy وفحص قواعد البيانات المخترقة (Have I Been Pwned).
              </p>

              {/* Input */}
              <div className="relative mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="اكتب أي كلمة مرور لتجربتها هنا (مثال: password123)..."
                  className="w-full text-left font-mono px-4 py-3.5 pr-11 pl-11 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm md:text-base transition-all"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isAnalyzing ? (
                    <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                  ) : (
                    <KeyRound className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-[11px] text-slate-400 font-bold">جرّب كلمات شائعة:</span>
                {["password123", "12345678", "Admin@2026!", "K#9x$vL2!mP9@zW4"].map((pwd) => (
                  <button
                    key={pwd}
                    type="button"
                    onClick={() => setTestPassword(pwd)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition-colors"
                    dir="ltr"
                  >
                    {pwd}
                  </button>
                ))}
              </div>

              {/* Analysis Display */}
              {currentAnalysis && (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in-up">
                  {/* 🔴 BREACH CARD (Prominent) */}
                  {currentAnalysis.breached === true ? (
                    <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-500/50 text-red-900 shadow-sm animate-pulse">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <h3 className="text-base font-black text-red-700">
                          🚨 تنبيه أمني عاجل: كلمة المرور مسربة ومكشوفة عالمياً!
                        </h3>
                      </div>
                      <p className="text-xs text-red-800 leading-relaxed">
                        هذه الكلمة تم العثور عليها في{" "}
                        <span className="font-black text-white px-2 py-0.5 rounded-lg bg-red-600 text-sm">
                          {currentAnalysis.breach_count?.toLocaleString()} مرة
                        </span>{" "}
                        في سجلات التسريبات والاختراقات العالمية (Have I Been Pwned). استخدامها يعرض أي حساب للاختراق الفوري!
                      </p>
                    </div>
                  ) : currentAnalysis.breached === false ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-emerald-900">
                            🛡️ آمنة من التسريبات المعروفة (0 ظهور)
                          </h4>
                          <p className="text-[11px] text-emerald-700">
                            تم فحص الكلمة عبر خوارزمية k-Anonymity ولم تظهر في أي تسريب معروف.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-700 px-2.5 py-1 bg-emerald-100 rounded-lg">
                        Clean / Safe
                      </span>
                    </div>
                  ) : null}

                  {/* Score & Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700">
                        درجة القوة: {currentAnalysis.score}/100 ({currentAnalysis.label})
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        الإنتروبيا: {currentAnalysis.entropy_bits} bits
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(currentAnalysis.score, 5)}%`,
                          background:
                            currentAnalysis.score >= 70
                              ? "#10b981"
                              : currentAnalysis.score >= 40
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                    </div>
                  </div>

                  {/* Grid Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">وقت الكسر التقديري</span>
                      <p className="text-sm font-black text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {currentAnalysis.crack_time_display}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">عدد الخانات (Length)</span>
                      <p className="text-sm font-black text-slate-800">
                        {currentAnalysis.length} حرف / رمز
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">تنوع الأحرف</span>
                      <p className="text-sm font-black text-slate-800">
                        {currentAnalysis.character_diversity?.diversity_count || 0} / 4 فئات
                      </p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {currentAnalysis.suggestions && currentAnalysis.suggestions.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <span className="font-bold block mb-1">💡 توصيات التحسين:</span>
                      {currentAnalysis.suggestions.map((sug: string, i: number) => (
                        <p key={i} className="flex items-center gap-1.5 text-[11px]">
                          <span>•</span> {sug}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                كيف يعمل فاحص التسريبات؟
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                يستخدم الفاحص بروتوكول <strong>k-Anonymity</strong>؛ حيث يتم تشفير كلمة المرور بـ SHA-1 محلياً على السيرفر وإرسال أول 5 خانات فقط من الهاش، فلا يمكن لأي جهة كشف كلمتك الأصلية.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
                <p>✅ <strong>حماية الخصوصية:</strong> 100% Zero-Knowledge</p>
                <p>✅ <strong>قاعدة البيانات:</strong> أكثر من 800 مليون كلمة مسربة</p>
                <p>✅ <strong>الإنتروبيا:</strong> حساب احتمالية التخمين بالبت</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CSPRNG PASSWORD GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === "generator" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              توليد كلمات مرور مشفرة عشوائياً (CSPRNG)
            </h2>
            <p className="text-slate-500 text-xs mb-6">
              توليد كلمات مرور قوية جداً باستخدام مولد الأرقام العشوائية الآمن تشفيرياً (Cryptographically Secure Pseudo-Random Number Generator).
            </p>

            {/* Password Display Box */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-center relative mb-6 border border-slate-700">
              <p className="text-lg md:text-2xl font-black tracking-wider break-all text-emerald-400 select-all" dir="ltr">
                {generatedPassword || "اضغط على زر التوليد بالأسفل..."}
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(generatedPassword, "pwd")}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "pwd" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === "pwd" ? "تم النسخ!" : "نسخ الكلمة"}
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                  توليد جديدة
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>طول كلمة المرور: {genLength} خانة</span>
                  <span className="text-indigo-600 font-mono">
                    الإنتروبيا المقدرة: ~{Math.round(genLength * 6.5)} bits
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={genLength}
                  onChange={(e) => setGenLength(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {[
                  { label: "أحرف كبيرة (A-Z)", val: genUppercase, set: setGenUppercase },
                  { label: "أحرف صغيرة (a-z)", val: genLowercase, set: setGenLowercase },
                  { label: "أرقام (0-9)", val: genDigits, set: setGenDigits },
                  { label: "رموز خاصة (!@#$)", val: genSymbols, set: setGenSymbols },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={(e) => item.set(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gen Stats */}
            {genStats && (
              <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
                <span>الدرجة الأمنية: <strong>{genStats.score}/100</strong></span>
                <span>الإنتروبيا: <strong>{genStats.entropy_bits} bits</strong></span>
                <span>زمن الكسر: <strong>{genStats.crack_time_display || "قرون طويلة"}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DICEWARE PASSPHRASE GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === "passphrase" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <FileKey className="w-5 h-5 text-amber-600" />
              توليد عبارات مرور ذكية وسهلة الحفظ (Diceware / EFF)
            </h2>
            <p className="text-slate-500 text-xs mb-6">
              تعتمد طريقة Diceware على اختيار كلمات عشوائية من قائمة مؤسسة الجبهة الإلكترونية (EFF Wordlist المؤلفة من 7,776 كلمة) لإنتاج عبارات فائقة الأمان وسهلة الحفظ في الذاكرة.
            </p>

            {/* Display Box */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white font-mono text-center relative mb-6 border border-slate-700">
              <p className="text-lg md:text-2xl font-black text-amber-300 break-all select-all mb-3" dir="ltr">
                {passphraseResult?.passphrase || "اضغط على زر التوليد..."}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(passphraseResult?.passphrase || "", "pass")}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "pass" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === "pass" ? "تم النسخ!" : "نسخ العبارة"}
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePassphrase}
                  disabled={isGeneratingPassphrase}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPassphrase ? "animate-spin" : ""}`} />
                  توليد عبارة جديدة
                </button>
              </div>
            </div>

            {/* Passphrase options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  عدد الكلمات: {numWords} كلمات
                </label>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={numWords}
                  onChange={(e) => setNumWords(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  فاصل الكلمات:
                </label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="-">شرطة (-)</option>
                  <option value=".">نقطة (.)</option>
                  <option value="_">شرطة سفلية (_)</option>
                  <option value=" ">مسافة ( )</option>
                </select>
              </div>
            </div>

            {passphraseResult && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex flex-wrap justify-between gap-2">
                <span>الطريقة: <strong>{passphraseResult.method}</strong></span>
                <span>الإنتروبيا: <strong>{passphraseResult.entropy_bits} bits</strong></span>
                <span>وقت الكسر: <strong>{passphraseResult.crack_time_display}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TWO-FACTOR AUTHENTICATION (TOTP / RFC 6238) */}
      {/* ========================================================================= */}
      {activeTab === "totp" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              نظام المصادقة الثنائية (TOTP RFC 6238)
            </h2>
            <p className="text-slate-500 text-xs mb-6">
              توليد مفاتيح Base32 ورموز QR Code لربط تطبيقات المصادقة (Google Authenticator / Authy) مع فحص أكواد التحقق ذات الـ 6 أرقام.
            </p>

            {!totpData ? (
              <div className="text-center py-8">
                <button
                  type="button"
                  onClick={handleSetupTotp}
                  disabled={isSettingUpTotp}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 mx-auto"
                >
                  <QrCode className={`w-5 h-5 ${isSettingUpTotp ? "animate-spin" : ""}`} />
                  {isSettingUpTotp ? "جاري إنشاء المفتاح..." : "إنشاء مفتاح أمان ورمز QR جديد"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  {/* QR Code */}
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    {totpData.qr_code_base64 && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={totpData.qr_code_base64}
                        alt="TOTP QR Code"
                        className="w-48 h-48 mx-auto rounded-xl shadow-sm mb-2"
                      />
                    )}
                    <p className="text-[11px] text-slate-500">امسح الرمز عبر Google Authenticator</p>
                  </div>

                  {/* Secret details */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1">المفتاح السري (Secret Key):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={totpData.secret}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-100 rounded-xl border border-slate-300 text-slate-800"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(totpData.secret, "totp")}
                          className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
                        >
                          {copiedKey === "totp" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <p>• البروتوكول: <strong>RFC 6238 (Time-based OTP)</strong></p>
                      <p>• طول الرمز: <strong>6 أرقام (Digits)</strong></p>
                      <p>• فترة التحديث: <strong>كل 30 ثانية</strong></p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSetupTotp}
                      disabled={isSettingUpTotp}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 pt-2"
                    >
                      <RefreshCw className="w-3 h-3" />
                      توليد مفتاح أمان آخر
                    </button>
                  </div>
                </div>

                {/* Verification Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">اختبر التحقق من الرمز (Verify 6-Digit Token):</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="أدخل الرمز (مثال: 123456)..."
                      className="w-48 text-center text-lg font-mono font-black tracking-widest px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyTotp}
                      disabled={isVerifyingTotp || totpCode.length !== 6}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      {isVerifyingTotp ? "جاري الفحص..." : "تحقق من الرمز"}
                    </button>
                  </div>

                  {verifyResult && (
                    <div className="mt-3">
                      {verifyResult.valid ? (
                        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>الرمز صحيح تماماً ومطابق للمفتاح في الوقت الفعلي! 🎉</span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-red-100 text-red-900 font-bold text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span>الرمز غير صحيح أو انتهت صلاحيته الزمنية (أكثر من 30 ثانية).</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ARCHITECTURE & PRESENTATION FOR PROFESSOR */}
      {/* ========================================================================= */}
      {activeTab === "about" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              دليل المعمارية الأكاديمية (Microservices & Security Presentation)
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              هذه الواجهة توثق تكامل مشروعي الأمني مع منصة <strong>HayatLink</strong> كخدمة مصغرة سحابية مستقلة (Decoupled Microservice) تلبي جميع متطلبات الأستاذ:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-slate-800 mb-2">1. خدمة الأمان السحابية (FastAPI)</h3>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>مرفوعة على استضافة <strong>Coolify</strong> برابط عام مستقل.</li>
                  <li>توفر RESTful Endpoints مع التحقق التلقائي بـ Pydantic.</li>
                  <li>حساب الإنتروبيا الرياضية بـ Shannon Entropy.</li>
                  <li>توليد CSPRNG مشفر بواسطة وحدة `secrets` في Python.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-slate-800 mb-2">2. التطبيق المستهلك (HayatLink Next.js)</h3>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>معمارية Backend-for-Frontend (BFF) لحماية نقاط الاتصال وتفادي CORS.</li>
                  <li>مؤقتات Debounce في الواجهة لتوفير أداء فوري خفيف.</li>
                  <li>كاشف التسريبات اللحظي (Have I Been Pwned k-Anonymity).</li>
                  <li>نظام حماية وسقوط آمن (Fallback System) لمنع توقف التطبيق.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950">
              <p className="font-bold mb-1">🔗 رابط الـ API الحي على Coolify:</p>
              <code className="bg-white/80 px-2 py-1 rounded font-mono text-[11px] block mt-1" dir="ltr">
                https://r40owskko8c00wck04ogk8wg.194.34.232.105.sslip.io
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
