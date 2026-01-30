"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogOut,
  Calendar,
  ChefHat,
  Briefcase,
  Coffee,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Check auth state
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("user");
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    
    checkAuth();
    
    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener("storage", checkAuth);
    
    // Custom event for same-tab auth changes
    window.addEventListener("authChange", checkAuth);
    
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChange", checkAuth);
    };
  }, []);
  
  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [pathname]);
  
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setShowUserMenu(false);
    
    // Dispatch custom event
    window.dispatchEvent(new Event("authChange"));
    
    // Redirect to home if on protected page
    if (pathname === "/agent" || pathname === "/reservations") {
      router.push("/");
    }
  };
  
  const getRoleIcon = (role) => {
    switch (role) {
      case "agent":
        return <Briefcase className="w-4 h-4" />;
      case "admin":
        return <ChefHat className="w-4 h-4" />;
      default:
        return <Coffee className="w-4 h-4" />;
    }
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case "agent":
        return "text-blue-400";
      case "admin":
        return "text-purple-400";
      default:
        return "text-[#EFC1A9]";
    }
  };
  
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#1E1E1E]/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="isai-font text-3xl md:text-4xl font-bold text-[#EFC1A9] hover:text-[#d4b088] transition-colors">
              Isai
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors relative group ${
                  pathname === link.href
                    ? "text-[#EFC1A9]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#EFC1A9] rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>
          
          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            
            {/* Reserve Button */}
            <Link
              href="/reservations"
              className="px-4 py-2 bg-[#EFC1A9]/20 text-[#EFC1A9] rounded-lg text-sm font-medium hover:bg-[#EFC1A9]/30 transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Reserve
            </Link>
            
            {/* User Menu or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#EFC1A9]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#EFC1A9]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white truncate max-w-[100px]">
                      {user.name}
                    </p>
                    <p className={`text-xs capitalize ${getRoleColor(user.role)}`}>
                      {user.role}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                </button>
                
                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[#2B2B2B] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10">
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-white/60 text-sm truncate">{user.phone}</p>
                        <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded text-xs font-medium ${
                          user.role === "agent" ? "bg-blue-500/20 text-blue-400" :
                          user.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                          "bg-[#EFC1A9]/20 text-[#EFC1A9]"
                        }`}>
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </div>
                      </div>
                      
                      <div className="p-2">
                        {(user.role === "agent" || user.role === "admin") && (
                          <Link
                            href="/agent"
                            className="flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <Briefcase className="w-4 h-4" />
                            Agent Dashboard
                          </Link>
                        )}
                        <Link
                          href="/reservations"
                          className="flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          My Reservations
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-[#EFC1A9] text-[#1E1E1E] rounded-lg text-sm font-semibold hover:bg-[#d4b088] transition-colors"
              >
                Login
              </Link>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#1E1E1E] border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {/* User Info (Mobile) */}
              {user && (
                <div className="mb-4 p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#EFC1A9]/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-[#EFC1A9]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className={`text-sm capitalize ${getRoleColor(user.role)}`}>
                        {user.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-[#EFC1A9]/10 text-[#EFC1A9]"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Reserve Button (Mobile) */}
              <Link
                href="/reservations"
                className="block px-4 py-3 rounded-lg text-base font-medium bg-[#EFC1A9]/20 text-[#EFC1A9] hover:bg-[#EFC1A9]/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Reserve a Table
                </span>
              </Link>
              
              {/* Agent Dashboard Link (Mobile) */}
              {user && (user.role === "agent" || user.role === "admin") && (
                <Link
                  href="/agent"
                  className="block px-4 py-3 rounded-lg text-base font-medium text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Agent Dashboard
                  </span>
                </Link>
              )}
              
              {/* Login/Logout (Mobile) */}
              <div className="pt-4 border-t border-white/10">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block px-4 py-3 rounded-lg text-base font-medium bg-[#EFC1A9] text-[#1E1E1E] text-center hover:bg-[#d4b088] transition-colors"
                  >
                    Login / Sign Up
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
