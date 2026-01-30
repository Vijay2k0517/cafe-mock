// Copy this entire code and replace your app/page.js file

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Instagram,
  Facebook,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Heart,
  Calendar,
  Clock,
  Users,
  User,
  LogOut,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Navigation Component
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

  // Close menu when clicking outside
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

                {/* Dropdown Menu */}
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

// Hero Section Component
const HeroSection = () => {
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
            "url('https://images.unsplash.com/photo-1757534932627-539a974d4b93')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-30" />
      <div className="relative z-10 flex items-center justify-center h-full text-center">
        <div className="max-w-4xl px-4">
          <h1 className="isai-font text-8xl md:text-9xl font-bold text-white mb-4 animate-fade-in">
            Isai
          </h1>
          <p className="text-2xl md:text-3xl text-white font-light tracking-wider">
            the art café
          </p>
        </div>
      </div>
    </section>
  );
};

// Split Text Component
const SplitText = ({
  text,
  className = "",
  delay = 0,
  isVisible = false,
  staggerDelay = 0.05,
}) => {
  const letters = text.split("").map((letter, index) => (
    <span
      key={index}
      className="inline-block overflow-hidden"
      style={{
        transform: isVisible ? "translateY(0)" : "translateY(100%)",
        opacity: isVisible ? 1 : 0,
        transition: `all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${
          delay + index * staggerDelay
        }s`,
        willChange: "transform, opacity",
      }}
    >
      {letter === " " ? "\u00A0" : letter}
    </span>
  ));

  return <span className={`inline-block ${className}`}>{letters}</span>;
};

