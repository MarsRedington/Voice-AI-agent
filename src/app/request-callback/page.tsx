"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import { toast } from "react-hot-toast";
import { useState } from "react";
import Sidebar from "@/components/UI/SideBar";

const formSchema = z.object({
  email: z.string().email("Incorrect email"),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Incorrect phone format"),
});

type FormData = z.infer<typeof formSchema>;

export default function RequestCallbackPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    window.localStorage.setItem("emailForSignIn", data.email);

    try {
      const res = await fetch("/api/call-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: data.phone,
          email: data.email,
        }),
      });

      if (!res.ok) throw new Error("Failed to initiate call");

      toast.success("✅ The call has been started. We will call you back.");
      reset();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen">
      <div className="w-[25%]">
        <Sidebar />
      </div>
      <div className="w-[75%] flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md border border-blue-300 rounded-md p-6 shadow-sm mt-[-100px]">
          <h1 className="text-xl font-semibold mb-6 text-center">
            Request a call-back
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              {...register("email")}
              error={errors.email}
            />
            <Input
              label="Phone"
              type="tel"
              {...register("phone")}
              error={errors.phone}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 rounded-md bg-blue-600 text-white py-2 px-4 transition duration-200 ${
                isLoading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }`}
            >
              {isLoading && (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
