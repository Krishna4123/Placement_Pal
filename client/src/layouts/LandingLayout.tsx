import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sparkles, Menu, ArrowRight } from "lucide-react";
import { Btn } from "../components/common/UIElements";

export const LandingLayout: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] antialiased flex flex-col justify-between">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#111827]">
              PlacementPal <span className="text-[#2563EB]">AI</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "About", "Contact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hidden md:block text-sm text-[#6B7280] hover:text-[#111827] px-3 py-2 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <Btn variant="gradient" onClick={() => navigate("/login")}>
              Get Started
            </Btn>
            <button className="md:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden px-6 py-3 pb-4 bg-white border-t border-gray-100 space-y-1">
            {["Features", "How It Works", "About", "Contact"].map((item) => (
              <a key={item} href="#" className="block py-2 text-sm text-[#6B7280] hover:text-[#111827]">{item}</a>
            ))}
            <button onClick={() => navigate("/login")} className="block py-2 text-sm font-semibold text-[#2563EB]">
              Sign In
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6 bg-white/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-[#111827]">PlacementPal AI</span>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">AI-powered placement preparation for engineering students.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
              { title: "Resources", links: ["Documentation", "Blog", "Community", "Support"] },
              { title: "Company", links: ["About", "Careers", "Privacy", "Terms"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div className="text-sm font-semibold text-[#111827] mb-3">{title}</div>
                {links.map((link) => (
                  <a key={link} href="#" className="block text-sm text-[#6B7280] hover:text-[#111827] py-1 transition-colors">{link}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-sm text-[#6B7280]">© 2025 PlacementPal AI. Built for engineering students.</div>
            <div className="text-sm text-[#9CA3AF]">Made with ❤️ for campus placements</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
