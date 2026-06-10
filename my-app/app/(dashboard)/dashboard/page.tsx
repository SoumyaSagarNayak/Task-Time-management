"use client";
import { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Inbox,
  Info,
  X,
} from "lucide-react";
import { formatHours, formatDateTime } from "@/lib/utils";
import {
  StatCardSkeleton,
  RecentEntriesSkeleton,
} from "@/components/skeletons";
import type { TimeEntry, TimeSummary } from "@/lib/types";
import { MOCK_TIME_SUMMARY, MOCK_TIME_ENTRIES } from "@/lib/mock-data";

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem("hide-welcome-banner");
    if (!hidden) {
      setShowBanner(true);
    }
  }, []);

  const dismissBanner = () => {
    localStorage.setItem("hide-welcome-banner", "true");
    setShowBanner(false);
  };

  const {
    data: summary,
    isLoading: loadingSummary,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useQuery<TimeSummary>({
    queryKey: ["time-summary"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No authentication token available");
      const response = await api.get(
        `/time-entries/reports/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    refetchInterval: 5000,
  });

  const {
    data: recentEntries,
    isLoading: loadingEntries,
    isError: isEntriesError,
    refetch: refetchEntries,
  } = useQuery<TimeEntry[]>({
    queryKey: ["recent-entries"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No authentication token available");
      const response = await api.get(
        `/time-entries`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data.data ? response.data.data.slice(0, 5) : [];
    },
    refetchInterval: 5000,
  });

  const isDashboardLoading = loadingSummary || loadingEntries;
  const isDashboardError = isSummaryError || isEntriesError;

  // Use mock data as fallback when API fails
  const displaySummary = summary ?? MOCK_TIME_SUMMARY;
  const displayEntries = recentEntries && recentEntries.length > 0 ? recentEntries : MOCK_TIME_ENTRIES;

  const stats = [
    {
      title: "Total Hours",
      value: formatHours(displaySummary?.summary.totalHours || 0),
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Time Entries",
      value: displaySummary?.summary.entriesCount || 0,
      icon: CheckSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Average Hours",
      value: displaySummary?.summary.entriesCount
        ? formatHours(displaySummary.summary.totalHours / displaySummary.summary.entriesCount)
        : "0h",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (isDashboardLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Overview of your time tracking</p>
        </div>
        <StatCardSkeleton count={3} />
        <RecentEntriesSkeleton />
      </div>
    );
  }

  if (isDashboardError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Overview of your time tracking</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-gray-500">Failed to load dashboard data.</p>
            <Button
              variant="outline"
              onClick={() => {
                refetchSummary();
                refetchEntries();
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Dashboard</h1>
          <p className="text-slate-600 max-w-2xl">
            Get a quick view of your activity, log your time entries, and manage tasks.
          </p>
        </div>
      </div>

      {showBanner && (
        <div className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Welcome to Flow Pilot!
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              Start by tracking your time entries and managing your tasks. You can edit your profile details at any time in{" "}
              <a
                href="/dashboard/profile"
                className="font-semibold underline hover:text-blue-900"
              >
                Profile / Settings
              </a>
              .
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="ml-auto -mx-1.5 -my-1.5 bg-blue-50 p-1.5 rounded-md text-blue-500 hover:bg-blue-100 flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {!displayEntries || displayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Inbox className="h-10 w-10 text-gray-300" />
              <p className="text-center text-gray-500">
                No time entries yet. Start tracking!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {entry.tasks && entry.tasks.length > 0
                        ? entry.tasks.map((task) => task.title).join(", ")
                        : "General work"}
                    </p>
                    <p className="text-sm text-gray-500">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {formatDateTime(entry.startTime)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatHours(entry.hours)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
