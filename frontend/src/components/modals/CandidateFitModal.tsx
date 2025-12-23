import React, { useState } from "react";
import Button from "../ui/Button";

type BenchStatus = "Bench" | "Partial" | "Not Bench";

interface ScoreBreakdown {
  overallFit: number;
  rank: number;
  skillMatch: number;
  experience: number;
  availability: number;
  certifications: number;
}

interface SkillMatchRow {
  requiredSkill: string;
  candidateSkill: string;
  confidence: number; // 0-100
}

interface ExperienceItem {
  projectName: string;
  role: string;
  years: number;
  description: string;
}

interface ExperienceSummary {
  requiredYears: number;
  candidateYears: number;
  projects: ExperienceItem[];
}

interface CertificationRow {
  name: string;
  required: boolean;
  held: boolean;
}

interface AvailabilityInfo {
  benchStatus: BenchStatus;
  sinceDate: string;
}

interface CandidateFitData {
  id: string;
  name: string;
  email: string;
  role: string;
  score: ScoreBreakdown;
  reasonForRanking: string;
  strengths: string[];
  gaps: string[];
  skills: SkillMatchRow[];
  experience: ExperienceSummary;
  certifications: CertificationRow[];
  availability: AvailabilityInfo;
}

interface CandidateFitModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: () => void;
  candidate?: CandidateFitData;
}

// Mock data for a high-fit candidate
const mockCandidate: CandidateFitData = {
  id: "c1",
  name: "Ravi",
  email: "ravi@insightglobal.com",
  role: "Senior Full Stack Engineer",
  score: {
    overallFit: 85,
    rank: 1,
    skillMatch: 92,
    experience: 82,
    availability: 70,
    certifications: 88,
  },
  reasonForRanking:
    "Strong alignment with required tech stack (React, Node.js, AWS), proven experience on large-scale retail loyalty platforms, and current availability on bench.",
  strengths: [
    "Deep React + Node.js expertise with TypeScript",
    "Led cross-functional squads on cloud-native migrations",
    "Hands-on experience with event-driven architectures and messaging",
  ],
  gaps: [
    "Limited direct Salesforce experience (requires ramp-up)",
    "Availability constrained to 32 hours/week for first 2 weeks",
  ],
  skills: [
    {
      requiredSkill: "React + TypeScript",
      candidateSkill: "React + TypeScript (5+ years)",
      confidence: 96,
    },
    {
      requiredSkill: "Node.js APIs",
      candidateSkill: "Node.js, Express, REST & GraphQL",
      confidence: 94,
    },
    {
      requiredSkill: "AWS (serverless preferred)",
      candidateSkill: "AWS Lambda, API Gateway, DynamoDB",
      confidence: 88,
    },
    {
      requiredSkill: "PostgreSQL / relational DB",
      candidateSkill: "PostgreSQL, Sequelize, data modeling",
      confidence: 86,
    },
    {
      requiredSkill: "Retail / Loyalty domain",
      candidateSkill: "Two major retail loyalty platform rebuilds",
      confidence: 82,
    },
  ],
  experience: {
    requiredYears: 5,
    candidateYears: 9,
    projects: [
      {
        projectName: "Global Retail Loyalty 2.0",
        role: "Tech Lead · Full Stack",
        years: 3,
        description:
          "Led redesign of loyalty platform for 20M+ customers, React micro frontends, Node.js services on AWS.",
      },
      {
        projectName: "Omni-Channel Customer Hub",
        role: "Senior Engineer",
        years: 2,
        description:
          "Built unified customer profile and real-time engagement APIs for mobile and web.",
      },
      {
        projectName: "E‑Commerce Checkout Modernization",
        role: "Full Stack Engineer",
        years: 2,
        description:
          "Improved performance and reliability of checkout flows, integrating payments and promotions.",
      },
    ],
  },
  certifications: [
    { name: "AWS Solutions Architect Associate", required: true, held: true },
    { name: "Azure DP-203", required: true, held: false },
    { name: "Scrum Master (PSM I)", required: false, held: true },
    { name: "React Professional Certification", required: false, held: false },
  ],
  availability: {
    benchStatus: "Bench",
    sinceDate: "2025-11-28",
  },
};

