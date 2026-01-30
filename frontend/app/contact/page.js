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
  Instagram,
  Facebook,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  User,
  LogOut,
  ChevronDown,
  Briefcase,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Navigation Component (shared)
const Navigation = () => {
  const router = useRouter();
  const { user, isAuthenticated, isAgent, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("contact");
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

// Hero Section
const ContactHero = () => {
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
            "url('https://images.pexels.com/photos/8937347/pexels-photo-8937347.jpeg')",
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
            Contact Us
          </motion.h1>
          <motion.p
            className="text-2xl md:text-3xl text-white font-light tracking-wider"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          >
            Get in touch for inquiries, reservations, or just to say hello!
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

// Contact Information Section
const ContactInfo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="py-12 md:py-16 lg:py-20 px-4"
      style={{ backgroundColor: "#1E1E1E" }}
    >
      <div className="container mx-auto max-w-6xl">
        <div
          className={`text-center mb-8 md:mb-12 lg:mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2
            className="isai-font text-3xl md:text-4xl font-bold mb-4"
            style={{ color: "#EFC1A9" }}
          >
            Visit Us
          </h2>
          <p className="text-base md:text-lg" style={{ color: "#FFFFFF" }}>
            We'd love to see you at our café
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Address */}
          <Card
            className={`text-center transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{ backgroundColor: "#2B2B2B", borderColor: "#444444" }}
          >
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-isai-primary rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: "#FFFFFF" }}>
                4/408, Anna Salai Rd
                <br />
                Palavakkam
                <br />
                Chennai, Tamil Nadu 600041
                <br />
                India
              </p>
            </CardContent>
          </Card>

          {/* Phone & Email */}
          <Card
            className={`text-center transition-all duration-700 delay-400 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{ backgroundColor: "#2B2B2B", borderColor: "#444444" }}
          >
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-isai-primary rounded-full flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p style={{ color: "#FFFFFF" }}>
                  <strong style={{ color: "#EFC1A9" }}>Phone:</strong>
                  <br />
                  78069 29935
                </p>
                <p style={{ color: "#FFFFFF" }}>
                  <strong style={{ color: "#EFC1A9" }}>Email:</strong>
                  <br />
                  hello@isai.cafe
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Opening Hours */}
          <Card
            className={`text-center transition-all duration-700 delay-600 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{ backgroundColor: "#2B2B2B", borderColor: "#444444" }}
          >
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-isai-primary rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm" style={{ color: "#FFFFFF" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" style={{ color: "#EFC1A9" }} />
                  <span className="font-semibold" style={{ color: "#EFC1A9" }}>
                    Opening Hours:
                  </span>
                </div>
                <div className="text-left space-y-1 pl-6">
                  <p>• Saturday: 11 am – 10 pm</p>
                  <p>• Sunday: 11 am – 10 pm</p>
                  <p>• Monday: 5 pm – 10 pm</p>
                  <p>• Tuesday: Closed</p>
                  <p>• Wednesday: 5 pm – 10 pm</p>
                  <p>• Thursday: 5 pm – 10 pm</p>
                  <p>• Friday: 5 pm – 10 pm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Map Placeholder */}
        <div
          className={`transition-all duration-700 delay-800 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Card style={{ backgroundColor: "#2B2B2B", borderColor: "#444444" }}>
            <CardHeader>
              <CardTitle className="text-center" style={{ color: "#EFC1A9" }}>
                Find Us Here
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 md:h-80 lg:h-96 bg-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1800.7600925710758!2d80.25699040606492!3d12.961330142242598!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a525de630bd05dd%3A0x4a5fe8a63ec4d743!2sISAI%20-%20The%20Art%20Caf%C3%A9!5e0!3m2!1sen!2sin!4v1759588212788!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Isai Café Location"
                />
              </div>
              <p
                className="text-center text-xs md:text-sm mt-3 px-2"
                style={{ color: "#FFFFFF" }}
              >
                4/408, Anna Salai Rd, Palavakkam, Chennai • Easily accessible by
                public transport • Free parking available nearby
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
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
                +91 98765 43210
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

// Main Contact Component
export default function Contact() {
  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ backgroundColor: "#1E1E1E" }}
    >
      <Navigation />
      <ContactHero />
      <ContactInfo />
      <Footer />
    </div>
  );
}
