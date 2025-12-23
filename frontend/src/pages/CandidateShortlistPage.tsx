import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Table from "../components/ui/Table";
import type { TableColumn } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import CandidateFitModal from "../components/modals/CandidateFitModal";
import type { Candidate, RequirementFormValues } from "../types";

const mockRequirement = {
  id: "REQ-10234",
  clientName: "Global Retail Corp",
  roleTitle: "Senior Full Stack Engineer",
  requiredSkills: ["React", "Node.js", "AWS", "PostgreSQL"],
  minimumExperience: 5,
  mandatoryCertifications: "AWS Solutions Architect, Azure DP-203",
  availabilityDate: "2026-01-10",
  summary:
    "Greenfield loyalty platform rebuild, high-traffic customer engagement system. Cross-functional squad, CI/CD, cloud-native on AWS with strong integration experience.",
};

const mockCandidates: Candidate[] = [
  {
    id: "c1",
    rank: 1,
    name: "Ravi",
    email: "ravi@insightglobal.com",
    role: "Senior Full Stack Engineer",
    overallFitScore: 94,
    skillMatchScore: 92,
    benchStatus: "Bench",
    reasonForRanking:
      "Closest skills and domain alignment with previous large-scale retail platform work.",
    strengths: [
      "Deep React and Node.js experience",
      "Led teams on AWS serverless migrations",
      "Strong experience with event-driven architectures",
    ],
    gaps: ["Limited exposure to Salesforce integrations"],
    experienceSummary:
      "9+ years in full stack engineering with focus on customer-facing web applications, including 3 major retail digital transformation programs.",
    certifications: [
      "AWS Solutions Architect Associate",
      "Scrum Master (PSM I)",
    ],
  },
  {
    id: "c2",
    rank: 2,
    name: "Ram",
    email: "ram@insightglobal.com",
    role: "Senior Software Engineer",
    overallFitScore: 88,
    skillMatchScore: 86,
    benchStatus: "Partial",
    reasonForRanking:
      "Strong engineering background and AWS skills, partial overlap with retail domain.",
    strengths: [
      "Excellent Node.js API design",
      "Experience with high-volume transaction systems",
    ],
    gaps: ["Less React-heavy experience", "Shorter retail-specific exposure"],
    experienceSummary:
      "7+ years building APIs and microservices, including loyalty and payments for fintech and e-commerce.",
    certifications: ["AWS Developer Associate"],
  },
  {
    id: "c3",
    rank: 3,
    name: "Sreekanth",
    email: "sreekanth@insightglobal.com",
    role: "Full Stack Engineer",
    overallFitScore: 76,
    skillMatchScore: 80,
    benchStatus: "Not Bench",
    reasonForRanking:
      "Good skills alignment but currently fully allocated, would require backfill.",
    strengths: [
      "Solid React + TypeScript skills",
      "Experience with PostgreSQL and messaging systems",
    ],
    gaps: ["Limited AWS certifications", "Not currently on bench"],
    experienceSummary:
      "6+ years full stack with focus on customer portals and analytics dashboards.",
    certifications: ["Azure Developer Associate"],
  },
];

