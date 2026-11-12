"use client";

import React from "react";
import { Sparkles, ShieldCheck, ShieldAlert, Clock, AlertTriangle, CheckCircle2, RefreshCw, KeyRound } from "lucide-react";
import type { PasswordAnalysis } from "@/lib/security-api";

interface PasswordStrengthIndicatorProps {
  analysis: PasswordAnalysis | null;
  isLoading?: boolean;
  onGeneratePassword?: () => void;
  isGenerating?: boolean;
  accentColor?: string;
}

export function PasswordStrengthIndicator({
  analysis,
  isLoading = false,
  onGeneratePassword,
  isGenerating = false,
  accentColor = "#ef4444",
}: PasswordStrengthIndicatorProps) {
  if (!analysis) return null;

  const score = analysis.score ?? 0;
  const entropy = analysis.entropy_bits ?? 0;
  const crackTime = analysis.crack_time_display || "";
  const suggestions = analysis.suggestions || [];
  const isBreached = analysis.breached;
  const breachCount = analysis.breach_count;

  // Determine color based on score & breach
  let badgeColor = "#ef4444"; // red
  let badgeText = "ضعيفة جداً";
  const barWidth = `${Math.max(score, 5)}%`;

  if (isBreached) {
    badgeColor = "#ef4444";
    badgeText = "مسربة وغير آمنة";
  } else if (score >= 80) {
    badgeColor = "#10b981"; // emerald
    badgeText = "قوية جداً";
  } else if (score >= 65) {
    badgeColor = "#3b82f6"; // blue
    badgeText = "قوية";
  } else if (score >= 45) {
    badgeColor = "#f59e0b"; // amber
    badgeText = "متوسطة";
  } else if (score >= 25) {
    badgeColor = "#f97316"; // orange
    badgeText = "ضعيفة";
  }

  return (
    <div
      className="mt-2.5 p-3 rounded-2xl transition-all duration-300 text-right"
      style={{
        background: "rgba(15, 23, 42, 0.75)",
        border: `1px solid ${isBreached ? "rgba(239, 68, 68, 0.6)" : "rgba(255, 255, 255, 0.1)"}`,
        boxShadow: isBreached ? "0 0 20px rgba(239, 68, 68, 0.2)" : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header: Score + Microservice Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition-all"
            style={{
              background: `${badgeColor}22`,
              color: badgeColor,
              border: `1px solid ${badgeColor}55`,
            }}
          >
            {isBreached ? (
              <AlertTriangle className="w-3 h-3 text-red-400" />
            ) : score >= 65 ? (
              <ShieldCheck className="w-3 h-3" />
            ) : (
              <ShieldAlert className="w-3 h-3" />
            )}
            {badgeText} ({score}/100)
          </span>

          {isLoading && (
            <span className="text-[10px] text-slate-400 inline-flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" /> جاري الفحص والتسريبات...
            </span>
          )}
        </div>

        {/* Microservice attribution badge */}
        <span
          className="text-[9px] text-slate-400 font-mono flex items-center gap-1"
          title={analysis.fallback ? "فحص محلي احتياطي" : "متصل بـ Security Microservice API (Coolify)"}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: analysis.fallback ? "#f59e0b" : "#10b981" }}
          />
          {analysis.fallback ? "فحص احتياطي" : "Coolify API Active"}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: isBreached ? "100%" : barWidth,
            background: isBreached
              ? "#ef4444"
              : `linear-gradient(90deg, #ef4444 0%, ${badgeColor} 100%)`,
          }}
        />
      </div>

      {/* 🔴 BREACH STATUS SECTION (Have I Been Pwned) */}
      {isBreached === true ? (
        <div
          className="p-2.5 rounded-xl mb-2.5 text-[11px] border border-red-500/50 bg-red-950/40 text-red-200 animate-pulse"
          style={{ boxShadow: "0 0 15px rgba(239, 68, 68, 0.25)" }}
        >
          <div className="flex items-center gap-1.5 font-bold text-red-400 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>⚠️ تحذير: كلمة المرور هذه مسربة ومكشوفة!</span>
          </div>
          <p className="text-[10px] text-red-300 leading-relaxed">
            ظهرت في{" "}
            <span className="font-black text-white px-1.5 py-0.5 rounded bg-red-500/30 border border-red-500/40">
              {typeof breachCount === "number" ? breachCount.toLocaleString() : "العديد من"} مرة
            </span>{" "}
            في قواعد البيانات المخترقة عالمياً (Have I Been Pwned). لا تستخدمها نهائياً!
          </p>
        </div>
      ) : isBreached === false ? (
        <div className="p-2 rounded-xl mb-2 text-[10px] border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>فحص التسريبات العالمية (HIBP):</span>
          </div>
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            آمنة تماماً (0 ظهور في التسريبات)
          </span>
        </div>
      ) : null}

      {/* Metrics: Entropy & Crack Time */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 mb-2">
        <div
          className="p-1.5 rounded-lg flex items-center justify-between"
          style={{ background: "rgba(255, 255, 255, 0.04)" }}
        >
          <span className="text-slate-400">الإنتروبيا (Entropy):</span>
          <span className="font-bold font-mono text-cyan-300">{entropy} bits</span>
        </div>

        <div
          className="p-1.5 rounded-lg flex items-center justify-between"
          style={{ background: "rgba(255, 255, 255, 0.04)" }}
        >
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-amber-400" /> وقت الكسر التقديري:
          </span>
          <span className="font-semibold text-amber-200">{crackTime || "غير محدد"}</span>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1 mb-2">
          {suggestions.slice(0, 2).map((sug, i) => (
            <div key={i} className="text-[10px] text-slate-300 flex items-center gap-1">
              <span className="text-amber-400">•</span> {sug}
            </div>
          ))}
        </div>
      )}

      {/* Generate Password Quick Action (if provided) */}
      {onGeneratePassword && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-slate-400" />
            {isBreached ? "ولّد بديلاً آمناً فوراً:" : "توليد كلمة مرور قوية وغير مخترقة:"}
          </span>
          <button
            type="button"
            onClick={onGeneratePassword}
            disabled={isGenerating}
            className="text-[10px] font-bold text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: isBreached
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            توليد CSPRNG
          </button>
        </div>
      )}
    </div>
  );
}
