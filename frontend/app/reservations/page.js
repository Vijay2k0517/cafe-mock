"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Facebook,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Users,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
  MapPinIcon,
  User,
  CalendarDays,
  MessageSquare,
  LogOut,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Navigation Component
const Navigation = () => {
  const router = useRouter();
  const { user, isAuthenticated, isAgent, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("reservations");
  const [isVisible, setIsVisible] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const ref = useRef();
  const menuRef = useRef();

  const navItems = [
    { name: "Home", href: "/", section: "home" },
    { name: "About", href: "/about", section: "about" },
    { name: "Menu", href: "/menu", section: "menu" },
    { name: "Events", href: "/events", section: "events" },
    { name: "Reservations", href: "/reservations", section: "reservations" },
    { name: "Contact", href: "/contact", section: "contact" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/");
  };

  return (
    <nav
      ref={ref}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-7xl px-4"
    >
      <div className="flex items-center justify-center">
        <nav className="glass-nav rounded-full px-8 py-1.5 shadow-lg flex items-center justify-center">
          <Link href="/" className="flex-shrink-0 mr-6">
            <img
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/image-1759387620201.png"
              alt="Logo"
              className="h-12 w-12 object-cover rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </Link>
          <div className="flex items-center justify-center">
            <div className="flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-pill px-4 py-2 rounded-full transition-all duration-300 ${
                    activeSection === item.section
                      ? "nav-pill-active text-white"
                      : "text-white hover:text-[#EFC1A9]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Section */}
          <div className="ml-6 flex items-center" ref={menuRef}>
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#EFC1A9]/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#EFC1A9]" />
                  </div>
                  <span className="text-white text-sm font-medium max-w-[80px] truncate hidden sm:block">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/60 transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#2B2B2B] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-white font-medium text-sm truncate">
                        {user?.name}
                      </p>
                      <p className="text-white/50 text-xs capitalize">
                        {user?.role}
                      </p>
                    </div>
                    <div className="p-2">
                      {isAgent && (
                        <Link
                          href="/agent"
                          className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Briefcase className="w-4 h-4" />
                          Dashboard
                        </Link>
                      )}
                      <Link
                        href="/reservations"
                        className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Calendar className="w-4 h-4" />
                        Reservations
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-[#EFC1A9] text-[#1E1E1E] rounded-full text-sm font-semibold hover:bg-[#d4b088] transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </nav>
  );
};

// Hero Section
const ReservationHero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      <div
        className="parallax-bg absolute inset-0 w-full h-full"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          // transform: `translateY(${scrollY * 0.5}px)`,
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-30" />
      <div className="relative z-10 flex items-center justify-center h-full text-center">
        <div className="max-w-4xl px-4">
          <motion.h1
            className="isai-font text-8xl md:text-9xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            Reservations
          </motion.h1>
          <motion.p
            className="text-2xl md:text-3xl text-white font-light tracking-wider"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          >
            Book your table for an unforgettable experience
          </motion.p>
        </div>
      </div>

      {/* Animated Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-3 bg-white rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

// Phone Auth Modal Component
const PhoneAuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = "customer",
}) => {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [otpDebug, setOtpDebug] = useState(null);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

      if (data.otp_debug) {
        setOtpDebug(data.otp_debug);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

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
          role: defaultRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid OTP");
      }

      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChange"));

      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    await verifyOTP();
  };

  if (!isOpen) return null;

  return (
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
        className="bg-[#1E1E1E] rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          {step === "phone" && "Sign In to Continue"}
          {step === "otp" && "Verify Phone"}
          {step === "name" && "Complete Profile"}
        </h2>
        <p className="text-white/60 mb-6">
          {step === "phone" && "Enter your phone number to book a table"}
          {step === "otp" &&
            `We've sent a code to +91${phone.replace(/^\+91/, "")}`}
          {step === "name" && "Just a few more details"}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {otpDebug && step === "otp" && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            <span className="font-medium">Dev Mode</span> - OTP:{" "}
            <span className="font-bold">{otpDebug}</span>
          </div>
        )}

        {step === "phone" && (
          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone.replace(/^\+91/, "")}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="9876543210"
                  className="w-full pl-20 pr-4 py-3 bg-[#2B2B2B] border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#EFC1A9]"
                  maxLength={10}
                  autoFocus
                />
              </div>
            </div>
            <button
              onClick={sendOTP}
              disabled={isLoading || phone.length < 10}
              className="w-full py-3 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#d4b088] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm font-medium mb-3 block">
                Enter 6-digit code
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
                    className="w-12 h-14 text-center text-2xl font-bold bg-[#2B2B2B] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#EFC1A9]"
                    maxLength={1}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-white/60 text-sm">
                  Resend in{" "}
                  <span className="text-[#EFC1A9] font-medium">
                    {countdown}s
                  </span>
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
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                  setOtpDebug(null);
                }}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={verifyOTP}
                disabled={isLoading || otp.join("").length !== 6}
                className="flex-1 py-3 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#d4b088] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
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

        {step === "name" && (
          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-4 py-3 bg-[#2B2B2B] border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#EFC1A9]"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("otp")}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={completeRegistration}
                disabled={isLoading || !name.trim()}
                className="flex-1 py-3 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#d4b088] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Complete"
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Table Selection Card
const TableCard = ({ table, isSelected, onSelect, isLocked }) => {
  return (
    <motion.button
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      onClick={() => !isLocked && onSelect(table)}
      disabled={isLocked}
      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
        isLocked
          ? "border-red-500/30 bg-red-500/10 cursor-not-allowed opacity-60"
          : isSelected
            ? "border-[#EFC1A9] bg-[#EFC1A9]/10"
            : "border-white/20 bg-[#2B2B2B] hover:border-white/40"
      }`}
    >
      <div className="text-center">
        <span className="text-4xl font-bold text-[#EFC1A9]">
          {table.number}
        </span>
        <p className="text-white/60 text-sm mt-2">
          {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
        </p>
        <p className="text-white/40 text-xs mt-1">{table.location}</p>
      </div>
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
          <span className="text-red-400 text-sm font-medium">Reserved</span>
        </div>
      )}
      {isSelected && !isLocked && (
        <div className="absolute top-2 right-2">
          <Check className="w-5 h-5 text-[#EFC1A9]" />
        </div>
      )}
    </motion.button>
  );
};

// Reservation Form Component
const ReservationForm = () => {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    guests: 2,
    table: null,
    specialRequests: "",
  });

  const timeSlots = [
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
  ];

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const fetchAvailableTables = async () => {
    if (!formData.date || !formData.time) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reservations/available-tables`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: formData.date,
            time: formData.time,
            guests: formData.guests,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch tables");
      }

      // API returns array directly, not wrapped in {tables: [...]}
      setAvailableTables(Array.isArray(data) ? data : []);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSelect = (table) => {
    setFormData({ ...formData, table });
  };

  const proceedToConfirm = () => {
    if (!formData.table) {
      setError("Please select a table");
      return;
    }

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setStep(3);
  };

  const handleAuthSuccess = (data) => {
    setShowAuthModal(false);
    setStep(3);
  };

  const confirmReservation = async () => {
    const currentToken = token || localStorage.getItem("authToken");

    if (!currentToken) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First lock the table
      const lockResponse = await fetch(
        `${API_BASE_URL}/api/reservations/lock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            table_id: formData.table.id,
            date: formData.date,
            time: formData.time,
            guests: formData.guests,
          }),
        },
      );

      const lockData = await lockResponse.json();

      if (!lockResponse.ok) {
        throw new Error(lockData.detail || "Failed to lock table");
      }

      // Then confirm the reservation
      const confirmResponse = await fetch(
        `${API_BASE_URL}/api/reservations/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            reservation_id: lockData.id,
            special_requests: formData.specialRequests,
          }),
        },
      );

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok) {
        throw new Error(confirmData.detail || "Failed to confirm reservation");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-16"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Reservation Confirmed!
        </h2>
        <p className="text-white/70 mb-8">
          Your table has been reserved. You will receive an SMS confirmation
          shortly.
        </p>
        <div className="bg-[#2B2B2B] rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <Calendar className="w-6 h-6 text-[#EFC1A9] mx-auto mb-2" />
              <p className="text-white font-medium">{formData.date}</p>
              <p className="text-white/60 text-sm">Date</p>
            </div>
            <div>
              <Clock className="w-6 h-6 text-[#EFC1A9] mx-auto mb-2" />
              <p className="text-white font-medium">
                {formatTime(formData.time)}
              </p>
              <p className="text-white/60 text-sm">Time</p>
            </div>
            <div>
              <Users className="w-6 h-6 text-[#EFC1A9] mx-auto mb-2" />
              <p className="text-white font-medium">{formData.guests}</p>
              <p className="text-white/60 text-sm">Guests</p>
            </div>
            <div>
              <MapPinIcon className="w-6 h-6 text-[#EFC1A9] mx-auto mb-2" />
              <p className="text-white font-medium">
                Table {formData.table?.number}
              </p>
              <p className="text-white/60 text-sm">
                {formData.table?.location}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-3 bg-[#EFC1A9] text-[#1E1E1E] rounded-xl font-semibold hover:bg-[#d4b088] transition-colors"
        >
          Back to Home
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-12">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s
                  ? "bg-[#EFC1A9] text-[#1E1E1E]"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-20 h-1 mx-2 rounded ${
                  step > s ? "bg-[#EFC1A9]" : "bg-white/10"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-center gap-12 mb-8">
        <span
          className={`text-sm ${
            step >= 1 ? "text-[#EFC1A9]" : "text-white/50"
          }`}
        >
          Date & Time
        </span>
        <span
          className={`text-sm ${
            step >= 2 ? "text-[#EFC1A9]" : "text-white/50"
          }`}
        >
          Select Table
        </span>
        <span
          className={`text-sm ${
            step >= 3 ? "text-[#EFC1A9]" : "text-white/50"
          }`}
        >
          Confirm
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Step 1: Date & Time Selection */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#2B2B2B] rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Choose Date & Time
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">
                <CalendarDays className="w-4 h-4 inline mr-2" />
                Date
              </label>
              <input
                type="date"
                min={getMinDate()}
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white focus:border-[#EFC1A9] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">
                <Users className="w-4 h-4 inline mr-2" />
                Number of Guests
              </label>
              <select
                value={formData.guests}
                onChange={(e) =>
                  setFormData({ ...formData, guests: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white focus:border-[#EFC1A9] focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label className="text-white/80 text-sm font-medium mb-3 block">
              <Clock className="w-4 h-4 inline mr-2" />
              Select Time
            </label>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setFormData({ ...formData, time })}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    formData.time === time
                      ? "bg-[#EFC1A9] text-[#1E1E1E]"
                      : "bg-[#1E1E1E] text-white/70 hover:bg-[#3B3B3B]"
                  }`}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={fetchAvailableTables}
            disabled={!formData.date || !formData.time || isLoading}
            className="w-full py-4 bg-[#EFC1A9] text-[#1E1E1E] font-bold rounded-xl hover:bg-[#d4b088] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Find Available Tables
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Step 2: Table Selection */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#2B2B2B] rounded-2xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Select Your Table</h2>
            <button
              onClick={() => setStep(1)}
              className="text-white/60 hover:text-white text-sm"
            >
              ← Change Date/Time
            </button>
          </div>

          <div className="mb-6 p-4 bg-[#1E1E1E] rounded-xl">
            <div className="flex items-center gap-6 text-white/70 text-sm">
              <span>
                <CalendarDays className="w-4 h-4 inline mr-2 text-[#EFC1A9]" />
                {formData.date}
              </span>
              <span>
                <Clock className="w-4 h-4 inline mr-2 text-[#EFC1A9]" />
                {formatTime(formData.time)}
              </span>
              <span>
                <Users className="w-4 h-4 inline mr-2 text-[#EFC1A9]" />
                {formData.guests} guests
              </span>
            </div>
          </div>

          {availableTables.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">
                No tables available for this time slot
              </p>
              <button
                onClick={() => setStep(1)}
                className="mt-4 text-[#EFC1A9] hover:underline"
              >
                Try a different time
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {availableTables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    isSelected={formData.table?.id === table.id}
                    onSelect={handleTableSelect}
                    isLocked={table.is_locked}
                  />
                ))}
              </div>

              <button
                onClick={proceedToConfirm}
                disabled={!formData.table}
                className="w-full py-4 bg-[#EFC1A9] text-[#1E1E1E] font-bold rounded-xl hover:bg-[#d4b088] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue to Confirmation
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#2B2B2B] rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Confirm Your Reservation
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-[#1E1E1E] rounded-xl">
              <Calendar className="w-5 h-5 text-[#EFC1A9] mb-2" />
              <p className="text-white/60 text-sm">Date</p>
              <p className="text-white font-medium">{formData.date}</p>
            </div>
            <div className="p-4 bg-[#1E1E1E] rounded-xl">
              <Clock className="w-5 h-5 text-[#EFC1A9] mb-2" />
              <p className="text-white/60 text-sm">Time</p>
              <p className="text-white font-medium">
                {formatTime(formData.time)}
              </p>
            </div>
            <div className="p-4 bg-[#1E1E1E] rounded-xl">
              <Users className="w-5 h-5 text-[#EFC1A9] mb-2" />
              <p className="text-white/60 text-sm">Guests</p>
              <p className="text-white font-medium">{formData.guests} people</p>
            </div>
            <div className="p-4 bg-[#1E1E1E] rounded-xl">
              <MapPinIcon className="w-5 h-5 text-[#EFC1A9] mb-2" />
              <p className="text-white/60 text-sm">Table</p>
              <p className="text-white font-medium">
                Table {formData.table?.number} ({formData.table?.location})
              </p>
            </div>
          </div>

          <div className="mb-8">
            <label className="text-white/80 text-sm font-medium mb-2 block">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Special Requests (Optional)
            </label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) =>
                setFormData({ ...formData, specialRequests: e.target.value })
              }
              placeholder="Any dietary requirements, celebration, seating preferences..."
              rows={3}
              className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-[#EFC1A9] focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Back
            </button>
            <button
              onClick={confirmReservation}
              disabled={isLoading}
              className="flex-1 py-4 bg-[#EFC1A9] text-[#1E1E1E] font-bold rounded-xl hover:bg-[#d4b088] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm Reservation
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Phone Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <PhoneAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#2a2a2a] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <h3 className="isai-font text-4xl font-bold text-[#EFC1A9] mb-4">
              Isai
            </h3>
            <p className="text-[#9b9b9b] leading-relaxed max-w-md">
              Where music and home blend into one. Experience the perfect
              harmony of classical melodies, homely comfort, and exceptional
              cuisine.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Home", "Menu", "Events", "About", "Contact"].map((link) => (
                <li key={link}>
                  <Link
                    href={`/${link.toLowerCase() === "home" ? "" : link.toLowerCase()}`}
                    className="text-[#9b9b9b] hover:text-[#EFC1A9] transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-[#9b9b9b]">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#EFC1A9]" />
                123 Art Street, Music District
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#EFC1A9]" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#EFC1A9]" />
                hello@isai.cafe
              </li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a
                href="#"
                className="text-[#9b9b9b] hover:text-[#EFC1A9] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-[#9b9b9b] hover:text-[#EFC1A9] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-[#9b9b9b] hover:text-[#EFC1A9] transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-[#2a2a2a] mt-8 pt-8 text-center text-[#6b6b6b]">
          <p>&copy; 2025 Isai Café. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// Main Reservations Page
export default function ReservationsPage() {
  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <Navigation />
      <ReservationHero />
      <section className="py-16 px-4">
        <ReservationForm />
      </section>
      <Footer />
    </div>
  );
}
