"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  X,
  Loader2,
  Check,
  User,
  ShieldCheck,
  Coffee,
  Briefcase,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PhoneAuthModal = ({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultRole = "customer",
  showRoleSelection = true,
}) => {
  const [step, setStep] = useState("phone"); // phone, otp, name
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [otpDebug, setOtpDebug] = useState(null);
  
  // Form data
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [isExistingUser, setIsExistingUser] = useState(false);
  
  const otpRefs = useRef([]);
  
  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("phone");
      setPhone("");
      setOtp(["", "", "", "", "", ""]);
      setName("");
      setError(null);
      setOtpDebug(null);
      setIsExistingUser(false);
    }
  }, [isOpen]);
  
  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove non-numeric characters except +
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
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.startsWith("+") ? phone : `+91${phone}` }),
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
        console.log("Dev OTP:", data.otp_debug);
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
    
    // Focus last filled or next empty input
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
      
      // Call success callback
      onAuthSuccess(data);
      onClose();
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
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#1E1E1E] rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EFC1A9]/20 flex items-center justify-center">
              {step === "phone" && <Phone className="w-8 h-8 text-[#EFC1A9]" />}
              {step === "otp" && <ShieldCheck className="w-8 h-8 text-[#EFC1A9]" />}
              {step === "name" && <User className="w-8 h-8 text-[#EFC1A9]" />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {step === "phone" && "Welcome to Lumière"}
              {step === "otp" && "Verify Your Phone"}
              {step === "name" && "Complete Your Profile"}
            </h2>
            <p className="text-white/60">
              {step === "phone" && "Enter your phone number to continue"}
              {step === "otp" && `We've sent a code to ${phone}`}
              {step === "name" && "Just a few more details"}
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
          
          {/* Dev OTP Debug */}
          {otpDebug && step === "otp" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center"
            >
              Dev Mode - Your OTP is: <span className="font-bold">{otpDebug}</span>
            </motion.div>
          )}
          
          {/* Phone Input Step */}
          {step === "phone" && (
            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phone.replace(/^\+91/, "")}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    placeholder="9876543210"
                    className="w-full pl-24 pr-4 py-4 bg-[#2B2B2B] border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#EFC1A9] transition-colors text-lg"
                    maxLength={10}
                  />
                </div>
              </div>
              
              {/* Role Selection */}
              {showRoleSelection && (
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
                      <Coffee className={`w-8 h-8 mx-auto mb-2 ${role === "customer" ? "text-[#EFC1A9]" : "text-white/60"}`} />
                      <span className={`block text-sm font-medium ${role === "customer" ? "text-[#EFC1A9]" : "text-white/80"}`}>
                        Customer
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
                      <Briefcase className={`w-8 h-8 mx-auto mb-2 ${role === "agent" ? "text-[#EFC1A9]" : "text-white/60"}`} />
                      <span className={`block text-sm font-medium ${role === "agent" ? "text-[#EFC1A9]" : "text-white/80"}`}>
                        Agent
                      </span>
                    </button>
                  </div>
                </div>
              )}
              
              <button
                onClick={sendOTP}
                disabled={isLoading || phone.length < 10}
                className="w-full py-4 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#EFC1A9]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* OTP Input Step */}
          {step === "otp" && (
            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-4 text-center">
                  Enter 6-digit verification code
                </label>
                <div className="flex justify-center gap-3">
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
                    />
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-white/60 text-sm">
                    Resend OTP in <span className="text-[#EFC1A9]">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={sendOTP}
                    disabled={isLoading}
                    className="text-[#EFC1A9] text-sm hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setStep("phone")}
                  className="flex-1 py-4 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={verifyOTP}
                  disabled={isLoading || otp.join("").length !== 6}
                  className="flex-1 py-4 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#EFC1A9]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </div>
          )}
          
          {/* Name Input Step (New Users) */}
          {step === "name" && (
            <div className="space-y-6">
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
                  />
                </div>
              </div>
              
              <div className="p-4 bg-[#2B2B2B] rounded-xl">
                <div className="flex items-center gap-3 text-white/80">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    role === "customer" ? "bg-[#EFC1A9]/20" : "bg-blue-500/20"
                  }`}>
                    {role === "customer" ? (
                      <Coffee className="w-5 h-5 text-[#EFC1A9]" />
                    ) : (
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Signing up as</p>
                    <p className="font-medium capitalize">{role}</p>
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
                  className="flex-1 py-4 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#EFC1A9]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Complete
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <p className="text-center text-white/40 text-xs mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhoneAuthModal;