const CandidateFitModal: React.FC<CandidateFitModalProps> = ({
  open,
  onClose,
  onSelect,
  candidate = mockCandidate,
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "skills" | "certs">(
    "summary"
  );

  if (!open) return null;

  const { score } = candidate;

  const benchBadgeClasses =
    candidate.availability.benchStatus === "Bench"
      ? "bg-[color:var(--evergreen-green)]/15 text-[color:var(--evergreen-green)]"
      : candidate.availability.benchStatus === "Partial"
      ? "bg-[color:var(--highlight-yellow)]/15 text-[color:var(--highlight-yellow)]"
      : "bg-slate-100 text-slate-600";

  const benchLabel =
    candidate.availability.benchStatus === "Bench"
      ? "Immediately available"
      : candidate.availability.benchStatus === "Partial"
      ? "Partially allocated"
      : "Not currently on bench";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-2 py-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between bg-[color:var(--ig-blue)] px-4 py-3 text-slate-50 md:px-6">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold md:text-base">
              Candidate Detailed Fit Report for {candidate.name}
            </h2>
            <p className="text-[11px] text-slate-300">
              {candidate.role} · {candidate.email}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-900/40 px-3 py-2">
              <div className="flex flex-col text-right">
                <span className="text-[11px] text-slate-200">
                  Overall Fit Score
                </span>
                <span className="text-2xl font-bold text-white">
                  {score.overallFit}%
                </span>
              </div>
              <div className="h-10 w-px bg-slate-600/70" />
              <div className="flex flex-col text-right">
                <span className="text-[11px] text-slate-200">Rank</span>
                <span className="text-lg font-semibold text-[color:var(--light-watermark)]">
                  #{score.rank}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              className="hidden md:inline-flex"
              onClick={onSelect}
            >
              Select Candidate
            </Button>

            <button
              onClick={onClose}
              className="rounded-md bg-slate-900/40 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-slate-900/70"
            >
              Close
            </button>
          </div>
        </header>

        {/* Body with tabs */}
        <div className="flex flex-1 flex-col min-h-0">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 md:px-6 flex-shrink-0">
            <div className="flex gap-3 text-xs md:text-sm">
              <button
                onClick={() => setActiveTab("summary")}
                className={`rounded-full px-3 py-1 font-medium ${
                  activeTab === "summary"
                    ? "bg-[color:var(--ig-blue)] text-white"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Score & Breakdown
              </button>
              <button
                onClick={() => setActiveTab("skills")}
                className={`rounded-full px-3 py-1 font-medium ${
                  activeTab === "skills"
                    ? "bg-[color:var(--ig-blue)] text-white"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Skills & Experience
              </button>
              <button
                onClick={() => setActiveTab("certs")}
                className={`rounded-full px-3 py-1 font-medium ${
                  activeTab === "certs"
                    ? "bg-[color:var(--ig-blue)] text-white"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Certifications & Availability
              </button>
            </div>

            <Button
              variant="primary"
              className="md:hidden"
              onClick={onSelect}
            >
              Select
            </Button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 md:px-6 md:py-5">
            {activeTab === "summary" && (
              <SummaryTab candidate={candidate} />
            )}
            {activeTab === "skills" && (
              <SkillsTab candidate={candidate} />
            )}
            {activeTab === "certs" && (
              <CertsTab
                candidate={candidate}
                benchBadgeClasses={benchBadgeClasses}
                benchLabel={benchLabel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface TabProps {
  candidate: CandidateFitData;
}

const SummaryTab: React.FC<TabProps> = ({ candidate }) => {
  const { score } = candidate;

  const weightedTiles = [
    {
      label: "Skill Match",
      weight: "60% weight",
      value: score.skillMatch,
      color: "bg-[color:var(--evergreen-green)]/15 text-[color:var(--evergreen-green)]",
      bar: "bg-[color:var(--evergreen-green)]",
    },
    {
      label: "Experience Relevance",
      weight: "20% weight",
      value: score.experience,
      color: "bg-[color:var(--light-watermark)]/20 text-[color:var(--ig-blue)]",
      bar: "bg-[color:var(--light-watermark)]",
    },
    {
      label: "Availability",
      weight: "10% weight",
      value: score.availability,
      color: "bg-[color:var(--highlight-yellow)]/20 text-[color:var(--highlight-yellow)]",
      bar: "bg-[color:var(--highlight-yellow)]",
    },
    {
      label: "Certifications & Special Skills",
      weight: "10% weight",
      value: score.certifications,
      color: "bg-[color:var(--alert-red)]/10 text-[color:var(--alert-red)]",
      bar: "bg-[color:var(--alert-red)]",
    },
  ];

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Weighted tiles */}
      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          Weighted Score Breakdown
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {weightedTiles.map((tile) => (
            <div
              key={tile.label}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-600">
                  {tile.label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tile.color}`}
                >
                  {tile.weight}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-[color:var(--ig-blue)]">
                  {tile.value}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                <div
                  className={`h-1.5 rounded-full ${tile.bar}`}
                  style={{ width: `${tile.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reason + strengths/gaps split */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
            AI Insight · Reason for Ranking
          </h3>
          <p className="text-xs leading-relaxed text-slate-800">
            {candidate.reasonForRanking}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 shadow-sm">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Key Strengths
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-emerald-900">
              {candidate.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[color:var(--alert-red)]/30 bg-[color:var(--alert-red)]/5 p-3 shadow-sm">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--alert-red)]">
              Missing Skills & Risks
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-800">
              {candidate.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

const SkillsTab: React.FC<TabProps> = ({ candidate }) => {
  const { experience, skills } = candidate;

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Skill comparison table */}
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          Skill Match Detail
        </h3>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Required Skill
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Candidate Evidence
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Relevance / Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {skills.map((row) => {
                const strong = row.confidence >= 85;
                const moderate = row.confidence >= 60 && row.confidence < 85;
                const badgeColor = strong
                  ? "bg-[color:var(--evergreen-green)]/15 text-[color:var(--evergreen-green)]"
                  : moderate
                  ? "bg-[color:var(--highlight-yellow)]/20 text-[color:var(--highlight-yellow)]"
                  : "bg-[color:var(--alert-red)]/15 text-[color:var(--alert-red)]";

                return (
                  <tr key={row.requiredSkill} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 align-top font-medium text-slate-800">
                      {row.requiredSkill}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      {row.candidateSkill}
                    </td>
                    <td className="px-3 py-2 text-right align-top">
                      <span
                        className={`inline-flex items-center justify-end rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeColor}`}
                      >
                        {row.confidence}% match
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500">
          Confidence is derived from vector similarity between requirement
          embeddings and candidate profiles.
        </p>
      </section>

      {/* Experience comparison */}
      <section className="grid gap-4 md:grid-cols-[1.1fr,2fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
            Experience Alignment
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">
                Required years
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {experience.requiredYears}+ yrs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">
                Candidate years
              </span>
              <span className="text-sm font-semibold text-[color:var(--evergreen-green)]">
                {experience.candidateYears} yrs
              </span>
            </div>
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-slate-200">
                <div
                  className="h-1.5 rounded-full bg-[color:var(--evergreen-green)]"
                  style={{
                    width: `${Math.min(
                      100,
                      (experience.candidateYears / experience.requiredYears) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Candidate exceeds minimum experience requirement.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
            Relevant Project History
          </h3>
          <div className="space-y-2">
            {experience.projects.map((p) => (
              <div
                key={p.projectName}
                className="rounded-lg border border-slate-100 bg-slate-50/60 p-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    {p.projectName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {p.years} yrs
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{p.role}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

interface CertsTabProps {
  candidate: CandidateFitData;
  benchBadgeClasses: string;
  benchLabel: string;
}

const CertsTab: React.FC<CertsTabProps> = ({
  candidate,
  benchBadgeClasses,
  benchLabel,
}) => {
  const required = candidate.certifications.filter((c) => c.required);
  const optional = candidate.certifications.filter((c) => !c.required);

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Required vs held certs */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
            Required Certifications
          </h3>
          <ul className="space-y-1.5">
            {required.map((c) => (
              <li
                key={c.name}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1"
              >
                <span className="text-[11px] text-slate-800">{c.name}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    c.held
                      ? "bg-[color:var(--evergreen-green)]/15 text-[color:var(--evergreen-green)]"
                      : "bg-[color:var(--alert-red)]/10 text-[color:var(--alert-red)]"
                  }`}
                >
                  {c.held ? "Met" : "Missing"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
            Additional Certifications / Badges
          </h3>
          <ul className="space-y-1.5">
            {optional.map((c) => (
              <li
                key={c.name}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1"
              >
                <span className="text-[11px] text-slate-800">{c.name}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    c.held
                      ? "bg-[color:var(--light-watermark)]/20 text-[color:var(--ig-blue)]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {c.held ? "Held" : "Not held"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Availability / bench status */}
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          Availability & Bench Status
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${benchBadgeClasses}`}
            >
              {candidate.availability.benchStatus}
            </span>
            <span className="text-[11px] text-slate-600">{benchLabel}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            On bench since{" "}
            <span className="font-medium">
              {candidate.availability.sinceDate}
            </span>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Use this information to coordinate start dates, overlap with existing
          allocations, and potential backfill needs.
        </p>
      </section>
    </div>
  );
};

export default CandidateFitModal;
