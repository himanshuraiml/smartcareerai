"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, AlertTriangle, RefreshCw, DollarSign } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface SalaryData {
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  currency: string;
  reasoning: string;
  source: string;
  lastUpdated: string;
}

interface Props {
  role: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
}

function formatSalary(value: number, currency: string): string {
  if (!value) return "—";
  if (currency === "INR") {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString("en-IN")}`;
  }
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value.toLocaleString()}`;
}

export default function SalaryBenchmarkPanel({ role, location, salaryMin, salaryMax }: Props) {
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (r: string, l: string) => {
    if (!r.trim()) return;
    setLoading(true);
    try {
      const res = await authFetch("/recruiter/ai-assistant/salary-band", {
        method: "POST",
        body: JSON.stringify({ title: r, location: l, experienceLevel: "Mid-Level" }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json.data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      if (role.trim().length > 2) fetchData(role, location);
    }, 800);
    setDebounceTimer(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, location]);

  if (!role.trim()) return null;

  const isBelowMarket = data && salaryMax > 0 && salaryMax < data.p25;
  const isAtMarket = data && salaryMax >= data.p25 && salaryMax <= data.p75;
  const isAboveMarket = data && salaryMax > data.p75;

  // Compute where salary range falls on the p25-p75 spectrum
  const getBarPosition = (value: number) => {
    if (!data || !value) return 0;
    const range = data.p75 - data.p25;
    if (range <= 0) return 50;
    return Math.min(100, Math.max(0, ((value - data.p25) / range) * 100));
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Market Salary Benchmarks</span>
        </div>
        {loading && <RefreshCw className="h-3.5 w-3.5 text-gray-400 animate-spin" />}
      </div>

      {loading && !data && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      )}

      {data && (
        <>
          {/* Percentile row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "P25", value: data.p25, color: "text-amber-600 dark:text-amber-400" },
              { label: "P50 (Median)", value: data.p50, color: "text-blue-600 dark:text-blue-400" },
              { label: "P75", value: data.p75, color: "text-emerald-600 dark:text-emerald-400" },
            ].map((p) => (
              <div key={p.label} className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2">
                <p className={`text-sm font-bold ${p.color}`}>{formatSalary(p.value, data.currency)}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{p.label}</p>
              </div>
            ))}
          </div>

          {/* Visual bar */}
          <div className="space-y-1">
            <div className="relative h-3 bg-gradient-to-r from-amber-200 via-blue-200 to-emerald-200 dark:from-amber-900/40 dark:via-blue-900/40 dark:to-emerald-900/40 rounded-full">
              {/* P50 tick */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-blue-400 rounded-full" style={{ left: "50%" }} />
              {/* Your salary min marker */}
              {salaryMin > 0 && (
                <div
                  className="absolute -top-1 h-5 w-1.5 bg-indigo-500 rounded-full shadow-sm"
                  style={{ left: `${getBarPosition(salaryMin)}%` }}
                  title={`Your min: ${formatSalary(salaryMin, data.currency)}`}
                />
              )}
              {/* Your salary max marker */}
              {salaryMax > 0 && (
                <div
                  className="absolute -top-1 h-5 w-1.5 bg-indigo-700 rounded-full shadow-sm"
                  style={{ left: `${getBarPosition(salaryMax)}%` }}
                  title={`Your max: ${formatSalary(salaryMax, data.currency)}`}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{formatSalary(data.p25, data.currency)} (P25)</span>
              <span>{formatSalary(data.p75, data.currency)} (P75)</span>
            </div>
          </div>

          {/* Your range */}
          {(salaryMin > 0 || salaryMax > 0) && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Your range: <span className="font-medium text-gray-800 dark:text-gray-200">
                {formatSalary(salaryMin, data.currency)} – {formatSalary(salaryMax, data.currency)}
              </span>
            </div>
          )}

          {/* Warning / status */}
          {isBelowMarket && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-rose-700 dark:text-rose-300">Below market rate</p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                  Your max ({formatSalary(salaryMax, data.currency)}) is below the P25 ({formatSalary(data.p25, data.currency)}). This may reduce application rates.
                </p>
              </div>
            </div>
          )}
          {isAtMarket && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2.5 py-2">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Competitive market rate</p>
            </div>
          )}
          {isAboveMarket && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2.5 py-2">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-xs text-blue-700 dark:text-blue-300">Above market — strong offer</p>
            </div>
          )}

          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Source: {data.source} · {data.currency}
          </p>
        </>
      )}
    </div>
  );
}
