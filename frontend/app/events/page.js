"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Instagram,
  Facebook,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Clock,
  MessageCircle,
  Upload,
  User,
  LogOut,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Navbar Component
const Navigation = () => {
  const router = useRouter();
  const { user, isAuthenticated, isAgent, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("events");
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
                    className={`w-4 h-4 text-white/60 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
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

// Events Hero Section
const EventsHero = () => {
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
            "url('https://images.unsplash.com/photo-1670978738746-698556e69084')",
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
            Events
          </motion.h1>
          <motion.p
            className="text-2xl md:text-3xl text-white font-light tracking-wider"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          >
            Create memorable moments with us.
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

// Event Booking Form Component
const EventBookingForm = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    partySize: "",
    eventType: "",
    specialRequests: "",
  });
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateWhatsAppMessage = () => {
    const message = `Hello Isai Café Team,

I would like to book an event and here are my details:

Event Booking Inquiry:
• Name: ${formData.name}
• Email: ${formData.email}
• Phone: ${formData.phone}
• Preferred Date: ${formData.date}
• Preferred Time: ${formData.time}
• Party Size: ${formData.partySize} people
• Event Type: ${formData.eventType}
${
  formData.specialRequests
    ? `• Special Requests: ${formData.specialRequests}`
    : ""
}

Please confirm the availability and provide further details regarding the booking process.

Thank you.`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppBooking = () => {
    const whatsappMessage = generateWhatsAppMessage();
    const phoneNumber = "917806929935"; // Using the number from navigation
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleWhatsAppBooking();
    // Reset form after submission
    setFormData({
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      partySize: "",
      eventType: "",
      specialRequests: "",
    });
  };

  return (
    <section ref={ref} className="py-20 px-4 bg-[#1a1a1a]">
      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="isai-font text-5xl font-bold text-[#EFC1A9] mb-6">
            Book Your Event
          </h2>
          <p className="text-white text-xl max-w-2xl mx-auto leading-relaxed">
            Let us help you create an unforgettable experience in our intimate
            musical setting
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
          {/* Left Side - Info Cards */}
          <div className="xl:col-span-1 flex flex-col gap-8">
            {/* Event Services Card */}
            <div
              className={`flex-1 transform transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
            >
              <Card className="card-hover-animation bg-[#2a2a2a] border-[#3a3a3a] text-white h-full group relative overflow-hidden flex flex-col">
                <div className="card-glow absolute inset-0 bg-gradient-to-br from-[#EFC1A9]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="flex items-center gap-3 text-[#EFC1A9] text-xl group-hover:scale-105 transition-transform duration-300">
                    <Users className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    Event Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 flex-1">
                  <ul className="space-y-4">
                    {[
                      "Private dining experiences",
                      "Live classical music performances",
                      "Customized menu planning",
                      "Decorations and ambiance setup",
                      "Audio equipment for presentations",
                      "Professional photography arrangements",
                    ].map((service, index) => (
                      <li
                        key={index}
                        className={`flex items-center gap-4 transition-all duration-500 transform ${
                          isVisible
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-4"
                        }`}
                        style={{ transitionDelay: `${index * 100 + 200}ms` }}
                      >
                        <div className="w-2 h-2 bg-[#EFC1A9] rounded-full group-hover:scale-125 group-hover:rotate-45 transition-all duration-300 flex-shrink-0"></div>
                        <span className="group-hover:text-[#EFC1A9] transition-colors duration-300 text-sm leading-relaxed">
                          {service}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Timing & Capacity Card */}
            <div
              className={`flex-1 transform transition-all duration-700 delay-200 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
            >
              <Card className="card-hover-animation bg-[#2a2a2a] border-[#3a3a3a] text-white h-full group relative overflow-hidden flex flex-col">
                <div className="card-glow absolute inset-0 bg-gradient-to-br from-[#EFC1A9]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="flex items-center gap-3 text-[#EFC1A9] text-xl group-hover:scale-105 transition-transform duration-300">
                    <Clock className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    Timing & Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 flex-1">
                  <div className="space-y-6 h-full flex flex-col justify-between">
                    <div className="space-y-6">
                      <div
                        className={`transition-all duration-500 transform ${
                          isVisible
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-4"
                        }`}
                        style={{ transitionDelay: "300ms" }}
                      >
                        <h4 className="font-semibold mb-3 text-[#EFC1A9] group-hover:scale-105 transition-transform duration-300 text-base">
                          Operating Hours
                        </h4>
                        <p className="text-white/80 group-hover:text-white transition-colors text-sm">
                          Monday - Saturday: 8:00 AM - 11:00 PM
                        </p>
                        <p className="text-white/80 group-hover:text-white transition-colors text-sm">
                          Sunday: Closed
                        </p>
                      </div>
                      <div
                        className={`transition-all duration-500 transform ${
                          isVisible
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-4"
                        }`}
                        style={{ transitionDelay: "400ms" }}
                      >
                        <h4 className="font-semibold mb-3 text-[#EFC1A9] group-hover:scale-105 transition-transform duration-300 text-base">
                          Capacity
                        </h4>
                        <p className="text-white/80 group-hover:text-white transition-colors text-sm">
                          Maximum 60 guests for private events
                        </p>
                        <p className="text-white/80 group-hover:text-white transition-colors text-sm">
                          Intimate gatherings of 2-20 preferred
                        </p>
                      </div>
                    </div>

                    <div
                      className={`transition-all duration-500 transform ${
                        isVisible
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4"
                      }`}
                      style={{ transitionDelay: "500ms" }}
                    >
                      <h4 className="font-semibold mb-3 text-[#EFC1A9] group-hover:scale-105 transition-transform duration-300 text-base">
                        Advance Notice
                      </h4>
                      <p className="text-white/80 group-hover:text-white transition-colors text-sm">
                        Minimum 48 hours for small groups
                      </p>
                      <p className="text-white/80 group-hover:text-white transition-colors text-sm">
                        1 week advance for larger events
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Side - Main Booking Form */}
          <div className="xl:col-span-2">
            <div
              className={`h-full transform transition-all duration-700 delay-400 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-8"
              }`}
            >
              <Card className="card-hover-animation bg-[#2a2a2a] border-[#3a3a3a] text-white h-full group relative overflow-hidden flex flex-col">
                <div className="card-glow absolute inset-0 bg-gradient-to-br from-[#EFC1A9]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="border-b border-[#3a3a3a] pb-6 relative z-10">
                  <CardTitle className="flex items-center gap-3 text-[#EFC1A9] text-2xl group-hover:scale-105 transition-transform duration-300">
                    <Calendar className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                    Event Booking Form
                  </CardTitle>
                  <p className="text-white/70 mt-2 group-hover:text-white transition-colors duration-300">
                    Fill in your details and we'll get back to you within 24
                    hours
                  </p>
                </CardHeader>
                <CardContent className="pt-6 relative z-10 flex-1">
                  <form
                    onSubmit={handleFormSubmit}
                    className="space-y-6 h-full flex flex-col"
                  >
                    <div className="space-y-6 flex-1">
                      {/* Personal Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                          <Label
                            htmlFor="name"
                            className="text-white group-hover:text-[#EFC1A9] transition-colors duration-300 text-sm"
                          >
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            required
                            placeholder="Your full name"
                            className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-white/50 focus:border-[#EFC1A9] transition-all duration-300 hover:border-[#EFC1A9]/50 text-sm"
                          />
                        </div>
                        <div className="space-y-2 group">
                          <Label
                            htmlFor="email"
                            className="text-white group-hover:text-[#EFC1A9] transition-colors duration-300 text-sm"
                          >
                            Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            required
                            placeholder="your@email.com"
                            className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-white/50 focus:border-[#EFC1A9] transition-all duration-300 hover:border-[#EFC1A9]/50 text-sm"
                          />
                        </div>
                      </div>

                      {/* Contact & Party Size */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                          <Label
                            htmlFor="phone"
                            className="text-white group-hover:text-[#EFC1A9] transition-colors duration-300 text-sm"
                          >
                            Phone Number *
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            required
                            placeholder="+91 7806929935"
                            className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-white/50 focus:border-[#EFC1A9] transition-all duration-300 hover:border-[#EFC1A9]/50 text-sm"
                          />
                        </div>
                        <div className="space-y-2 group">
                          <Label
                            htmlFor="partySize"
                            className="text-white group-hover:text-[#EFC1A9] transition-colors duration-300 text-sm"
                          >
                            Party Size *
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              handleInputChange("partySize", value)
                            }
                          >
                            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white focus:border-[#EFC1A9] transition-all duration-300 hover:border-[#EFC1A9]/50 group-hover:border-[#EFC1A9]/30 text-sm">
                              <SelectValue placeholder="Number of guests" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                              <SelectItem value="2-5" className="text-sm">
                                2-5 people
                              </SelectItem>
                              <SelectItem value="6-10" className="text-sm">
                                6-10 people
                              </SelectItem>
                              <SelectItem value="11-20" className="text-sm">
                                11-20 people
                              </SelectItem>
                              <SelectItem value="21-50" className="text-sm">
                                21-50 people
                              </SelectItem>
                              <SelectItem value="50+" className="text-sm">
                                50+ people
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                          <Label
                            htmlFor="date"
                            className="text-white group-hover:text-[#EFC1A9] transition-colors duration-300 text-sm"
                          >
                            Preferred Date *
                          </Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              handleInputChange("date", e.target.value)
                            }
                            required
                            min={getTodayDate()}
                            className="bg-[#1a1a1a] border-[#3a3a3a] text-white focus:border-[#EFC1A9] transition-all duration-300 hover:border-[#EFC1A9]/50 text-sm"
                          />
                        </div>
                        <div className="space-y-2 group">
                          <Label
                            htmlFor="time"
                            className="text-white group-hover:text-[#EFC1A9] transition-colors duration-300 text-sm"
                          >
                            Preferred Time *
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              handleInputChange("time", value)
                            }
                          >
                            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white focus:border-[#EFC1A9] transition-all duration-300 hover:border-[#EFC1A9]/50 group-hover:border-[#EFC1A9]/30 text-sm">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                              <SelectItem value="morning" className="text-sm">
                                Morning (9 AM - 12 PM)
                              </SelectItem>
                              <SelectItem value="afternoon" className="text-sm">
                                Afternoon (12 PM - 5 PM)
                              </SelectItem>
                              <SelectItem value="evening" className="text-sm">
                                Evening (5 PM - 9 PM)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Event Type */}
                      <div className="space-y-2 group">
                        <Label
                          htmlFor="eventType"
                          className="text-white group-hover:text-[#EFC1A9] transition-colors duration-300 text-sm"
                        >
                          Event Type *
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            handleInputChange("eventType", value)
                          }
                        >
                          <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white focus:border-[#EFC1A9] transition-all duration-300 hover:border-[#EFC1A9]/50 group-hover:border-[#EFC1A9]/30 text-sm">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                            <SelectItem value="birthday" className="text-sm">
                              Birthday Party
                            </SelectItem>
                            <SelectItem value="anniversary" className="text-sm">
                              Anniversary
                            </SelectItem>
                            <SelectItem value="meeting" className="text-sm">
                              Business Meeting
                            </SelectItem>
                            <SelectItem value="celebration" className="text-sm">
                              Celebration
                            </SelectItem>
                            <SelectItem value="workshop" className="text-sm">
                              Workshop/Class
                            </SelectItem>
                            <SelectItem value="other" className="text-sm">
                              Other
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Special Requests */}
                      <div className="space-y-2 group">
                        <Label
                          htmlFor="specialRequests"
                          className="text-white group-hover:text-[#EFC1A9] transition-colors duration-300 text-sm"
                        >
                          Special Requests
                        </Label>
                        <Textarea
                          id="specialRequests"
                          value={formData.specialRequests}
                          onChange={(e) =>
                            handleInputChange("specialRequests", e.target.value)
                          }
                          placeholder="Any special requirements, dietary restrictions, or additional information..."
                          rows={3}
                          className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-white/50 focus:border-[#EFC1A9] transition-all duration-300 hover:border-[#EFC1A9]/50 resize-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="space-y-3">
                      <Button
                        type="submit"
                        className="w-full bg-[#EFC1A9] hover:bg-[#EFC1A9]/90 text-[#1a1a1a] font-semibold py-4 text-base transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#EFC1A9]/30 group"
                        disabled={
                          !formData.name ||
                          !formData.email ||
                          !formData.phone ||
                          !formData.date ||
                          !formData.time ||
                          !formData.partySize ||
                          !formData.eventType
                        }
                      >
                        <MessageCircle className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                        Send WhatsApp Enquiry
                      </Button>

                      <p className="text-white/60 text-center text-xs group-hover:text-white/80 transition-colors duration-300">
                        We'll get back to you within 24 hours to confirm your
                        booking details
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes cardSlideIn {
          from {
            opacity: 0;
            transform: translateX(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes formSlideIn {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes glowPulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(239, 193, 169, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 193, 169, 0.2);
          }
        }

        .glass-nav {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-pill {
          position: relative;
          overflow: hidden;
        }

        .nav-pill-active {
          background: linear-gradient(45deg, #efc1a9, #d4a088);
        }

        .nav-pill::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s;
        }

        .nav-pill:hover::before {
          left: 100%;
        }

        .card-hover-animation {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          animation: float 6s ease-in-out infinite;
        }

        .card-hover-animation:hover {
          transform: translateY(-5px) scale(1.01);
          animation: glowPulse 2s ease-in-out infinite;
          border-color: rgba(239, 193, 169, 0.3);
        }

        .card-glow {
          background: radial-gradient(
            circle at center,
            rgba(239, 193, 169, 0.15) 0%,
            transparent 70%
          );
        }
      `}</style>
    </section>
  );
};

// Footer Component (shared)
const Footer = () => {
  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Menu", href: "/menu" },
    { name: "Events", href: "/events" },
    { name: "Reservations", href: "/reservations" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <footer className="bg-[#0a0a0a] text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link
              href="/"
              className="isai-font text-3xl font-bold text-[#EFC1A9]"
            >
              Isai
            </Link>
            <p className="mt-4 text-[#a8a8a8]">
              Where music and home blend into one
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-[#EFC1A9]">Navigation</h3>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-[#a8a8a8] hover:text-[#EFC1A9] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-[#EFC1A9]">Follow Us</h3>
            <div className="flex space-x-4 mb-6">
              <a
                href="#"
                className="text-[#a8a8a8] hover:text-[#EFC1A9] transition-colors"
              >
                <Instagram size={24} />
              </a>
              <a
                href="#"
                className="text-[#a8a8a8] hover:text-[#EFC1A9] transition-colors"
              >
                <Facebook size={24} />
              </a>
              <a
                href="#"
                className="text-[#a8a8a8] hover:text-[#EFC1A9] transition-colors"
              >
                <Youtube size={24} />
              </a>
            </div>

            <div className="space-y-2 text-sm text-[#a8a8a8]">
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-[#EFC1A9]" />
                +91 7806929935
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-2 text-[#EFC1A9]" />
                hello@isai.cafe
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-[#EFC1A9]" />
                123 Art Street, Music District
              </div>
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

// Main Events Component
export default function Events() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation />
      <EventsHero />
      <EventBookingForm />
      <Footer />
    </div>
  );
}