// About Snippet Component
const AboutSnippet = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

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

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-4 bg-[#2B2B2B]"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="isai-font text-6xl md:text-7xl font-extrabold text-[#EFC1A9] overflow-hidden">
              <SplitText
                text="ABOUT US"
                isVisible={isVisible}
                delay={0.1}
                staggerDelay={0.04}
              />
            </h2>
            <div
              className={`transform transition-all duration-700 delay-300 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-8 opacity-0"
              }`}
            >
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-[#EFC1A9] text-[#0a0a0a] rounded-full px-6 py-3 shadow hover:bg-[#d4b088] transition-all duration-300 font-semibold hover:scale-105"
              >
                <span>Learn more</span>
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  ↗
                </span>
              </Link>
            </div>
            <div className="space-y-4">
              <p
                className={`text-xl leading-relaxed text-white transition-all duration-700 delay-500 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                We started with a simple idea: make coffee that feels like home
                and tastes like joy.
              </p>
              <p
                className={`text-xl leading-relaxed text-white transition-all duration-700 delay-700 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                Everything we serve is handmade, heartfelt, and a little
                unexpected.
              </p>
            </div>
          </div>
          <div
            className={`relative transition-all duration-1000 delay-200 ${
              isVisible
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-12 opacity-0 scale-95"
            }`}
          >
            <div className="rounded-3xl overflow-hidden ring-8 ring-[#EFC1A9] shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
              <img
                src="https://images.unsplash.com/photo-1573822028151-731623cb0722"
                alt="Barista at work"
                className="w-full h-[350px] md:h-[400px] object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Opening Hours Component
const OpeningHoursBento = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const ref = useRef();

  const hours = [
    {
      day: "Monday",
      hours: "CLOSED",
      isClosed: true,
      offset: -25,
      delay: 0,
      waveSpeed: 1.2,
      wavePhase: 0.8,
    },
    {
      day: "Tuesday",
      hours: "06:00 - 16:00",
      isClosed: false,
      offset: 35,
      delay: 150,
      waveSpeed: 1.6,
      wavePhase: 1.4,
    },
    {
      day: "Wednesday",
      hours: "06:00 - 16:00",
      isClosed: false,
      offset: -30,
      delay: 300,
      waveSpeed: 1.1,
      wavePhase: 2.1,
    },
    {
      day: "Thursday",
      hours: "06:00 - 16:00",
      isClosed: false,
      offset: 40,
      delay: 450,
      waveSpeed: 1.8,
      wavePhase: 2.8,
    },
    {
      day: "Friday",
      hours: "06:00 - 16:00",
      isClosed: false,
      offset: -35,
      delay: 600,
      waveSpeed: 1.3,
      wavePhase: 3.5,
    },
    {
      day: "Saturday",
      hours: "06:00 - 16:00",
      isClosed: false,
      offset: 30,
      delay: 750,
      waveSpeed: 0.9,
      wavePhase: 4.2,
    },
    {
      day: "Sunday",
      hours: "CLOSED",
      isClosed: true,
      offset: -40,
      delay: 900,
      waveSpeed: 1.5,
      wavePhase: 4.9,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative py-20 px-4 min-h-screen flex items-center justify-center bg-[#1A1A1A] overflow-hidden"
    >
      <div
        className="absolute inset-0 w-full h-full bg-fixed"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1759244328512-e4a9128150f4')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 container mx-auto max-w-7xl">
        <div className="text-center relative mb-20">
          <h2 className="isai-font text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8">
            <SplitText
              text="OPENING HOURS"
              isVisible={isVisible}
              delay={0.2}
              staggerDelay={0.03}
            />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 max-w-7xl mx-auto relative">
          {hours.map((item, index) => {
            const wave1 =
              Math.sin(scrollY * 0.006 + item.wavePhase) * 35 * item.waveSpeed;
            const wave2 =
              Math.cos(scrollY * 0.004 + index * 0.7) *
              20 *
              (item.waveSpeed * 0.6);
            const wave3 =
              Math.sin(scrollY * 0.008 + index * 1.3) *
              15 *
              (item.waveSpeed * 0.4);

            const totalWaveOffset = wave1 + wave2 + wave3;

            const rotation1 = Math.sin(scrollY * 0.005 + index * 0.9) * 3;
            const rotation2 = Math.cos(scrollY * 0.003 + index * 1.7) * 1.5;
            const totalRotation = rotation1 + rotation2;

            const scale1 = 1 + Math.sin(scrollY * 0.01 + index * 0.5) * 0.08;
            const scale2 = Math.cos(scrollY * 0.007 + index * 1.1) * 0.03;
            const totalScale = scale1 + scale2;

            const horizontalOffset =
              Math.sin(scrollY * 0.005 + index * 0.6) * 15;

            return (
              <div
                key={item.day}
                className={`bg-[#EFC1A9] rounded-3xl p-8 shadow-2xl hover:shadow-4xl transition-all duration-1200 group overflow-hidden backdrop-blur-sm transform border-2 border-transparent hover:border-white/20 ${
                  isVisible ? "opacity-100" : "opacity-0 translate-y-16"
                }`}
                style={{
                  transitionDelay: `${item.delay}ms`,
                  transition:
                    "all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1s ease-out, box-shadow 0.6s ease",
                  transform: `
                    translateY(${totalWaveOffset + item.offset}px)
                    translateX(${horizontalOffset}px)
                    rotate(${totalRotation}deg)
                    scale(${totalScale})
                  `,
                  marginLeft:
                    index % 4 === 0 ? "2rem" : index % 3 === 1 ? "1rem" : "0",
                  marginRight:
                    index % 4 === 2 ? "2rem" : index % 3 === 0 ? "1rem" : "0",
                  marginTop: index % 2 === 0 ? "3rem" : "1rem",
                  marginBottom: index % 3 === 1 ? "3rem" : "1rem",
                }}
              >
                <h3 className="font-bold text-2xl md:text-3xl text-[#1A1A1A] mb-6 group-hover:text-white transition-all duration-500 text-center tracking-wide">
                  {item.day}
                </h3>
                <div className="text-center">
                  {item.isClosed ? (
                    <p className="text-xl font-bold text-red-600 group-hover:text-red-200 transition-colors duration-500 tracking-wider">
                      {item.hours}
                    </p>
                  ) : (
                    <p className="text-xl font-semibold text-[#1A1A1A] group-hover:text-white transition-colors duration-500 tracking-wider">
                      {item.hours}
                    </p>
                  )}
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#1A1A1A] group-hover:bg-white rounded-full opacity-30 group-hover:opacity-60 transition-all duration-500"></div>
              </div>
            );
          })}
        </div>

        <div
          className={`text-center mt-20 transition-all duration-1200 delay-1200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-white text-2xl opacity-90 font-light tracking-wide">
            Visit us during our opening hours for the best coffee experience
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-24 h-1 bg-[#EFC1A9] rounded-full opacity-60"></div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .shadow-4xl {
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 30px rgba(239, 193, 169, 0.3),
            0 0 60px rgba(239, 193, 169, 0.1);
        }

        .hover\\:shadow-4xl:hover {
          box-shadow:
            0 35px 60px -12px rgba(0, 0, 0, 0.6),
            0 0 40px rgba(239, 193, 169, 0.4),
            0 0 80px rgba(239, 193, 169, 0.2);
        }
      `}</style>
    </section>
  );
};

// Culinary Experience Section
const CulinaryExperience = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  const features = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Artisanal Coffee",
      description:
        "Handcrafted brews using single-origin beans from sustainable farms",
      delay: 0,
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Seasonal Menu",
      description:
        "Fresh ingredients changing with the seasons for optimal flavor",
      delay: 100,
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Space",
      description:
        "A welcoming environment for creatives and coffee lovers alike",
      delay: 200,
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Live Music",
      description: "Weekly performances featuring local artists and musicians",
      delay: 300,
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.4 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 px-4 bg-[#1C1C1C]">
      <div className="container mx-auto max-w-6xl">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="isai-font text-6xl md:text-7xl font-extrabold text-[#EFC1A9] mb-6">
            CULINARY EXPERIENCE
          </h2>
          <p className="text-xl text-white mb-12 max-w-3xl mx-auto leading-relaxed">
            Immerse yourself in a world where exceptional flavors meet artistic
            expression. Every dish tells a story, every cup creates a memory.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-700 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-8 opacity-0 scale-95"
            }`}
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-3 bg-[#EFC1A9] text-[#1A1A1A] rounded-full px-10 py-5 shadow-2xl hover:shadow-3xl transition-all duration-500 font-bold text-xl hover:scale-105 hover:bg-[#d4b088] group"
            >
              <span>Discover Our Menu</span>
              <span className="transition-transform duration-300 group-hover:translate-x-2">
                →
              </span>
            </Link>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-3 border-2 border-[#EFC1A9] text-[#EFC1A9] rounded-full px-10 py-5 shadow-2xl hover:shadow-3xl transition-all duration-500 font-bold text-xl hover:scale-105 hover:bg-[#EFC1A9] hover:text-[#1A1A1A] group"
            >
              <Calendar className="w-6 h-6" />
              <span>Reserve a Table</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-[#2B2B2B] rounded-2xl p-8 border border-gray-700 hover:border-[#EFC1A9] transition-all duration-500 hover:scale-105 hover:shadow-2xl group cursor-pointer ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: `${feature.delay}ms`,
                transform: isVisible
                  ? "translateY(0) rotateY(0)"
                  : "translateY(20px) rotateY(10deg)",
              }}
            >
              <div className="text-[#EFC1A9] mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center group-hover:text-[#EFC1A9] transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed text-center group-hover:text-white transition-colors duration-300">
                {feature.description}
              </p>

              <div className="w-0 group-hover:w-full h-1 bg-[#EFC1A9] rounded-full mx-auto mt-6 transition-all duration-500"></div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="w-32 h-1 bg-[#EFC1A9] rounded-full mx-auto opacity-60"></div>
          <p className="text-white text-lg mt-8 opacity-80">
            Open Tuesday to Saturday • 6:00 AM - 4:00 PM
          </p>
        </div>
      </div>
    </section>
  );
};

// Instagram Section
const InstagramSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  const instagramPosts = [
    {
      id: 1,
      src: "https://www.instagram.com/p/DLctkRcyPg-/",
      thumbnail: "https://i.postimg.cc/sXj9Fy9x/pic-3.jpg",
      alt: "Coffee Art",
    },
    {
      id: 2,
      src: "https://www.instagram.com/p/DPjidybEvjC/",
      thumbnail: "https://i.postimg.cc/TYp0Yd8L/pic-2.jpg",
      alt: "Cafe Interior",
    },
    {
      id: 3,
      src: "https://www.instagram.com/p/DPbsCTdjNla/",
      thumbnail: "https://i.postimg.cc/C5YypRrz/pic-1.jpg",
      alt: "Fresh Pastries",
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 px-4 bg-[#1A1A1A]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="isai-font text-5xl md:text-6xl font-extrabold text-[#EFC1A9] mb-6">
            FOLLOW OUR JOURNEY
          </h2>

          <p className="text-white text-xl leading-relaxed max-w-2xl mx-auto mb-8">
            Behind the scenes, daily specials, and moments that make Isai
            special
          </p>

          <div className="flex justify-center">
            <a
              href="https://www.instagram.com/isai.artcafe/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#EFC1A9] text-[#1A1A1A] rounded-full px-8 py-4 shadow-lg hover:bg-[#d4b088] transition-all duration-200 font-semibold text-lg"
            >
              <Instagram size={24} />
              <span>Follow @isai.artcafe</span>
            </a>
          </div>
        </div>

        <div className="flex justify-center mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
            {instagramPosts.map((post) => (
              <div key={post.id} className="relative group">
                <a
                  href={post.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl"
                >
                  <img
                    src={post.thumbnail}
                    alt={post.alt}
                    className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute top-4 right-4">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-2 shadow-lg">
                      <Instagram size={13} className="text-white" />
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110">
                        <Instagram size={32} className="text-white" />
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <a
            href="https://www.instagram.com/isai.artcafe/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 text-white hover:text-[#EFC1A9] transition-all duration-200 font-semibold text-lg border-2 border-white hover:border-[#EFC1A9] rounded-full px-8 py-4"
          >
            <span>View All Posts</span>
            <Instagram size={20} />
          </a>
        </div>
      </div>
    </section>
  );
};

// Footer Component
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
    <footer className="bg-[#000000] text-white py-16">
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

// Main Home Component
export default function Home() {
  return (
    <div className="min-h-screen light-components">
      <Navigation />
      <HeroSection />
      <AboutSnippet />
      <OpeningHoursBento />
      <CulinaryExperience />
      <InstagramSection />
      <Footer />
    </div>
  );
}
