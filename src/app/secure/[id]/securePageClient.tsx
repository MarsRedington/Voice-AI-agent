"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
} from "firebase/auth";

type StructuredData = {
  consultation_type: string;
  category: string;
  country: string;
  language: string;
  urgency: string;
  address: string;
  summary: string;
};

type CallbackData = {
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  structuredData?: StructuredData;
  aiSummary?: string;
  aiSummaryAt?: string;
  aiSummaryTranslated?: string;
};

export default function SecurePageClient({ id }: { id: string }) {
  const [data, setData] = useState<CallbackData | null>(null);

  useEffect(() => {
    const signInIfNeeded = async () => {
      if (typeof window === "undefined") return;

      if (isSignInWithEmailLink(auth, window.location.href)) {
        const email = localStorage.getItem("emailForSignIn");
        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            localStorage.removeItem("emailForSignIn");
          } catch (e) {
            console.error("Sign-in failed:", e);
          }
        }
      }

      onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        const docRef = doc(db, "callbacks", id).withConverter<CallbackData>({
          fromFirestore: (snap) => snap.data() as CallbackData,
          toFirestore: (data) => data,
        });
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setData(snapshot.data());
        }
      });
    };

    signInIfNeeded();
  }, [id]);

  if (!data) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      {data.aiSummary && (
        <div className="p-4 border border-green-400 rounded-md bg-green-50">
          <h2 className="text-lg font-semibold mb-2">AI Summary (English)</h2>
          <p>{data.aiSummary}</p>
        </div>
      )}

      {data.aiSummaryTranslated && (
        <div className="p-4 border border-yellow-400 rounded-md bg-yellow-50">
          <h2 className="text-lg font-semibold mb-2">
            AI Summary ({data.structuredData?.language})
          </h2>
          <p>{data.aiSummaryTranslated}</p>
        </div>
      )}

      {!data.aiSummary && data.structuredData && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Structured Data</h2>
          <ul className="space-y-2">
            {Object.entries(data.structuredData).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
