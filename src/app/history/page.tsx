"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Callback = {
  id: string;
  email: string;
  phone: string;
  createdAt: string;
  aiSummary?: string;
  aiSummaryTranslated?: string;
  structuredData?: Record<string, string>;
};

export default function HistoryPage() {
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "callbacks"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Callback, "id">),
      }));
      setCallbacks(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (loading) return <p className="p-4 text-gray-500">Loading...</p>;
  if (callbacks.length === 0)
    return <p className="p-4 text-gray-500">No call history found.</p>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Call History</h2>
      {callbacks.map((callback) => (
        <div
          key={callback.id}
          className="border border-gray-200 rounded-md p-4"
        >
          <div className="flex justify-between items-center">
            <div>
              <p>
                <strong>Email:</strong> {callback.email}
              </p>
              <p>
                <strong>Phone:</strong> {callback.phone}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(callback.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => toggleExpand(callback.id)}
            >
              {expandedIds.has(callback.id) ? "Hide" : "More details"}
            </button>
          </div>

          {expandedIds.has(callback.id) && (
            <div className="mt-4 border-t pt-4 text-sm text-gray-800 space-y-2">
              {callback.aiSummary ? (
                <>
                  <div>
                    <strong>AI Summary (EN):</strong>
                    <p className="whitespace-pre-line">{callback.aiSummary}</p>
                  </div>
                  {callback.aiSummaryTranslated && (
                    <div>
                      <strong>AI Summary (Translated):</strong>
                      <p className="whitespace-pre-line">
                        {callback.aiSummaryTranslated}
                      </p>
                    </div>
                  )}
                </>
              ) : callback.structuredData ? (
                <div>
                  <strong>Structured Data:</strong>
                  <ul className="list-disc ml-5">
                    {Object.entries(callback.structuredData).map(
                      ([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {value}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              ) : (
                <p>No additional data available.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
