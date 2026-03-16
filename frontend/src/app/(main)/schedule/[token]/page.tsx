"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Calendar, Clock, CheckCircle, AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface Slot {
  date: string;
  slots: string[];
}

interface AvailabilityData {
  status: "pending" | "already_booked";
  jobTitle: string;
  companyName: string;
  slots?: Slot[];
  scheduledAt?: string;
  meetLink?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildGoogleCalendarUrl(title: string, start: string, end: string, details?: string): string {
  const fmt = (d: string) => new Date(d).toISOString().replace(/-/g, "").replace(/:/g, "").replace(/\./g, "").split("Z")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: details || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function SchedulePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState<{ scheduledAt: string; meetLink?: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/public/schedule/${token}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error?.message || json.message || "This booking link is invalid or has expired.");
        } else {
          setData(json.data);
          if (json.data.slots?.length > 0) {
            setSelectedDate(json.data.slots[0].date);
          }
        }
      } catch {
        setError("Failed to load booking page. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleBook() {
    if (!selectedSlot || !name.trim() || !email.trim()) return;
    setBooking(true);
    try {
      const res = await fetch(`${API_URL}/public/schedule/${token}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateName: name, candidateEmail: email, selectedSlot }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || json.message || "Failed to book slot.");
      } else {
        setBooked({ scheduledAt: json.data.scheduledAt, meetLink: json.data.meetLink });
      }
    } catch {
      setError("Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  const selectedSlots = data?.slots?.find((s) => s.date === selectedDate)?.slots || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse space-y-4 w-80">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Link Expired</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
          <p className="text-xs text-gray-400">If you believe this is a mistake, contact the recruiter directly.</p>
        </div>
      </div>
    );
  }

  if (data?.status === "already_booked" || booked) {
    const scheduledAt = booked?.scheduledAt || data?.scheduledAt;
    const meetLink = booked?.meetLink || data?.meetLink;
    const endTime = scheduledAt ? new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000).toISOString() : "";
    const gcUrl = scheduledAt
      ? buildGoogleCalendarUrl(
          `Interview — ${data?.jobTitle} at ${data?.companyName}`,
          scheduledAt,
          endTime,
          meetLink || "",
        )
      : "";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Interview Confirmed!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Your interview for <span className="font-medium">{data?.jobTitle}</span> at{" "}
              <span className="font-medium">{data?.companyName}</span> is scheduled.
            </p>
          </div>
          {scheduledAt && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-left">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <Clock className="h-4 w-4" />
                {formatFullDateTime(scheduledAt)}
              </div>
            </div>
          )}
          {meetLink && (
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Join Meeting Link
            </a>
          )}
          <div className="flex gap-3 justify-center">
            {gcUrl && (
              <a
                href={gcUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Add to Google Calendar
              </a>
            )}
          </div>
          <p className="text-xs text-gray-400">A confirmation message has been sent from the recruiter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 space-y-1">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="h-4 w-4" />
            Schedule Your Interview
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data?.jobTitle}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{data?.companyName}</p>
        </div>

        {/* Date picker */}
        {data?.slots && data.slots.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Select a Date</h2>
            <div className="flex flex-wrap gap-2">
              {data.slots.map((s) => (
                <button
                  key={s.date}
                  onClick={() => { setSelectedDate(s.date); setSelectedSlot(null); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selectedDate === s.date
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500"
                  }`}
                >
                  {formatDate(s.date)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time slots */}
        {selectedDate && selectedSlots.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Select a Time</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {selectedSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    selectedSlot === slot
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 mx-auto mb-1 opacity-60" />
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Candidate info + confirm */}
        {selectedSlot && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Your Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Booking summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              {formatDate(selectedDate!)} at {formatTime(selectedSlot)} · 60 minutes
            </div>

            <button
              onClick={handleBook}
              disabled={booking || !name.trim() || !email.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {booking ? "Confirming..." : "Confirm Booking"}
            </button>

            {error && (
              <p className="text-sm text-rose-500 dark:text-rose-400 text-center">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
