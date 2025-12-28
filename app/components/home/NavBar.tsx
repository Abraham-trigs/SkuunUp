"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onAboutClick?: () => void;
  onGalleryClick?: () => void;
  onHomeClick?: () => void;
  onContactClick?: () => void;
  activePage?: "home" | "gallery" | "about" | "contact";
}

export default function Navbar({
  onGalleryClick,
  onHomeClick,
  onAboutClick,
  onContactClick,
  activePage = "home",
}: NavbarProps) {
  const [open, setOpen] = useState(false);

  // Added 'id' to help isActive logic and removed non-existent href references
  const links = [
    { id: "home", label: "Home", action: onHomeClick },
    { id: "gallery", label: "Gallery", action: onGalleryClick },
    { id: "about", label: "About", action: onAboutClick },
    { id: "contact", label: "Contact", action: onContactClick },
  ];

  const isActive = (id: string) => activePage === id;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-ark-lightblue transition-all duration-300">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
        {/* Logo */}
        <button
          onClick={() => {
            setOpen(false);
            onHomeClick?.();
          }}
          className="text-2xl font-black tracking-tight text-ark-navy"
        >
          Ford<span className="text-ark-red">School</span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setOpen(false);
                link.action?.();
              }}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                isActive(link.id)
                  ? "bg-ark-deepblue text-white shadow-md"
                  : "text-ark-navy hover:bg-ark-lightblue/30 hover:text-ark-deepblue"
              }`}
            >
              {link.label}
            </button>
          ))}

          <Link
            href="/auth/login"
            className="ml-4 bg-ark-red hover:bg-ark-navy text-white px-6 py-2 rounded-full font-bold transition-transform active:scale-95 shadow-lg"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-ark-navy hover:bg-ark-lightblue/20 rounded-lg"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-ark-lightblue px-6 py-6 space-y-3 shadow-xl animate-in slide-in-from-top">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setOpen(false);
                link.action?.();
              }}
              className={`block w-full text-left p-4 rounded-xl font-bold transition-colors ${
                isActive(link.id)
                  ? "bg-ark-lightblue text-ark-deepblue"
                  : "text-ark-navy hover:bg-ark-lightblue/10"
              }`}
            >
              {link.label}
            </button>
          ))}
          <Link
            href="/auth/login"
            onClick={() => setOpen(false)}
            className="block bg-ark-navy text-white text-center p-4 rounded-xl font-bold shadow-lg"
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
