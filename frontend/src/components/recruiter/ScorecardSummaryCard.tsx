"use client";

import { useState } from "react";
import { Star, CheckCircle, Clock, TrendingUp } from "lucide-react";
import ScorecardFormModal from "./ScorecardFormModal";

interface Assignment {
  assignmentId: string;
  interviewerId: string;
  interviewer: { id: string; name: string | null; email: string; avatarUrl: string | null };
  stageName: string;
  assignedAt: string;
  submitted: boolean;
  scorecard: {
    overallRating: number;
    recommendation: string;
    notes: string | null;
    dimensions: Array<{ name: string; rating: number }>;
  } | null;
}

interface Summary {
  totalAssigned: number;
  totalSubmitted: number;
  overallAvg: number | null;
  dimensionAverages: Array<{ name: string; avg: number }>;
}

interface Props {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  assignments: Assignment[];
  summary: Summary;
  currentUserId?: string;
  onScorecardSubmitted?: () => void;
}

const REC_COLORS: Record<string, string> = {
  STRONG_HIRE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  HIRE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  MAYBE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  NO_HIRE: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

function StarBar({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
        />
      ))}
    </div>
  );
}

export default function ScorecardSummaryCard({
  applicationId,
  candidateName,
  jobTitle,
  assignments,
  summary,
  currentUserId,
  onScorecardSubmitted,
}: Props) {
  const [showForm, setShowForm] = useState(false);

  const myAssignment = assignments.find((a) => a.interviewerId === currentUserId && !a.submitted);

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center space-y-2">
        <TrendingUp className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No interviewers assigned yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Assign interviewers from the Kanban board to collect structured feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* My pending scorecard CTA */}
      {myAssignment && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Your scorecard is pending</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">Submit your feedback for {candidateName}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Fill Scorecard
          </button>
        </div>
      )}

      {/* Summary bar */}
      {summary.overallAvg !== null && (
        <div className="bg-gray-50/50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl p-5 space-y-4 shadow-sm group hover:border-amber-400/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Aggregate Score</span>
            <div className="flex items-center gap-3">
              <StarBar rating={summary.overallAvg} />
              <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">{summary.overallAvg.toFixed(1)}/5</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            {summary.totalSubmitted}/{summary.totalAssigned} Interviewers Submitted
          </p>
          {summary.dimensionAverages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
              {summary.dimensionAverages.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider truncate">{d.name}</span>
                  <span className="text-xs font-black text-gray-700 dark:text-gray-300 ml-1">{d.avg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Individual assignments */}
      <div className="space-y-2">
        {assignments.map((a) => (
          <div
            key={a.assignmentId}
            className={`rounded-2xl border px-5 py-4 space-y-3 transition-all group ${
              a.submitted
                ? "border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:border-indigo-500/30"
                : "border-dashed border-gray-200 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01] opacity-70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-indigo-500/20">
                  {(a.interviewer.name || a.interviewer.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 dark:text-white">
                    {a.interviewer.name || a.interviewer.email}
                  </p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{a.stageName}</p>
                </div>
              </div>
              {a.submitted ? (
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                </div>
              )}
            </div>

            {a.scorecard && (
              <div className="pt-3 border-t border-gray-100 dark:border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <StarBar rating={a.scorecard.overallRating} />
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest border ${
                      REC_COLORS[a.scorecard.recommendation] || "bg-gray-50 dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/10"
                    }`}
                  >
                    {a.scorecard.recommendation.replace("_", " ")}
                  </span>
                </div>
                {a.scorecard.notes && (
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-2 italic leading-relaxed">
                    "{a.scorecard.notes}"
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && myAssignment && (
        <ScorecardFormModal
          applicationId={applicationId}
          assignmentId={myAssignment.assignmentId}
          candidateName={candidateName}
          jobTitle={jobTitle}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); onScorecardSubmitted?.(); }}
        />
      )}
    </div>
  );
}
