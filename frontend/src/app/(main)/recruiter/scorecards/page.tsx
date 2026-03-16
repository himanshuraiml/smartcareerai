"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, CheckCircle, Briefcase, User } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import ScorecardFormModal from "@/components/recruiter/ScorecardFormModal";

interface PendingAssignment {
  assignmentId: string;
  applicationId: string;
  stageName: string;
  assignedAt: string;
  candidate: { id: string; name: string | null; email: string; avatarUrl: string | null };
  job: { id: string; title: string };
  defaultDimensions: string[];
}

export default function ScorecardsPage() {
  const [assignments, setAssignments] = useState<PendingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<PendingAssignment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/recruiter/scorecards/pending");
      if (res.ok) {
        const json = await res.json();
        setAssignments(json.data || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Scorecard Queue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Interviews awaiting your feedback</p>
        </div>
        {assignments.length > 0 && (
          <span className="ml-auto px-2.5 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
            {assignments.length} pending
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">All caught up!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">No pending scorecards to fill.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div
              key={a.assignmentId}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {(a.candidate.name || a.candidate.email)[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {a.candidate.name || a.candidate.email}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Briefcase className="h-3 w-3" />
                    {a.job.title}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    {a.stageName}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  Assigned {new Date(a.assignedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>

              {/* Action */}
              <button
                onClick={() => setActiveModal(a)}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Fill Scorecard
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Scorecard modal */}
      {activeModal && (
        <ScorecardFormModal
          applicationId={activeModal.applicationId}
          assignmentId={activeModal.assignmentId}
          candidateName={activeModal.candidate.name || activeModal.candidate.email}
          jobTitle={activeModal.job.title}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}
