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
      <h1 className="text-2xl font-bold">Your Consultation Data</h1>
      <ul className="space-y-2">
        {Object.entries(data.structuredData || {}).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {value as string}
          </li>
        ))}
      </ul>
    </div>
  );
}
