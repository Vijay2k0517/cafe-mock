"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronRight,
  LogOut,
  Search,
  Filter,
  Bell,
  RefreshCw,
  Coffee,
  User,
  CalendarDays,
  Plus,
  MessageSquare,
  LayoutDashboard,
  Home,
} from "lucide-react";
import PhoneAuthModal from "@/components/PhoneAuthModal";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    confirmed: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      label: "Confirmed",
    },
    locked: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-400",
      label: "Locked",
    },
    cancelled: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      label: "Cancelled",
    },
    expired: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Expired" },
  };

  const config = statusConfig[status] || statusConfig.confirmed;

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

// Reservation Card Component
const ReservationCard = ({
  reservation,
  onSendReminder,
  onCancel,
  isSendingReminder,
}) => {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#2B2B2B] rounded-xl p-6 border border-white/10 hover:border-[#EFC1A9]/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#EFC1A9]/20 flex items-center justify-center">
            <span className="text-xl font-bold text-[#EFC1A9]">
              {reservation.table_number}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {reservation.user_name}
            </h3>
            <p className="text-white/60 text-sm flex items-center gap-2">
              <Phone className="w-3 h-3" />
              {reservation.phone || reservation.user_phone}
            </p>
          </div>
        </div>
        <StatusBadge status={reservation.status} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-[#1E1E1E] rounded-lg">
          <Calendar className="w-4 h-4 text-[#EFC1A9] mx-auto mb-1" />
          <p className="text-white text-sm font-medium">{reservation.date}</p>
        </div>
        <div className="text-center p-3 bg-[#1E1E1E] rounded-lg">
          <Clock className="w-4 h-4 text-[#EFC1A9] mx-auto mb-1" />
          <p className="text-white text-sm font-medium">
            {formatTime(reservation.time)}
          </p>
        </div>
        <div className="text-center p-3 bg-[#1E1E1E] rounded-lg">
          <Users className="w-4 h-4 text-[#EFC1A9] mx-auto mb-1" />
          <p className="text-white text-sm font-medium">
            {reservation.guests} guests
          </p>
        </div>
      </div>

      {reservation.special_requests && (
        <div className="mb-4 p-3 bg-[#1E1E1E] rounded-lg">
          <p className="text-white/60 text-xs mb-1">Special Requests:</p>
          <p className="text-white text-sm">{reservation.special_requests}</p>
        </div>
      )}

      <div className="flex gap-2">
        {reservation.status === "confirmed" && (
          <>
            <button
              onClick={() => onSendReminder(reservation.id)}
              disabled={isSendingReminder}
              className="flex-1 py-2 bg-[#EFC1A9]/20 text-[#EFC1A9] rounded-lg hover:bg-[#EFC1A9]/30 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {isSendingReminder ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Send Reminder
                </>
              )}
            </button>
            <button
              onClick={() => onCancel(reservation.id)}
              className="py-2 px-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

// New Booking Modal Component
const NewBookingModal = ({ isOpen, onClose, onSuccess, token }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);

  const [formData, setFormData] = useState({
    customer_phone: "",
    customer_name: "",
    date: "",
    time: "",
    guests: 2,
    table_id: "",
    special_requests: "",
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

  const getMinDate = () => new Date().toISOString().split("T")[0];

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
            duration_minutes: 90,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to fetch available tables");

      const tables = await response.json();
      setAvailableTables(tables);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async () => {
    if (
      !formData.table_id ||
      !formData.customer_phone ||
      !formData.customer_name
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const phoneFormatted = formData.customer_phone.startsWith("+")
        ? formData.customer_phone
        : `+91${formData.customer_phone}`;

      const response = await fetch(
        `${API_BASE_URL}/api/agent/book-for-customer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            customer_phone: phoneFormatted,
            duration_minutes: 90,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.detail || "Failed to create booking");

      onSuccess(data);
      onClose();
      setStep(1);
      setFormData({
        customer_phone: "",
        customer_name: "",
        date: "",
        time: "",
        guests: 2,
        table_id: "",
        special_requests: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
        className="bg-[#1E1E1E] rounded-2xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {step === 1 ? "Select Date & Time" : "Complete Booking"}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/80 text-sm font-medium mb-2 block">
                  Date
                </label>
                <input
                  type="date"
                  min={getMinDate()}
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#2B2B2B] border border-white/10 rounded-xl text-white focus:border-[#EFC1A9] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium mb-2 block">
                  Guests
                </label>
                <select
                  value={formData.guests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guests: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-[#2B2B2B] border border-white/10 rounded-xl text-white focus:border-[#EFC1A9] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">
                Time
              </label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setFormData({ ...formData, time })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.time === time
                        ? "bg-[#EFC1A9] text-[#1E1E1E]"
                        : "bg-[#2B2B2B] text-white/70 hover:bg-[#3B3B3B]"
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
                "Find Available Tables"
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/80 text-sm font-medium mb-2 block">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  placeholder="Enter customer name"
                  className="w-full px-4 py-3 bg-[#2B2B2B] border border-white/10 rounded-xl text-white focus:border-[#EFC1A9] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium mb-2 block">
                  Phone Number *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.customer_phone.replace(/^\+91/, "")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full pl-14 pr-4 py-3 bg-[#2B2B2B] border border-white/10 rounded-xl text-white focus:border-[#EFC1A9] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">
                Select Table *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {availableTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() =>
                      setFormData({ ...formData, table_id: table.id })
                    }
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      formData.table_id === table.id
                        ? "border-[#EFC1A9] bg-[#EFC1A9]/10"
                        : "border-white/10 bg-[#2B2B2B] hover:border-white/30"
                    }`}
                  >
                    <span className="text-2xl font-bold text-[#EFC1A9]">
                      {table.number}
                    </span>
                    <p className="text-white/60 text-xs mt-1">
                      {table.capacity} seats
                    </p>
                  </button>
                ))}
              </div>
              {availableTables.length === 0 && (
                <p className="text-white/60 text-center py-8">
                  No tables available for this time slot
                </p>
              )}
            </div>

            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">
                Special Requests
              </label>
              <textarea
                value={formData.special_requests}
                onChange={(e) =>
                  setFormData({ ...formData, special_requests: e.target.value })
                }
                placeholder="Any special requests..."
                rows={3}
                className="w-full px-4 py-3 bg-[#2B2B2B] border border-white/10 rounded-xl text-white focus:border-[#EFC1A9] focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-[#2B2B2B] text-white font-semibold rounded-xl hover:bg-[#3B3B3B] transition-colors"
              >
                Back
              </button>
              <button
                onClick={createBooking}
                disabled={
                  !formData.table_id ||
                  !formData.customer_phone ||
                  !formData.customer_name ||
                  isLoading
                }
                className="flex-1 py-4 bg-[#EFC1A9] text-[#1E1E1E] font-bold rounded-xl hover:bg-[#d4b088] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Create Booking"
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Main Agent Dashboard Component
export default function AgentDashboard() {
  const router = useRouter();
  const {
    user: authUser,
    token: authToken,
    isAuthenticated: authIsAuthenticated,
    isAgent,
    logout,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [localToken, setLocalToken] = useState(null);
  const [localUser, setLocalUser] = useState(null);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  // Use either context auth or local auth
  const isAuthenticated = authIsAuthenticated || !!localToken;
  const token = authToken || localToken;
  const user = authUser || localUser;

  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    today: "",
    stats: {
      todays_total: 0,
      todays_pending_arrival: 0,
      current_locks: 0,
      upcoming_week: 0,
    },
    todays_bookings: [],
    current_locks: [],
    upcoming_bookings: [],
  });

  // Filters
  const [activeTab, setActiveTab] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Check auth on mount
  useEffect(() => {
    // Check if user is authenticated via context
    if (authIsAuthenticated) {
      if (isAgent) {
        setIsLoading(false);
      } else {
        // User is logged in but not an agent
        setError("Access denied. Agent or Admin role required.");
        setIsLoading(false);
      }
    } else {
      // Check localStorage as fallback
      const storedToken = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role === "agent" || userData.role === "admin") {
          setLocalToken(storedToken);
          setLocalUser(userData);
        } else {
          setShowAuthModal(true);
        }
      } else {
        setShowAuthModal(true);
      }
      setIsLoading(false);
    }
  }, [authIsAuthenticated, isAgent]);

  // Fetch dashboard data
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboardData();
    }
  }, [isAuthenticated, token]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/agent/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Access denied. Agent role required.");
          return;
        }
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (data) => {
    if (data.user.role !== "agent" && data.user.role !== "admin") {
      setError("Only agents can access this dashboard");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      return;
    }

    setLocalToken(data.access_token);
    setLocalUser(data.user);
    setShowAuthModal(false);

    // Dispatch auth change event for other components
    window.dispatchEvent(new Event("authChange"));
  };

  const handleSendReminder = async (reservationId) => {
    setSendingReminderId(reservationId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/agent/send-reminder/${reservationId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to send reminder");

      // Show success (could use toast)
      alert("Reminder sent successfully!");
    } catch (err) {
      alert("Failed to send reminder: " + err.message);
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reservations/${reservationId}/cancel`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to cancel reservation");

      fetchDashboardData();
    } catch (err) {
      alert("Failed to cancel: " + err.message);
    }
  };

  const handleLogout = () => {
    // Use context logout if available
    if (logout) {
      logout();
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("authChange"));
    }
    router.push("/");
  };

  const handleBookingSuccess = () => {
    fetchDashboardData();
    alert("Booking created successfully! SMS sent to customer.");
  };

  // Filter reservations based on search
  const filterReservations = (reservations) => {
    if (!searchQuery) return reservations;
    const query = searchQuery.toLowerCase();
    return reservations.filter(
      (r) =>
        r.user_name?.toLowerCase().includes(query) ||
        r.phone?.includes(query) ||
        r.user_phone?.includes(query),
    );
  };

  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#EFC1A9] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/image-1759387620201.png"
                alt="Logo"
                className="h-10 w-10 object-cover rounded-full"
              />
              <span className="isai-font text-2xl font-bold text-[#EFC1A9]">
                Isai
              </span>
            </Link>
            <span className="text-white/40">|</span>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-[#EFC1A9]" />
              <span className="text-white font-medium">Agent Dashboard</span>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">Home</span>
              </Link>
              <div className="text-right">
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-white/60 text-sm capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/60 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {isAuthenticated && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#2B2B2B] rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-white/60 text-sm">
                    Today's Bookings
                  </span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {dashboardData.stats.todays_total}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#2B2B2B] rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-white/60 text-sm">Pending Arrival</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {dashboardData.stats.todays_pending_arrival}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#2B2B2B] rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-white/60 text-sm">Active Locks</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {dashboardData.stats.current_locks}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#2B2B2B] rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-white/60 text-sm">This Week</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {dashboardData.stats.upcoming_week}
                </p>
              </motion.div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("today")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "today"
                      ? "bg-[#EFC1A9] text-[#1E1E1E]"
                      : "bg-[#2B2B2B] text-white/70 hover:bg-[#3B3B3B]"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "upcoming"
                      ? "bg-[#EFC1A9] text-[#1E1E1E]"
                      : "bg-[#2B2B2B] text-white/70 hover:bg-[#3B3B3B]"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab("locks")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "locks"
                      ? "bg-[#EFC1A9] text-[#1E1E1E]"
                      : "bg-[#2B2B2B] text-white/70 hover:bg-[#3B3B3B]"
                  }`}
                >
                  Active Locks
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="pl-10 pr-4 py-2 bg-[#2B2B2B] border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#EFC1A9] w-64"
                  />
                </div>

                <button
                  onClick={fetchDashboardData}
                  className="p-2 bg-[#2B2B2B] text-white/70 rounded-lg hover:bg-[#3B3B3B] transition-colors"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  onClick={() => setShowNewBookingModal(true)}
                  className="px-4 py-2 bg-[#EFC1A9] text-[#1E1E1E] rounded-lg font-medium hover:bg-[#d4b088] transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Booking
                </button>
              </div>
            </div>

            {/* Reservations Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="wait">
                {activeTab === "today" && (
                  <>
                    {filterReservations(dashboardData.todays_bookings).length >
                    0 ? (
                      filterReservations(dashboardData.todays_bookings).map(
                        (reservation) => (
                          <ReservationCard
                            key={reservation.id}
                            reservation={reservation}
                            onSendReminder={handleSendReminder}
                            onCancel={handleCancelReservation}
                            isSendingReminder={
                              sendingReminderId === reservation.id
                            }
                          />
                        ),
                      )
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <Coffee className="w-12 h-12 text-[#EFC1A9]/50 mx-auto mb-4" />
                        <p className="text-white/60">No bookings for today</p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === "upcoming" && (
                  <>
                    {filterReservations(dashboardData.upcoming_bookings)
                      .length > 0 ? (
                      filterReservations(dashboardData.upcoming_bookings).map(
                        (reservation) => (
                          <ReservationCard
                            key={reservation.id}
                            reservation={reservation}
                            onSendReminder={handleSendReminder}
                            onCancel={handleCancelReservation}
                            isSendingReminder={
                              sendingReminderId === reservation.id
                            }
                          />
                        ),
                      )
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <CalendarDays className="w-12 h-12 text-[#EFC1A9]/50 mx-auto mb-4" />
                        <p className="text-white/60">
                          No upcoming bookings this week
                        </p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === "locks" && (
                  <>
                    {filterReservations(dashboardData.current_locks).length >
                    0 ? (
                      filterReservations(dashboardData.current_locks).map(
                        (reservation) => (
                          <ReservationCard
                            key={reservation.id}
                            reservation={reservation}
                            onSendReminder={handleSendReminder}
                            onCancel={handleCancelReservation}
                            isSendingReminder={
                              sendingReminderId === reservation.id
                            }
                          />
                        ),
                      )
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <AlertCircle className="w-12 h-12 text-[#EFC1A9]/50 mx-auto mb-4" />
                        <p className="text-white/60">No active table locks</p>
                      </div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Phone Auth Modal */}
      <PhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          if (!isAuthenticated) {
            router.push("/");
          }
          setShowAuthModal(false);
        }}
        onAuthSuccess={handleAuthSuccess}
        defaultRole="agent"
        showRoleSelection={true}
      />

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={showNewBookingModal}
        onClose={() => setShowNewBookingModal(false)}
        onSuccess={handleBookingSuccess}
        token={token}
      />
    </div>
  );
}
