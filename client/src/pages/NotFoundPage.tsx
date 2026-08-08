import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { GlassCard, Btn } from "../components/common/UIElements";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <GlassCard className="p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-[#111827] mb-2">404 — Page Not Found</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          The page or route you are looking for does not exist or has been moved.
        </p>
        <Btn variant="gradient" size="md" onClick={() => navigate("/dashboard")} className="w-full justify-center">
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Btn>
      </GlassCard>
    </div>
  );
};
