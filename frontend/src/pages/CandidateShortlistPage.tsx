import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import Table from "../components/ui/Table";
import type { TableColumn } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import CandidateFitModal from "../components/modals/CandidateFitModal";
import type { Candidate } from "../types";
import { getCandidateBreakdown, API_BASE } from "../api/benchApi";
import DotsIcon from "../assets/IG_Whte.jpg";
import IgBackground from "../assets/image.png";
import { API_BASE } from "../api/benchApi";

type ShortlistLocationState = {
  requirementId: string;
  requirement: {
    requirement_id: string;
    client_name: string;
    role_title: string;
    required_skills: string[];
    minimum_experience: number;
    mandatory_certifications: string[];
    availability_date: string | null;
    requirement_summary: string;
  };
  matches: any[];
  count: number;
  requirementStatus: string;
  submittedAt: string;
};

const CandidateShortlistPage: React.FC = () => {
  const { requirementId: paramId } = useParams<{ requirementId: string }>();
  const location = useLocation();
  const state = location.state as ShortlistLocationState | undefined;

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const [fitOpen, setFitOpen] = useState(false);

  // Backend data state
  const [requirement, setRequirement] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectLoading, setSelectLoading] = useState(false);

  // Use param ID or state ID
  const finalRequirementId = paramId || state?.requirementId;

  // Fetch data when requirement ID is available and no state
  useEffect(() => {
    if (!finalRequirementId) return;

    // If we have state from form submission, use it directly
    if (state?.requirement && state?.matches) {
      setRequirement({
        id: state.requirement.requirement_id,
        clientName: state.requirement.client_name,
        roleTitle: state.requirement.role_title,
        requiredSkills: state.requirement.required_skills || [],
        minimumExperience: state.requirement.minimum_experience || 0,
        mandatoryCertifications: (
          state.requirement.mandatory_certifications || []
        ).join(", "),
        availabilityDate: state.requirement.availability_date,
        summary: state.requirement.requirement_summary || "",
      });

      const mapped = state.matches.map((m: any, index: number) => {
        const breakdown = m.breakdown || {};

        let strengthsArray: string[] = [];
        if (typeof m.strengths === "string" && m.strengths) {
          strengthsArray = m.strengths.split(",").map((s: string) => s.trim());
        } else if (Array.isArray(m.strengths)) {
          strengthsArray = m.strengths;
        }

        let gapsArray: string[] = [];
        if (typeof m.gaps === "string" && m.gaps) {
          gapsArray = m.gaps.split(",").map((g: string) => g.trim());
        } else if (Array.isArray(m.gaps)) {
          gapsArray = m.gaps;
        }

        // Extract certifications from breakdown.certification_details
        const certifications = breakdown.certification_details?.required?.map(
          (c: any) => c.certificate_name
        ) ?? [];

        return {
          id: m.employee_id ?? `c-${index}`,
          shortlistItemId: m.shortlist_item_id,
          rank: m.rank ?? index + 1,
          name: m.name ?? `Candidate ${index + 1}`,
          email: m.email ?? "",
          role: m.role ?? "",
          overallFitScore: m.overall_fit_score ?? 0,
          skillMatchScore:
            m.skill_match_score ?? breakdown.skills_match ?? breakdown.skill_match_score ?? 0,
          benchStatus:
            m.bench_status === "Bench" ||
            m.bench_status === "Partial" ||
            m.bench_status === "Not Bench"
              ? m.bench_status
              : "Bench",
          reasonForRanking:
            m.llm_summary ??
            m.reason_for_ranking ??
            "No AI rationale available.",
          strengths: strengthsArray,
          gaps: gapsArray,
          experienceSummary:
            m.experience_summary ??
            `${m.experience_alignment?.candidate_years ?? 0}+ years of experience in the field.`,
          certifications: certifications,
          skill_match_details: m.skill_match_details || [],
          relevant_projects: m.relevant_projects || [],
          // Store breakdown scores
          skills_match: breakdown.skills_match ?? 0,
          experience_match: breakdown.experience_match ?? 0,
          availability_match: breakdown.availability_match ?? 95,
          certifications_match: breakdown.certifications_match ?? 0,
          certification_details: breakdown.certification_details,
          experience_alignment: m.experience_alignment,
          selected: m.selected === 1 || m.selected === true,
        };
      });
      setCandidates(mapped);
      return;
    }

    // Fetch from backend if no state (dashboard navigation)
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch requirement details
        const reqRes = await fetch(
          `${API_BASE}/requirements/${finalRequirementId}`,
        );
        if (!reqRes.ok) throw new Error("Failed to fetch requirement");
        const reqJson = await reqRes.json();

        const reqData = reqJson.data;
        setRequirement({
          id: reqData.requirement_id,
          clientName: reqData.client_name,
          roleTitle: reqData.role_title,
          requiredSkills: reqData.required_skills || [],
          minimumExperience: reqData.minimum_experience || 0,
          mandatoryCertifications: (
            reqData.mandatory_certifications || []
          ).join(", "),
          availabilityDate: reqData.availability_date,
          summary: reqData.requirement_summary || "",
        });

        // Fetch shortlist candidates
        const shortlistRes = await fetch(
          `${API_BASE}/shortlist/${finalRequirementId}`,
        );
        if (!shortlistRes.ok) throw new Error("Failed to fetch shortlist");
        const shortlistJson = await shortlistRes.json();

        const mapped = (shortlistJson.data.candidates || []).map(
          (m: any, index: number) => {
            const breakdown = m.breakdown || {};

            let strengthsArray: string[] = [];
            if (typeof m.strengths === "string" && m.strengths) {
              strengthsArray = m.strengths
                .split(",")
                .map((s: string) => s.trim());
            } else if (Array.isArray(m.strengths)) {
              strengthsArray = m.strengths;
            }

            let gapsArray: string[] = [];
            if (typeof m.gaps === "string" && m.gaps) {
              gapsArray = m.gaps.split(",").map((g: string) => g.trim());
            } else if (Array.isArray(m.gaps)) {
              gapsArray = m.gaps;
            }

            // Extract certifications from breakdown.certification_details
            const certifications = breakdown.certification_details?.required?.map(
              (c: any) => c.certificate_name
            ) ?? [];

            return {
              id: m.employee_id ?? `c-${index}`,
              shortlistItemId: m.shortlist_item_id,
              rank: m.rank ?? index + 1,
              name: m.name ?? `Candidate ${index + 1}`,
              email: m.email ?? "",
              role: m.role ?? "",
              overallFitScore: m.overall_fit_score ?? 0,
              skillMatchScore:
                m.skill_match_score ?? breakdown.skills_match ?? breakdown.skill_match_score ?? 0,
              benchStatus:
                m.bench_status === "Bench" ||
                m.bench_status === "Partial" ||
                m.bench_status === "Not Bench"
                  ? m.bench_status
                  : "Bench",
              reasonForRanking:
                m.llm_summary ??
                m.reason_for_ranking ??
                "No AI rationale available.",
              strengths: strengthsArray,
              gaps: gapsArray,
              experienceSummary:
                m.experience_summary ??
                `${m.experience_years ?? 0}+ years of experience in the field.`,
              certifications: certifications,
              skill_match_details: m.skill_match_details || [],
              relevant_projects: m.relevant_projects || [],
              // Store breakdown scores
              skills_match: breakdown.skills_match ?? 0,
              experience_match: breakdown.experience_match ?? 0,
              availability_match: breakdown.availability_match ?? 95,
              certifications_match: breakdown.certifications_match ?? 0,
              certification_details: breakdown.certification_details,
              experience_alignment: m.experience_alignment,
              selected: m.selected === 1 || m.selected === true,
            };
          },
        );
        setCandidates(mapped);
      } catch (error) {
        console.error("Failed to fetch shortlist data:", error);
        alert("Failed to load shortlist data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [finalRequirementId, state]);

  const columns: TableColumn<Candidate>[] = [
    { key: "rank", header: "Rank", align: "center" },
    {
      key: "name",
      header: "Name",
      render: (row) => (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-900">{row.name}</span>
          <span className="text-[11px] text-slate-500">{row.email}</span>
        </div>
        {row.selected && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            ✓ Selected
          </span>
        )}
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
      if (row.selected) {
        return (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-[#00D6F2]">
            Allocated
          </span>
        );
      }
      
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

  const candidatesEvaluated = candidates.length;
  const topFit =
    candidatesEvaluated > 0
      ? Math.max(...candidates.map((c) => c.overallFitScore))
      : 0;
  const medianFit =
    candidatesEvaluated > 0
      ? candidates.map((c) => c.overallFitScore).sort((a, b) => a - b)[
          Math.floor(candidates.length / 2)
        ]
      : 0;

  const toFitData = (c: Candidate): any => {
    // Debug logging
    console.log("toFitData - Input candidate:", {
      id: c.id,
      name: c.name,
      skill_match_details: c.skill_match_details,
      experience_alignment: c.experience_alignment,
      relevant_projects: c.relevant_projects,
    });
    
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      benchStatus: c.benchStatus,
      overallFitScore: c.overallFitScore,
      skillMatchScore: c.skillMatchScore,
      score: {
        overallFit: c.overallFitScore,
        rank: c.rank,
        skillMatch: c.skillMatchScore ?? c.skills_match,
        experience: c.experience_match ?? 80,
        availability: c.availability_match ?? 95,
        certifications: c.certifications_match ?? 80,
      },
      reasonForRanking: c.reasonForRanking,
      strengths: c.strengths,
      gaps: c.gaps,
      skills: (c.skill_match_details || []).map((s: any) => ({
        requiredSkill: s.required_skill,
        candidateSkill: s.candidate_evidence,
        confidence: s.confidence,
      })),
      experience: {
        requiredYears: c.experience_alignment?.required_years ?? requirement?.minimumExperience ?? 0,
        candidateYears: c.experience_alignment?.candidate_years ?? 0,
        projects: (c.relevant_projects || []).map((p: any) => ({
          projectName: p.project_name || "Project",
          role: p.role || "Contributor",
          years: p.duration_years || 0,
          description: p.experience_summary || p.description || "",
        })),
      },
      certifications: [
        ...(c.certification_details?.required?.map((cert: any) => ({
          name: cert.certificate_name,
          required: true,
          held: cert.status === "✓ Met",
        })) ?? []),
        ...(c.certification_details?.additional?.map((cert: any) => ({
          name: cert.certificate_name,
          required: false,
          held: cert.status === "Held",
        })) ?? []),
      ],
      availability: {
        benchStatus: c.benchStatus,
        sinceDate: "2025-11-28",
      },
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center animate-slide-in">
        <div className="text-center">
          {/* Animated Loader Container */}
          <div className="flex justify-center mb-6">
            <div className="circle-loader">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>

          {/* Text Content */}
          <div className="mb-1 text-sm font-semibold text-[color:var(--ig-blue)]">
            Loading shortlist...
          </div>
          <p className="text-xs text-slate-500">Fetching candidates data</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!requirement || !candidates.length) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-sm font-semibold text-slate-700">
            No shortlist data found
          </div>
          <p className="text-xs text-[#00D6F2]">
            Requirement ID: {finalRequirementId || "Not provided"}
          </p>
        </div>
      </div>
    );
  }

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
            <div className="rounded-full bg-[#00D6F2]/15 px-3 py-1 text-[11px] font-medium text-[#00D6F2]">
              ID: {requirement.id}
            </div>
          </div>
        </div>
        <div className="grid gap-4 px-4 py-3 text-xs md:grid-cols-[2fr,1fr] md:px-6">
          <div className="space-y-2">
            <p className="text-slate-100/90">{requirement.summary}</p>
            <div className="flex flex-wrap gap-1">
              {requirement.requiredSkills.map((skill: string) => (
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
          <p className="text-lg font-semibold text-[#00283c]">
            {candidatesEvaluated}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500">
            Top fit score
          </p>
          <p className="text-lg font-semibold text-[#00D6F2]">
            {topFit}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500">
            Median fit score
          </p>
          <p className="text-lg font-semibold text-[#FFD700]">{medianFit}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500">
            Time to shortlist
          </p>
          <p className="text-lg font-semibold text-[#DB005A]">~ 3 sec</p>
        </div>
      </section>

      {/* Candidates table */}
      <section 
  className="relative space-y-3 min-h-[600px] md:min-h-[700px]"
>
        <div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <img
      src={DotsIcon}
      alt=""
      className="h-5 w-5 flex-shrink-0 -mt-0.5 md:h-6 md:w-6 lg:h-7 lg:w-7"
    />
    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 leading-tight">
      Candidate Shortlist
    </h2>
  </div>
  <p className="text-xs text-slate-500">
    Click a row to view detailed AI rationale.
  </p>
</div>


        <Table
          columns={columns}
          data={candidates}
          onRowClick={async (row) => {            console.log("Selected candidate data:", row);            setSelectedCandidate(row);
            setFitOpen(true);
          }}
        />
      </section>

      {/* Candidate detail modal */}
      <CandidateFitModal
        open={fitOpen}
        onClose={() => {
          setFitOpen(false);
        }}
        onSelect={async () => {
          if (!selectedCandidate?.shortlistItemId) {
            console.warn("No shortlistItemId on candidate");
            return;
          }
          setSelectLoading(true);
          try {
            const res = await fetch(
              `${API_BASE}/candidate/${selectedCandidate.shortlistItemId}/select`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hired_by: "evergreen-ui" }),
              },
            );
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.detail || "Failed to select candidate");
            }
            const json = await res.json();
            console.log(" Candidate selected:", json);
              setCandidates((prev) =>
      prev.map((c) =>
        c.id === selectedCandidate.id ? { ...c, selected: true } : c
      )
    );
            setFitOpen(false);
          } catch (e: any) {
            console.error("Select candidate failed:", e);
            alert(e.message || "Failed to select candidate");
          }
          finally {
    setSelectLoading(false);
  }
        }}
        candidate={selectedCandidate ? toFitData(selectedCandidate) : null}
        loading={selectLoading}
        isAlreadySelected={!!selectedCandidate?.selected}
      />
    </div>
  );
};

export default CandidateShortlistPage;
