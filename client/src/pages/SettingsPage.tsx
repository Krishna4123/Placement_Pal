import React, { useState } from "react";
import { Check, Sun, Moon, Monitor } from "lucide-react";
import { motion } from "motion/react";
import { GlassCard, Btn } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";
import { useTheme } from "../context/ThemeContext";

export const SettingsPage: React.FC = () => {
  const { profile, setProfile } = useSession();
  const { theme, setTheme } = useTheme();

  const [selectedPlatforms, setSelectedPlatforms] = useState(["LeetCode", "GeeksforGeeks"]);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    college: profile.college,
    department: profile.department,
    gradYear: profile.gradYear,
    cgpa: profile.cgpa,
  });

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return "AK";
  };

  const handleSave = () => {
    setProfile((prev) => ({
      ...prev,
      name: formData.name,
      email: formData.email,
      college: formData.college,
      department: formData.department,
      gradYear: formData.gradYear,
      cgpa: formData.cgpa,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const themeOptions = [
    { id: "light" as const, label: "Light Mode", icon: Sun, desc: "Clean, bright interface" },
    { id: "dark" as const, label: "Dark Mode", icon: Moon, desc: "Easy on the eyes at night" },
    { id: "system" as const, label: "System", icon: Monitor, desc: "Follows your OS setting" },
  ];

  const inputClass =
    "w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none input-glow placeholder:text-muted-foreground";

  return (
    <div className="max-w-3xl mx-auto pb-8 space-y-5">
      {/* Profile Card */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-foreground mb-5">Profile Information</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {getInitials(formData.name)}
          </div>
          <div>
            <Btn size="sm" variant="secondary">Change Photo</Btn>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2 MB</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Full Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              type="text"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Email Address</label>
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              type="email"
              className={inputClass}
            />
          </div>
        </div>
      </GlassCard>

      {/* Academic Details */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-foreground mb-5">Academic Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">College / University</label>
            <input
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Department / Branch</label>
            <input
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Graduation Year</label>
            <input
              value={formData.gradYear}
              onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">CGPA</label>
            <input
              value={formData.cgpa}
              onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </GlassCard>

      {/* Coding Platforms */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-foreground mb-1.5">Preferred Coding Platforms</h3>
        <p className="text-xs text-muted-foreground mb-4">These platforms will be prioritized in your generated curriculum</p>
        <div className="flex flex-wrap gap-2">
          {["LeetCode", "HackerRank", "Codeforces", "GeeksforGeeks", "InterviewBit", "CodeChef"].map((p) => {
            const isSelected = selectedPlatforms.includes(p);
            return (
              <button
                key={p}
                onClick={() =>
                  setSelectedPlatforms((prev) =>
                    isSelected ? prev.filter((x) => x !== p) : [...prev, p]
                  )
                }
                className={`px-3.5 py-1.5 rounded-xl border text-sm font-medium transition-all cursor-pointer chip-hover ${
                  isSelected
                    ? "bg-accent border-primary/30 text-primary chip-active"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {p}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Theme — fully wired */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-foreground mb-1.5">Appearance</h3>
        <p className="text-xs text-muted-foreground mb-4">Choose your preferred theme — changes apply instantly</p>
        <div className="grid grid-cols-3 gap-3 max-w-lg">
          {themeOptions.map(({ id, label, icon: Icon, desc }) => (
            <motion.button
              key={id}
              onClick={() => setTheme(id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer text-center ${
                theme === id
                  ? "border-primary bg-accent text-primary shadow-sm"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              <Icon className="w-5 h-5" />
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-[10px] mt-0.5 opacity-70">{desc}</div>
              </div>
              {theme === id && (
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Notifications</h3>
        <div className="space-y-3">
          {[
            { label: "Daily Reminder", desc: "Get reminded to complete your daily tasks" },
            { label: "Deadline Alerts", desc: "Alerts for upcoming company application deadlines" },
            { label: "AI Suggestions", desc: "Weekly AI-generated study suggestions and insights" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full relative shrink-0 cursor-pointer mt-0.5">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex justify-end gap-3">
        <Btn
          variant="secondary"
          onClick={() =>
            setFormData({
              name: profile.name,
              email: profile.email,
              college: profile.college,
              department: profile.department,
              gradYear: profile.gradYear,
              cgpa: profile.cgpa,
            })
          }
        >
          Cancel
        </Btn>
        <Btn variant="gradient" size="lg" onClick={handleSave} className="min-w-32 justify-center">
          {saved ? (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Saved!
            </motion.span>
          ) : (
            "Save Changes"
          )}
        </Btn>
      </div>
    </div>
  );
};
