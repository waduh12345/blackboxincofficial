// Navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
// Mengganti @tabler/icons-react dengan lucide-react (lebih umum di ekosistem Next.js)
import { Menu, X, User, LogOut } from "lucide-react";
import clsx from "clsx";
import { useSession, signOut } from "next-auth/react"; // Menambahkan signOut

const navItems = [
  { label: "Beranda", href: "/" },
  { label: "Produk", href: "/product" },
  { label: "Berita", href: "/berita" },
  { label: "Galeri", href: "/galeri" },
  { label: "Profil", href: "/profile" }, // Pindahkan ke bawah agar lebih mudah diakses saat logged in
];

export default function Navbar() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();

  // True jika sudah login dan status bukan loading
  const isLoggedIn = status === "authenticated" && !!session;

  const handleSignOut = async () => {
    // Fungsi signOut dari next-auth
    await signOut({ callbackUrl: '/' }); 
  };
  
  const handleLinkClick = () => {
    setSidebarOpen(false);
  }

  return (
    // Header minimalis B&W
    <nav className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand Name (Left) */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-xl font-extrabold tracking-[0.2em] uppercase text-black">
              BRANDNAME
            </h1>
            {/* Tagline optional */}
            {/* <span className="text-[10px] text-gray-500 uppercase tracking-[0.25em] ml-1">Elegant</span> */}
          </Link>

          {/* Desktop Menu (Center/Right) */}
          <div className="hidden md:flex items-center gap-8">
            {/* Primary Nav Links */}
            <div className="flex items-center gap-6 text-sm font-medium tracking-wider uppercase">
              {navItems.filter(item => item.label !== "Profil").map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-black transition-colors relative group py-1"
                >
                  {item.label}
                  {/* Underline minimalis saat hover/active */}
                  <span className="absolute left-0 bottom-0 h-[1.5px] w-full bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
              ))}
            </div>

            {/* Auth/User Section - Desktop */}
            <div className="flex items-center gap-4 border-l border-gray-200 pl-4 ml-4">
              {isLoggedIn ? (
                <>
                  <Link 
                    href="/profile"
                    className="text-black hover:text-gray-700 p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                    aria-label="Profile"
                  >
                    <User size={20} />
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-xs font-semibold text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors uppercase"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/auth/register"
                    className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button & User Icon (Right - Mobile Only) */}
          <div className="flex items-center md:hidden gap-2">
            {isLoggedIn && (
                <Link 
                    href="/profile"
                    className="text-black hover:text-gray-700 p-2 rounded-full transition-colors"
                    aria-label="Profile"
                    onClick={handleLinkClick}
                >
                    <User size={24} />
                </Link>
            )}
            <button 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors" 
                onClick={() => setSidebarOpen(true)}
                aria-label="Toggle navigation menu"
            >
              <Menu size={24} className="text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* --- Sidebar Overlay --- */}
      <div
        className={clsx(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300",
          isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* --- Sidebar (Mobile Menu) --- */}
      <div
        className={clsx(
          "fixed top-0 left-0 h-full w-[80%] max-w-xs bg-white z-50 p-6 transform transition-transform duration-300 shadow-xl",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-between items-center pb-6 border-b border-gray-100 mb-6">
          <span className="text-xl font-bold uppercase tracking-wider">Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={24} className="text-black" />
          </button>
        </div>

        <div className="flex flex-col gap-1 text-base font-semibold">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className="text-gray-800 hover:text-black hover:bg-gray-50 p-3 rounded-lg transition-colors uppercase tracking-wider"
            >
              {item.label}
            </Link>
          ))}
          
          {/* Auth Section - Mobile */}
          <div className="mt-8 pt-4 border-t border-gray-100 space-y-3">
            {isLoggedIn ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full text-left text-red-600 hover:bg-red-50 p-3 rounded-lg transition-colors font-medium"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  onClick={handleLinkClick}
                  className="w-full text-center text-gray-800 border border-gray-300 hover:bg-gray-100 p-3 rounded-lg transition-colors uppercase tracking-wider"
                >
                  Sign Up
                </Link>
                <Link
                  href="/auth/login"
                  onClick={handleLinkClick}
                  className="w-full text-center text-white bg-black hover:bg-gray-800 p-3 rounded-lg transition-colors uppercase tracking-wider"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}