import React from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";

const TopBar: React.FC = () => {
  const location = useLocation();

  const pageTitle =
    location.pathname === "/"
      ? "Bench Overview"
      : location.pathname === "/requirements/new"
      ? "Submit New Project Requirement"
      : "Ranked Candidate Shortlist";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
          {pageTitle}
        </h1>
        <p className="text-xs text-slate-500 md:text-sm">
          InsightGlobal Evergreen AI-Driven Bench Matching
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/requirements/new">
          <Button variant="primary">New Requirement</Button>
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
