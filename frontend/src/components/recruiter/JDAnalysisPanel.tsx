"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, AlertTriangle, Search, Lightbulb, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface FlaggedWord {
  word: string;
  type: "bias" | "complex";
  suggestion: string;
}

interface JDAnalysis {
  biasScore: number;
  readabilityScore: number;
  genderCoding: "masculine" | "feminine" | "neutral";
  flaggedWords: FlaggedWord[];
  seoKeywords: string[];
  suggestions: string[];
}

interface Props {
  jobDescription: string;
}

function BiasScoreBadge({ score }: { score: number }) {
  const level = score < 25 ? "low" : score < 60 ? "medium" : "high";
  const colors = {
    low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    high: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };
  const labels = { low: "Low Bias", medium: "Moderate Bias", high: "High Bias" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors[level]}`}>
      {labels[level]} ({score}/100)
    </span>
  );
}

function GenderChip({ coding }: { coding: string }) {
  const colors = {
    masculine: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    feminine: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    neutral: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  const c = colors[coding as keyof typeof colors] || colors.neutral;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${c}`}>
      {coding} coded
    </span>
  );
}

export default function JDAnalysisPanel({ jobDescription }: Props) {
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const analyze = useCallback(async (text: string) => {
    if (text.trim().length < 100) return;
    setLoading(true);
    try {
      const res = await authFetch("/recruiter/ai-assistant/analyze-jd", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setAnalysis(json.data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (jobDescription.trim().length >= 100) {
        analyze(jobDescription);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [jobDescription, analyze]);

  if (jobDescription.trim().length < 100) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-center text-sm text-gray-400 dark:text-gray-500">
        Start writing your job description to see AI bias and SEO analysis.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">JD Analysis</span>
        </div>
        {loading && <RefreshCw className="h-3.5 w-3.5 text-gray-400 animate-spin" />}
      </div>

      {loading && !analysis && (
        <div className="space-y-2 animate-pulse">
          {[3, 2, 4].map((w, i) => (
            <div key={i} className={`h-3 bg-gray-200 dark:bg-gray-700 rounded w-${w}/4`} />
          ))}
        </div>
      )}

      {analysis && (
        <>
          {/* Score chips */}
          <div className="flex flex-wrap gap-2">
            <BiasScoreBadge score={analysis.biasScore} />
            <GenderChip coding={analysis.genderCoding} />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              Grade {analysis.readabilityScore} readability
            </span>
          </div>

          {/* Flagged words */}
          {analysis.flaggedWords.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Flagged Words
              </p>
              <div className="space-y-1.5">
                {analysis.flaggedWords.map((fw, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-medium flex-shrink-0 ${
                        fw.type === "bias"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {fw.word}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">→</span>
                    <span className="text-gray-600 dark:text-gray-300">{fw.suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO keywords */}
          {analysis.seoKeywords.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Search className="h-3.5 w-3.5 text-blue-500" />
                SEO Keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.seoKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-800"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions (collapsible) */}
          {analysis.suggestions.length > 0 && (
            <div>
              <button
                onClick={() => setShowSuggestions((s) => !s)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {analysis.suggestions.length} Suggestions
                {showSuggestions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showSuggestions && (
                <ul className="mt-2 space-y-1">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex gap-1.5">
                      <span className="text-indigo-400 flex-shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
