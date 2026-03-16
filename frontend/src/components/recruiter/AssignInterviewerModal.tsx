"use client";

import { useState, useEffect } from "react";
import { X, Users, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/lib/auth-fetch";

interface OrgMember {
  userId: string;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  orgRole: string;
}

interface Props {
  applicationId: string;
  applicantName: string;
  stageName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignInterviewerModal({ applicationId, applicantName, stageName, onClose, onSuccess }: Props) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await authFetch("/organization/members");
        if (res.ok) {
          const json = await res.json();
          setMembers(json.data || json || []);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = members.filter(
    (m) =>
      !search ||
      m.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleAssign() {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch(`/recruiter/applications/${applicationId}/interviewers`, {
        method: "POST",
        body: JSON.stringify({ interviewerIds: [...selectedIds], stageName }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || json.message || "Failed to assign interviewers.");
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Assign Interviewers</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{applicantName} · {stageName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Member list */}
          <div className="p-4 max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">No team members found</p>
            ) : (
              filtered.map((m) => {
                const isSelected = selectedIds.has(m.user.id);
                return (
                  <button
                    key={m.user.id}
                    onClick={() => toggle(m.user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {m.user.name?.[0]?.toUpperCase() || m.user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {m.user.name || m.user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.orgRole}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {error && <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={submitting || selectedIds.size === 0}
                className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Assigning..." : `Assign (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
