import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { ArrowLeft } from "lucide-react";
import DotLogo from "../../assets/IG_Primary_FullColor-Navy_Digital.png";

const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === "/";

  const showBackButton = !isDashboard;

  const pageTitle =
    location.pathname === "/"
      ? "BenchMatch AI"
      : location.pathname === "/requirements/new"
      ? "Submit New Project Requirement"
      : location.pathname.startsWith("/shortlist")
      ? "Candidate Shortlist"
      : "Bench Overview";

  return (
   <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">

  {/* LEFT SECTION */}
  <div className="flex items-center gap-4">
    
    {showBackButton && (
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
    )}

    <div className="flex items-center gap-3">
      <img
        src={DotLogo}
        alt="BenchMatch AI"
        className="h-12 w-auto"
      />

      <div>
        <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
            {pageTitle}
          </h1>
          <p className="text-xs text-slate-500 md:text-sm">
            InsightGlobal Consulting AI-Driven Bench Matching
          </p>
      </div>
    </div>
  </div>

  {/* RIGHT SECTION */}
  <div className="flex items-center gap-6">

    {isDashboard && (
      <Link to="/requirements/new">
        <Button variant="primary">New Requirement</Button>
      </Link>
    )}
  </div>
</header>
  );
};

export default TopBar;
