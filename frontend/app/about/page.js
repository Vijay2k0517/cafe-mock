"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Instagram,
  Facebook,
  Youtube,
  Phone,
  Mail,
  MapPin,
  User,
  LogOut,
  ChevronDown,
  Briefcase,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Navigation Component
const Navigation = () => {
  const router = useRouter();
  const { user, isAuthenticated, isAgent, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("about");
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
const AboutHero = () => {
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
            "url('https://images.unsplash.com/photo-1658386321885-0b180ba0245d')",
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
            About
          </motion.h1>
          <motion.p
            className="text-2xl md:text-3xl text-white font-light tracking-wider"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          >
            Discover our story, philosophy, and the harmonious blend of music!
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

// Split Text Reveal Component
const SplitTextReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();
  const [offsets, setOffsets] = useState({
    text: 0,
    imageRotate: 0,
    imageTranslate: 0,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.6 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // randomize per mount for subtle scattered layout
    const rand = (min, max) => Math.random() * (max - min) + min;
    setOffsets({
      text: rand(-8, 8),
      imageRotate: rand(-2, 2),
      imageTranslate: rand(-10, 10),
    });
  }, []);

  return (
    <section
      ref={ref}
      className="py-20 px-4"
      style={{ backgroundColor: "#333333" }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Text */}
          <div
            className="space-y-8"
            style={{ transform: `translateY(${offsets.text}px)` }}
          >
            <div
              className={`split-text ${isVisible ? "split-text-revealed" : ""}`}
            >
              <h2
                className="isai-font text-4xl md:text-5xl font-bold leading-tight"
                style={{ color: "#EFC1A9" }}
              >
                <span className="split-text-line">
                  <span className="split-text-word">Where</span>{" "}
                  <span className="split-text-word">Classical</span>
                </span>
                <br />
                <span className="split-text-line">
                  <span className="split-text-word">Meets</span>{" "}
                  <span className="split-text-word">Contemporary</span>
                </span>
              </h2>
            </div>

            <div
              className={`transition-all duration-1000 delay-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <p
                className="text-lg leading-relaxed mb-6"
                style={{ color: "#FFFFFF" }}
              >
                Isai was born from a simple dream: to create a space where the
                timeless beauty of classical music meets the comfort of home.
                Our founders, both musicians and culinary enthusiasts,
                envisioned a café that would nourish both body and soul.
              </p>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#FFFFFF" }}
              >
                Every corner of our space is thoughtfully designed to inspire
                creativity, foster connection, and celebrate the art of living
                well. From our carefully curated playlist to our artisanal
                coffee, everything is crafted with intention and love.
              </p>
            </div>
          </div>

          {/* Right Image with Triangular Rounded Shape */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            style={{
              transform: `translateX(${offsets.imageTranslate}px) rotate(${offsets.imageRotate}deg)`,
            }}
          >
            <div
              className="w-full h-96 bg-cover bg-center rounded-3xl shadow-2xl"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1593518468260-7e32a7467614')",
                clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 85%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// History Section
const HistorySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();
  const [scatter, setScatter] = useState({ left: 0, right: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.6 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const rand = (min, max) => Math.random() * (max - min) + min;
    setScatter({ left: rand(-10, 10), right: rand(-6, 6) });
  }, []);

  return (
    <section
      ref={ref}
      className="py-20 px-4"
      style={{ backgroundColor: "#2B2B2B" }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Image */}
          <div
            className={`transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-12"
            }`}
            style={{ transform: `translateY(${scatter.left}px)` }}
          >
            <div
              className="w-full h-96 bg-cover bg-center rounded-3xl shadow-2xl"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1670978738759-cd4693a1b46b')",
              }}
            />
          </div>

          {/* Right Text */}
          <div
            className={`space-y-8 transition-all duration-1000 delay-300 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-12"
            }`}
            style={{ transform: `translateY(${scatter.right}px)` }}
          >
            <h3
              className="isai-font text-4xl font-bold"
              style={{ color: "#EFC1A9" }}
            >
              Our Heritage
            </h3>
            <div className="space-y-6">
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#FFFFFF" }}
              >
                Founded in 2018, Isai began as a small neighborhood café with
                big dreams. Our name, meaning "music" in Tamil, reflects our
                deep connection to the cultural richness of classical
                traditions.
              </p>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#FFFFFF" }}
              >
                What started as a passion project has grown into a beloved
                community hub, where locals gather for morning coffee, artists
                find inspiration, and music lovers discover new melodies over
                carefully prepared meals.
              </p>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#FFFFFF" }}
              >
                Today, we continue to honor our founding principles: exceptional
                quality, warm hospitality, and the belief that food and music
                are the universal languages of human connection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Theme & Concept Section
const ThemeSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();
  const [tilt, setTilt] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.6 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setTilt((Math.random() - 0.5) * 2); // -1 to 1 deg
  }, []);

  return (
    <section
      ref={ref}
      className="py-20 px-4"
      style={{ backgroundColor: "#333333" }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Text */}
          <div
            className={`space-y-8 transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-12"
            }`}
          >
            <h3
              className="isai-font text-4xl font-bold"
              style={{ color: "#EFC1A9" }}
            >
              Our Philosophy
            </h3>
            <div className="space-y-6">
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#FFFFFF" }}
              >
                At Isai, we believe that dining is a multisensory experience.
                The gentle melodies of classical compositions create the perfect
                backdrop for meaningful conversations and moments of reflection.
              </p>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#FFFFFF" }}
              >
                Our menu draws inspiration from traditional recipes while
                embracing modern techniques. Each dish is crafted to complement
                our acoustic environment, creating harmony between taste, sound,
                and atmosphere.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div>
                  <h4
                    className="font-semibold mb-2"
                    style={{ color: "#EFC1A9" }}
                  >
                    Our Values
                  </h4>
                  <ul className="space-y-1" style={{ color: "#FFFFFF" }}>
                    <li>• Artistic Excellence</li>
                    <li>• Cultural Appreciation</li>
                    <li>• Community Connection</li>
                    <li>• Sustainable Practices</li>
                  </ul>
                </div>
                <div>
                  <h4
                    className="font-semibold mb-2"
                    style={{ color: "#EFC1A9" }}
                  >
                    Experience
                  </h4>
                  <ul className="space-y-1" style={{ color: "#FFFFFF" }}>
                    <li>• Live Performances</li>
                    <li>• Art Exhibitions</li>
                    <li>• Cultural Events</li>
                    <li>• Educational Workshops</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-12"
            }`}
            style={{ transform: `rotate(${tilt}deg)` }}
          >
            <div
              className="w-full h-96 bg-cover bg-center rounded-3xl shadow-2xl"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1573822028151-731623cb0722')",
              }}
            />
          </div>
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

// Main About Component
export default function About() {
  return (
    <div className="min-h-screen light-components">
      <Navigation />
      <AboutHero />
      <SplitTextReveal />
      <HistorySection />
      <ThemeSection />
      <Footer />
    </div>
  );
}
