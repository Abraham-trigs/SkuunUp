"use client";

import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

export default function SchoolFooter() {
  return (
    <footer className="bg-ark-navy text-white py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Logo & About */}
        <div className="space-y-4">
          <h2 className="text-3xl font-black tracking-tighter">
            Ford<span className="text-ark-red">School</span>
          </h2>
          <p className="text-sm text-ark-lightblue/70 leading-relaxed">
            Nurturing excellence, integrity, and purpose-driven education for
            every child. Establishing a foundation for lifelong success in 2025
            and beyond.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-bold text-lg mb-6 border-b-2 border-ark-red w-fit pb-1">
            Quick Links
          </h3>
          <ul className="space-y-3 text-sm text-ark-lightblue/80 font-medium">
            <li>
              <Link href="/" className="hover:text-ark-cyan transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-ark-cyan transition-colors"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/programs"
                className="hover:text-ark-cyan transition-colors"
              >
                Academic Programs
              </Link>
            </li>
            <li>
              <Link
                href="/admissions"
                className="hover:text-ark-cyan transition-colors"
              >
                Admissions
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-ark-cyan transition-colors"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-bold text-lg mb-6 border-b-2 border-ark-red w-fit pb-1">
            Contact Us
          </h3>
          <ul className="space-y-4 text-sm text-ark-lightblue/80 font-medium">
            <li>Address: 123 School Lane, Accra, Ghana</li>
            <li>Phone: +233 123 456 789</li>
            <li>Email: info@fordschool.com</li>
          </ul>
          {/* Embedded Google Map */}
          <div className="mt-6 w-full h-32 overflow-hidden rounded-xl border border-ark-lightblue/20">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.7727649217095!2d-0.1050236!3d5.6005516!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf85ad10f34f7d%3A0xf7077b28504ce1f0!2sFord%20School!5e0!3m2!1sen!2sgh!4v1761013185863!5m2!1sen!2sgh"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        {/* Newsletter & Socials */}
        <div>
          <h3 className="font-bold text-lg mb-6 border-b-2 border-ark-red w-fit pb-1">
            Stay Connected
          </h3>
          <form className="flex flex-col gap-3 mb-6">
            <input
              type="email"
              placeholder="Your email address"
              className="px-4 py-2.5 rounded-lg bg-ark-deepblue border border-ark-lightblue/30 text-white text-sm focus:outline-none focus:border-ark-cyan transition-colors"
            />
            <button
              type="submit"
              className="bg-ark-red px-4 py-2.5 rounded-lg text-white font-bold text-sm hover:bg-white hover:text-ark-navy transition-all shadow-lg active:scale-95"
            >
              Subscribe
            </button>
          </form>
          <div className="flex gap-5">
            <a
              href="#"
              className="p-2 bg-ark-deepblue rounded-lg hover:bg-ark-cyan hover:text-ark-navy transition-all duration-300"
            >
              <FaFacebookF size={18} />
            </a>
            <a
              href="#"
              className="p-2 bg-ark-deepblue rounded-lg hover:bg-ark-cyan hover:text-ark-navy transition-all duration-300"
            >
              <FaInstagram size={18} />
            </a>
            <a
              href="#"
              className="p-2 bg-ark-deepblue rounded-lg hover:bg-ark-cyan hover:text-ark-navy transition-all duration-300"
            >
              <FaLinkedinIn size={18} />
            </a>
            <a
              href="#"
              className="p-2 bg-ark-deepblue rounded-lg hover:bg-ark-cyan hover:text-ark-navy transition-all duration-300"
            >
              <FaYoutube size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-16 border-t border-ark-lightblue/10 pt-8 text-center text-xs text-ark-lightblue/50 uppercase tracking-[0.2em] font-bold">
        © 2025 FORD School Limited. Empowering the next generation.
      </div>
    </footer>
  );
}
