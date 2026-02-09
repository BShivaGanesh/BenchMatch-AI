import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { ArrowLeft } from "lucide-react";

const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === "/";

  const showBackButton = !isDashboard;

  const pageTitle =
    location.pathname === "/"
      ? "Bench Overview"
      : location.pathname === "/requirements/new"
      ? "Submit New Project Requirement"
      : location.pathname.startsWith("/shortlist")
      ? "Candidate Shortlist"
      : "Bench Overview";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[color:var(--ig-blue)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        <div>
          <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
            {pageTitle}
          </h1>
          <p className="text-xs text-slate-500 md:text-sm">
            InsightGlobal Evergreen AI-Driven Bench Matching
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