const CandidateShortlistPage: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [fitOpen, setFitOpen] = useState(false);

  const location = useLocation();

  const state = location.state as
    | { requirement?: RequirementFormValues; submittedAt?: string }
    | undefined;

  // Merge form requirement (if present) with mock structure
  const requirement = (() => {
    if (!state?.requirement) return mockRequirement;
    const r = state.requirement;
    return {
      id: mockRequirement.id,
      clientName: r.clientName || mockRequirement.clientName,
      roleTitle: r.roleTitle || mockRequirement.roleTitle,
      requiredSkills:
        r.requiredSkills && r.requiredSkills.length > 0
          ? r.requiredSkills
          : mockRequirement.requiredSkills,
      minimumExperience:
        typeof r.minimumExperience === "number"
          ? r.minimumExperience
          : mockRequirement.minimumExperience,
      mandatoryCertifications:
        r.mandatoryCertifications || mockRequirement.mandatoryCertifications,
      availabilityDate: r.availabilityDate || mockRequirement.availabilityDate,
      summary: r.summary || mockRequirement.summary,
    };
  })();

  const columns: TableColumn<Candidate>[] = [
    { key: "rank", header: "Rank", align: "center" },
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-900">{row.name}</span>
          <span className="text-[11px] text-slate-500">{row.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
    },
    {
      key: "overallFitScore",
      header: "Overall Fit",
      render: (row) => <ProgressBar value={row.overallFitScore} />,
    },
    {
      key: "skillMatchScore",
      header: "Skill Match (60%)",
      align: "center",
      render: (row) => (
        <span className="text-xs font-medium text-slate-800">
          {row.skillMatchScore}%
        </span>
      ),
    },
    {
      key: "benchStatus",
      header: "Bench Status",
      align: "center",
      render: (row) => {
        const variant =
          row.benchStatus === "Bench"
            ? "bench"
            : row.benchStatus === "Partial"
            ? "partial"
            : "notBench";
        return <Badge variant={variant}>{row.benchStatus}</Badge>;
      },
    },
  ];

  const candidatesEvaluated = mockCandidates.length;
  const topFit = Math.max(...mockCandidates.map((c) => c.overallFitScore));
  const medianFit = mockCandidates
    .map((c) => c.overallFitScore)
    .sort((a, b) => a - b)[Math.floor(mockCandidates.length / 2)];

  return (
    <div className="space-y-6">
      {/* Requirement summary card */}
      <section className="rounded-xl border border-slate-200 bg-[color:var(--ig-blue)] text-slate-50 shadow-sm">
        <div className="border-b border-slate-700/60 px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                Requirement
              </span>
              <h2 className="text-sm font-semibold md:text-base">
                {requirement.roleTitle} · {requirement.clientName}
              </h2>
            </div>
            <div className="rounded-full bg-[color:var(--evergreen-green)]/15 px-3 py-1 text-[11px] font-medium text-[color:var(--evergreen-green)]">
              ID: {requirement.id}
            </div>
          </div>
        </div>
        <div className="grid gap-4 px-4 py-3 text-xs md:grid-cols-[2fr,1fr] md:px-6">
          <div className="space-y-2">
            <p className="text-slate-100/90">{requirement.summary}</p>
            <div className="flex flex-wrap gap-1">
              {requirement.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[color:var(--light-watermark)]/20 px-2 py-0.5 text-[11px] text-[color:var(--light-watermark)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1 text-slate-100/90">
            <div className="flex justify-between">
              <span className="font-medium">Min Experience:</span>
              <span>{requirement.minimumExperience}+ years</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Start Date:</span>
              <span>{requirement.availabilityDate}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Mandatory Certs:</span>
              <span className="text-[11px]">
                {requirement.mandatoryCertifications}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Shortlist metrics strip */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500">
            Candidates evaluated
          </p>
          <p className="text-lg font-semibold text-[color:var(--ig-blue)]">
            {candidatesEvaluated}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500">
            Top fit score
          </p>
          <p className="text-lg font-semibold text-[color:var(--evergreen-green)]">
            {topFit}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500">
            Median fit score
          </p>
          <p className="text-lg font-semibold text-slate-800">{medianFit}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500">
            Time to shortlist
          </p>
          <p className="text-lg font-semibold text-slate-800">~ 3 sec</p>
        </div>
      </section>

      {/* Candidates table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Ranked Candidate Shortlist
          </h2>
          <p className="text-xs text-slate-500">
            Click a row to view detailed AI rationale.
          </p>
        </div>
        <Table
          columns={columns}
          data={mockCandidates}
          onRowClick={(row) => {
            setSelectedCandidate(row);
            setFitOpen(true);
          }}
        />
      </section>

      {/* Candidate detail modal */}
      <CandidateFitModal
        open={fitOpen}
        onClose={() => setFitOpen(false)}
        onSelect={() => {
          // handle "Select Candidate" action
          setFitOpen(false);
        }}
      />
    </div>
  );
};

export default CandidateShortlistPage;
