"use client";

import React from "react";
import { Sparkles, ShieldCheck, ShieldAlert, Clock, AlertTriangle, RefreshCw } from "lucide-react";
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

  // Determine color based on score
  let badgeColor = "#ef4444"; // red
  let badgeText = "ضعيفة جداً";
  let barWidth = `${Math.max(score, 5)}%`;

  if (score >= 80) {
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
        background: "rgba(15, 23, 42, 0.65)",
        border: `1px solid ${isBreached ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.08)"}`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header: Score + Microservice Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
            style={{
              background: `${badgeColor}22`,
              color: badgeColor,
              border: `1px solid ${badgeColor}55`,
            }}
          >
            {score >= 65 ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
            {badgeText} ({score}/100)
          </span>

          {isLoading && (
            <span className="text-[10px] text-slate-400 animate-pulse">جاري الفحص...</span>
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
          {analysis.fallback ? "فحص احتياطي" : "Security API Active"}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: barWidth,
            background: `linear-gradient(90deg, #ef4444 0%, ${badgeColor} 100%)`,
          }}
        />
      </div>

      {/* Metrics: Entropy & Crack Time */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 mb-2">
        <div
          className="p-1.5 rounded-lg flex items-center justify-between"
          style={{ background: "rgba(255, 255, 255, 0.03)" }}
        >
          <span className="text-slate-400">الإنتروبيا (Entropy):</span>
          <span className="font-bold font-mono text-cyan-300">{entropy} bits</span>
        </div>

        <div
          className="p-1.5 rounded-lg flex items-center justify-between"
          style={{ background: "rgba(255, 255, 255, 0.03)" }}
        >
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> وقت الكسر:
          </span>
          <span className="font-semibold text-amber-200">{crackTime || "غير محدد"}</span>
        </div>
      </div>

      {/* Breach Warning (if breached) */}
      {isBreached && (
        <div
          className="p-2 rounded-xl mb-2 flex items-start gap-1.5 text-[10px]"
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fca5a5",
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-400" />
          <span>
            {analysis.breach_message || "تنبيه: كلمة المرور هذه مسربة في قواعد بيانات مخترقة!"}
          </span>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1 mb-2">
          {suggestions.slice(0, 2).map((sug, i) => (
            <div key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="text-amber-400">•</span> {sug}
            </div>
          ))}
        </div>
      )}

      {/* Generate Password Quick Action (if provided) */}
      {onGeneratePassword && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">تريد كلمة مرور لا يمكن تخمينها؟</span>
          <button
            type="button"
            onClick={onGeneratePassword}
            disabled={isGenerating}
            className="text-[10px] font-bold text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            توليد تلقائي
          </button>
        </div>
      )}
    </div>
  );
}
