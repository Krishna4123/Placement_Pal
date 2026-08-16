import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sparkles, Menu, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Btn } from "../components/common/UIElements";
import { useTheme } from "../context/ThemeContext";

export const LandingLayout: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background antialiased flex flex-col justify-between">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-lg font-semibold text-foreground">
              PlacementPal <span className="text-primary">AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "About", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground px-3 py-2 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <Btn variant="gradient" onClick={() => navigate("/login")}>
              Get Started
            </Btn>

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
              title={resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {resolvedTheme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <button className="md:hidden p-2 rounded-xl hover:bg-secondary" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden px-6 py-3 pb-4 bg-card border-t border-border space-y-1 overflow-hidden"
            >
              {["Features", "How It Works", "About", "Contact"].map((item) => (
                <a key={item} href="#" className="block py-2 text-sm text-muted-foreground hover:text-foreground">{item}</a>
              ))}
              <button onClick={() => navigate("/login")} className="block py-2 text-sm font-semibold text-primary">
                Sign In
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-card/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-foreground">PlacementPal AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">AI-powered placement preparation for engineering students.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
              { title: "Resources", links: ["Documentation", "Blog", "Community", "Support"] },
              { title: "Company", links: ["About", "Careers", "Privacy", "Terms"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div className="text-sm font-semibold text-foreground mb-3">{title}</div>
                {links.map((link) => (
                  <a key={link} href="#" className="block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors">{link}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-sm text-muted-foreground">© 2025 PlacementPal AI. Built for engineering students.</div>
            <div className="text-sm text-muted-foreground">Made with ❤️ for campus placements</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
