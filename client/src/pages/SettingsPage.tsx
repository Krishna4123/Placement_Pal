import React, { useState } from "react";
import { Check } from "lucide-react";
import { GlassCard, Btn } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";

export const SettingsPage: React.FC = () => {
  const { profile, setProfile } = useSession();

  const [theme, setTheme] = useState<"light" | "dark">("light");
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

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="max-w-3xl mx-auto pb-8 space-y-5">
      {/* Profile Card */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-[#111827] mb-5">Profile Information</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {getInitials(formData.name)}
          </div>
          <div>
            <Btn size="sm" variant="secondary">Change Photo</Btn>
            <p className="text-xs text-[#9CA3AF] mt-1">JPG, PNG up to 2 MB</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">Full Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              type="text"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#374151] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">Email Address</label>
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              type="email"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#374151] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
        </div>
      </GlassCard>

      {/* Academic details */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-[#111827] mb-5">Academic Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">College / University</label>
            <input
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#374151] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">Department / Branch</label>
            <input
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#374151] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">Graduation Year</label>
            <input
              value={formData.gradYear}
              onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#374151] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">CGPA</label>
            <input
              value={formData.cgpa}
              onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#374151] outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
        </div>
      </GlassCard>

      {/* Platforms */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-[#111827] mb-1.5">Preferred Coding Platforms</h3>
        <p className="text-xs text-[#6B7280] mb-4">These platforms will be prioritized in your generated curriculum</p>
        <div className="flex flex-wrap gap-2">
          {["LeetCode", "HackerRank", "Codeforces", "GeeksforGeeks", "InterviewBit", "CodeChef"].map((p) => {
            const isSelected = selectedPlatforms.includes(p);
            return (
              <button
                key={p}
                onClick={() => setSelectedPlatforms((prev) => isSelected ? prev.filter((x) => x !== p) : [...prev, p])}
                className={`px-3.5 py-1.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${isSelected ? "bg-blue-50 border-blue-300 text-[#2563EB]" : "bg-gray-50 border-gray-200 text-[#6B7280] hover:bg-gray-100"}`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {p}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Theme */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-[#111827] mb-4">Appearance</h3>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {[
            { id: "light" as const, label: "Light Mode", icon: "☀️" },
            { id: "dark" as const, label: "Dark Mode", icon: "🌙" },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border transition-all cursor-pointer ${theme === id ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-gray-200 bg-gray-50 text-[#6B7280] hover:bg-gray-100"}`}
            >
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
              {theme === id && <Check className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-[#111827] mb-4">Notifications</h3>
        <div className="space-y-3">
          {[
            { label: "Daily Reminder", desc: "Get reminded to complete your daily tasks" },
            { label: "Deadline Alerts", desc: "Alerts for upcoming company application deadlines" },
            { label: "AI Suggestions", desc: "Weekly AI-generated study suggestions and insights" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-[#374151]">{label}</div>
                <div className="text-xs text-[#9CA3AF] mt-0.5">{desc}</div>
              </div>
              <div className="w-10 h-6 bg-[#2563EB] rounded-full relative shrink-0 cursor-pointer mt-0.5">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex justify-end gap-3">
        <Btn variant="secondary" onClick={() => setFormData({
          name: profile.name,
          email: profile.email,
          college: profile.college,
          department: profile.department,
          gradYear: profile.gradYear,
          cgpa: profile.cgpa,
        })}>Cancel</Btn>
        <Btn variant="gradient" size="lg" onClick={handleSave} className="min-w-32 justify-center">
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
        </Btn>
      </div>
    </div>
  );
};
