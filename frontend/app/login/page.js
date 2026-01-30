"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Loader2,
  Check,
  User,
  ShieldCheck,
  Coffee,
  Briefcase,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState("phone"); // phone, otp, name
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [otpDebug, setOtpDebug] = useState(null);

  // Form data
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("customer");
  const [isExistingUser, setIsExistingUser] = useState(false);

  const otpRefs = useRef([]);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("user");
    if (token && user) {
      const userData = JSON.parse(user);
      // Redirect based on role
      if (userData.role === "agent" || userData.role === "admin") {
        router.push("/agent");
      } else {
        router.push("/");
      }
    }
  }, [router]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/[^\d+]/g, "");
    return cleaned;
  };

  // Send OTP
  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send OTP");
      }

      setIsExistingUser(data.is_existing_user);
      setCountdown(60);
      setStep("otp");

      // Store debug OTP if provided (dev mode)
      if (data.otp_debug) {
        setOtpDebug(data.otp_debug);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length - 1, 5);
    otpRefs.current[lastIndex]?.focus();
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    // If new user and no name, show name step
    if (!isExistingUser && !name) {
      setStep("name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone,
          otp: otpString,
          name: isExistingUser ? undefined : name,
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid OTP");
      }

      // Save auth data
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "agent" || data.user.role === "admin") {
        router.push("/agent");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete registration with name
  const completeRegistration = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    await verifyOTP();
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E1E1E] via-[#1E1E1E]/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-12">
          <Link href="/" className="mb-8">
            <span className="isai-font text-5xl font-bold text-[#EFC1A9]">
              Isai
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to
            <br />
            <span className="text-[#EFC1A9]">Lumière Café</span>
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Where music and home blend into one. Sign in to reserve your table
            and experience the perfect ambiance.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-white/60">
              <Sparkles className="w-5 h-5 text-[#EFC1A9]" />
              <span>Easy phone-based login</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <Coffee className="w-5 h-5 text-[#EFC1A9]" />
              <span>Reserve tables instantly</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <ShieldCheck className="w-5 h-5 text-[#EFC1A9]" />
              <span>Secure OTP verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link href="/">
              <span className="isai-font text-4xl font-bold text-[#EFC1A9]">
                Isai
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="w-16 h-16 mb-6 rounded-2xl bg-[#EFC1A9]/20 flex items-center justify-center">
              {step === "phone" && <Phone className="w-8 h-8 text-[#EFC1A9]" />}
              {step === "otp" && (
                <ShieldCheck className="w-8 h-8 text-[#EFC1A9]" />
              )}
              {step === "name" && <User className="w-8 h-8 text-[#EFC1A9]" />}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {step === "phone" && "Sign In"}
              {step === "otp" && "Verify Phone"}
              {step === "name" && "Complete Profile"}
            </h2>
            <p className="text-white/60">
              {step === "phone" && "Enter your phone number to continue"}
              {step === "otp" &&
                `We've sent a 6-digit code to +91${phone.replace(/^\+91/, "")}`}
              {step === "name" && "Just a few more details to get started"}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dev OTP Debug */}
          {otpDebug && step === "otp" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"
            >
              <span className="font-medium">Dev Mode</span> - Your OTP is:{" "}
              <span className="font-bold text-lg">{otpDebug}</span>
            </motion.div>
          )}

          {/* Phone Input Step */}
          {step === "phone" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phone.replace(/^\+91/, "")}
                    onChange={(e) =>
                      setPhone(formatPhoneNumber(e.target.value))
                    }
                    placeholder="9876543210"
                    className="w-full pl-24 pr-4 py-4 bg-[#2B2B2B] border border-white/20 rounded-xl text-white text-lg placeholder:text-white/40 focus:outline-none focus:border-[#EFC1A9] transition-colors"
                    maxLength={10}
                    autoFocus
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-3">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setRole("customer")}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      role === "customer"
                        ? "border-[#EFC1A9] bg-[#EFC1A9]/10"
                        : "border-white/20 bg-[#2B2B2B] hover:border-white/40"
                    }`}
                  >
                    <Coffee
                      className={`w-8 h-8 mx-auto mb-2 ${role === "customer" ? "text-[#EFC1A9]" : "text-white/60"}`}
                    />
                    <span
                      className={`block text-sm font-medium ${role === "customer" ? "text-[#EFC1A9]" : "text-white/80"}`}
                    >
                      Customer
                    </span>
                    <span className="block text-xs text-white/40 mt-1">
                      Book tables & order
                    </span>
                  </button>
                  <button
                    onClick={() => setRole("agent")}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      role === "agent"
                        ? "border-[#EFC1A9] bg-[#EFC1A9]/10"
                        : "border-white/20 bg-[#2B2B2B] hover:border-white/40"
                    }`}
                  >
                    <Briefcase
                      className={`w-8 h-8 mx-auto mb-2 ${role === "agent" ? "text-[#EFC1A9]" : "text-white/60"}`}
                    />
                    <span
                      className={`block text-sm font-medium ${role === "agent" ? "text-[#EFC1A9]" : "text-white/80"}`}
                    >
                      Staff/Agent
                    </span>
                    <span className="block text-xs text-white/40 mt-1">
                      Manage bookings
                    </span>
                  </button>
                </div>
              </div>

              <button
                onClick={sendOTP}
                disabled={isLoading || phone.length < 10}
                className="w-full py-4 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#d4b088] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Continue with OTP"
                )}
              </button>
            </motion.div>
          )}

          {/* OTP Input Step */}
          {step === "otp" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-white/80 text-sm font-medium mb-4">
                  Enter 6-digit verification code
                </label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-14 text-center text-2xl font-bold bg-[#2B2B2B] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#EFC1A9] transition-colors"
                      maxLength={1}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-white/60 text-sm">
                    Resend OTP in{" "}
                    <span className="text-[#EFC1A9] font-medium">
                      {countdown}s
                    </span>
                  </p>
                ) : (
                  <button
                    onClick={sendOTP}
                    disabled={isLoading}
                    className="text-[#EFC1A9] text-sm hover:underline font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep("phone");
                    setOtp(["", "", "", "", "", ""]);
                    setOtpDebug(null);
                  }}
                  className="flex-1 py-4 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Change Number
                </button>
                <button
                  onClick={verifyOTP}
                  disabled={isLoading || otp.join("").length !== 6}
                  className="flex-1 py-4 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#d4b088] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Verify
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Name Input Step (New Users) */}
          {step === "name" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-4 bg-[#2B2B2B] border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#EFC1A9] transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-4 bg-[#2B2B2B] rounded-xl">
                <div className="flex items-center gap-3 text-white/80">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role === "customer" ? "bg-[#EFC1A9]/20" : "bg-blue-500/20"
                    }`}
                  >
                    {role === "customer" ? (
                      <Coffee className="w-6 h-6 text-[#EFC1A9]" />
                    ) : (
                      <Briefcase className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Signing up as</p>
                    <p className="font-semibold capitalize text-white">
                      {role}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("otp")}
                  className="flex-1 py-4 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={completeRegistration}
                  disabled={isLoading || !name.trim()}
                  className="flex-1 py-4 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#d4b088] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Complete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <p className="text-center text-white/40 text-xs mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
