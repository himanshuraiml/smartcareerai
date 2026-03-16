"use client";

import { useState } from "react";
import { X, Star, ClipboardList, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/lib/auth-fetch";

const DIMENSIONS = [
  "Technical Skills",
  "Problem Solving",
  "Communication",
  "Cultural Fit",
  "Leadership Potential",
];

const RECOMMENDATIONS = [
  { value: "STRONG_HIRE", label: "Strong Hire", color: "emerald" },
  { value: "HIRE", label: "Hire", color: "blue" },
  { value: "MAYBE", label: "Maybe", color: "amber" },
  { value: "NO_HIRE", label: "No Hire", color: "rose" },
] as const;

interface Props {
  applicationId: string;
  assignmentId: string;
  candidateName: string;
  jobTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ScorecardFormModal({
  applicationId,
  candidateName,
  jobTitle,
  onClose,
  onSuccess,
}: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(DIMENSIONS.map((d) => [d, 0])),
  );
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overallRating =
    Object.values(ratings).reduce((a, b) => a + b, 0) /
    Math.max(1, Object.values(ratings).filter((v) => v > 0).length);

  async function handleSubmit() {
    const unfilled = DIMENSIONS.filter((d) => !ratings[d]);
    if (unfilled.length > 0) {
      setError(`Please rate all dimensions: ${unfilled.join(", ")}`);
      return;
    }
    if (!recommendation) {
      setError("Please select a hiring recommendation.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const dimensions = DIMENSIONS.map((name) => ({ name, rating: ratings[name] }));
      const res = await authFetch(`/recruiter/applications/${applicationId}/scorecards`, {
        method: "POST",
        body: JSON.stringify({ dimensions, notes: notes.trim() || undefined, recommendation }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || json.message || "Failed to submit scorecard.");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-[2rem] shadow-2xl w-full max-w-lg my-4 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent Glow */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
          {/* Header */}
          <div className="relative flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-sm shadow-indigo-500/10">
                <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-base tracking-tight">Interview Scorecard</h3>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{candidateName} · {jobTitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95 group">
              <X className="h-5 w-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Dimensions */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rate Each Dimension</h4>
              {DIMENSIONS.map((dim) => (
                <div key={dim} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.02] border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all group">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{dim}</label>
                  <StarRating value={ratings[dim]} onChange={(v) => setRatings((r) => ({ ...r, [dim]: v }))} />
                </div>
              ))}
            </div>

            {/* Overall */}
            {overallRating > 0 && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest font-black">Overall Average</span>
                <span className="text-lg font-black text-amber-500">{overallRating.toFixed(1)} <span className="text-[10px] font-bold opacity-70">/ 5</span></span>
              </div>
            )}

            {/* Recommendation */}
            <div>
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Hiring Recommendation</h4>
              <div className="grid grid-cols-2 gap-3">
                {RECOMMENDATIONS.map((rec) => {
                  const colorMap: Record<string, string> = {
                    emerald: "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/10",
                    blue: "border-blue-500/50 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-lg shadow-blue-500/10",
                    amber: "border-amber-500/50 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-lg shadow-amber-500/10",
                    rose: "border-rose-500/50 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-lg shadow-rose-500/10",
                  };
                  const defaultColor = "border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95";
                  const isSelected = recommendation === rec.value;
                  return (
                    <button
                      key={rec.value}
                      onClick={() => setRecommendation(rec.value)}
                      className={`py-3.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest leading-none outline-none ${
                        isSelected ? colorMap[rec.color] : defaultColor
                      }`}
                    >
                      {rec.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">
                Additional Observations <span className="font-bold opacity-50 ml-1">(Optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe the candidate's performance, strengths, and concerns..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 resize-none transition-all"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-100 dark:border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 dark:border-white/5 flex gap-3 relative z-10">
            <button
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95 flex-1"
            >
              Discard
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-600/40 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all active:scale-95 flex-[2]"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT SCORECARD"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
