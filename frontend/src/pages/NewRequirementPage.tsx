import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import TagInput from "../components/ui/TagInput";
import type { RequirementFormValues } from "../types";
import { createRequirement, runSearch, API_BASE } from "../api/benchApi";
import BenchLogo from "../assets/image.png";
import IgDots from "../assets/IG_Whte.jpg";

type RequirementErrors = {
  clientName?: string;
  roleTitle?: string;
  requiredSkills?: string;
  minimumExperience?: string;
  mandatoryCertifications?: string;
  availabilityDate?: string;
  summary?: string;
};

export const NewRequirementPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RequirementErrors>({});

  const [form, setForm] = useState<RequirementFormValues>({
    clientName: "",
    roleTitle: "",
    requiredSkills: ["React", "Node.js"],
    minimumExperience: "",
    mandatoryCertifications: "",
    availabilityDate: "",
    summary: "",
  });

  const handleChange =
    (field: keyof RequirementFormValues) =>
    (value: RequirementFormValues[keyof RequirementFormValues]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleInputChange =
    (field: keyof RequirementFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "minimumExperience"
          ? e.target.value === ""
            ? ""
            : Number(e.target.value)
          : e.target.value;
      handleChange(field)(value as any);
    };

  const validateForm = (): boolean => {
    const newErrors: RequirementErrors = {};

    if (!form.clientName.trim()) {
      newErrors.clientName = "Client Name is required";
    }
    if (!form.roleTitle.trim()) {
      newErrors.roleTitle = "Role Title is required";
    }
    if (!form.requiredSkills || form.requiredSkills.length === 0) {
      newErrors.requiredSkills = "At least one skill is required";
    }
    if (form.minimumExperience === "" || Number(form.minimumExperience) < 0) {
      newErrors.minimumExperience = "Minimum experience is required";
    }
    if (!form.mandatoryCertifications.trim()) {
      newErrors.mandatoryCertifications =
        "Mandatory certifications are required";
    }
    if (!form.availabilityDate) {
      newErrors.availabilityDate = "Availability / Start Date is required";
    }
    if (!form.summary.trim()) {
      newErrors.summary = "Requirement Summary is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return; // do not submit if errors
    }

    setIsSubmitting(true);

    try {
      // 1. Create requirement
      const created = await createRequirement(form);
      const requirementId = created.requirement_id;

      // 2. Run search for this requirement
      const searchResult = await runSearch(requirementId, form);

      // 3. Navigate to shortlist with real data
      // 3. Fetch the persisted shortlist (has shortlist_item_id)
      const shortlistRes = await fetch(
        `${API_BASE}/shortlist/${requirementId}`,
      );
      const shortlistJson = await shortlistRes.json();
      const persistedCandidates = shortlistJson.data.candidates;

      navigate("/shortlist", {
        state: {
          requirementId,
          requirement: created.data,
          matches: persistedCandidates,
          count: persistedCandidates.length,
          requirementStatus: "In Progress",
          submittedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong while submitting.");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    setForm({
      clientName: "",
      roleTitle: "",
      requiredSkills: [],
      minimumExperience: "",
      mandatoryCertifications: "",
      availabilityDate: "",
      summary: "",
    });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-white p-8 md:p-12">
      {/* Logo background: top-left, subtle */}
      <div
        className="absolute inset-0 bg-no-repeat bg-[length:300px_auto] bg-[position:top_20px_left_20px] bg-opacity-8 pointer-events-none z-0"
        style={{ backgroundImage: `url(${BenchLogo})` }}
      />
      {isSubmitting && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--ig-blue)]">
              InsightGlobal Consulting AI Matching
            </div>

            <p className="text-sm font-medium text-slate-900">
              Analysing requirement and ranking bench candidates…
            </p>
            <p className="mt-1 text-xs text-slate-500">
              This may take a few seconds as AI scans skills, experience, and
              certifications.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="circle-loader">
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
              </div>
              <span className="text-xs text-slate-600">
                Preparing shortlist view…
              </span>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6"
      >
        {/* Header */}
        <header className="space-y-1 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-1.5">
            <img
              src={IgDots}
              alt=""
              className="h-5 w-6 flex-shrink-0 -mt-0.5 md:h-6 md:w-7 lg:h-7 lg:w-8"
            />
            <h2 className="text-base font-semibold text-slate-900 leading-tight">
              New Project Requirement
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Capture the client context so BenchMatch AI can generate the best bench
            matches.
          </p>
        </header>

        {/* Top row: client & role */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="clientName"
              className="text-xs font-medium text-slate-700"
            >
              Client Name
            </label>
            <input
              id="clientName"
              type="text"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder-slate-400 focus:border-[color:var(--light-watermark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--light-watermark)]"
              placeholder="e.g. Global Retail Corp"
              value={form.clientName}
              onChange={(e) => {
                handleInputChange("clientName")(e);
                if (errors.clientName) {
                  setErrors((prev) => ({ ...prev, clientName: undefined }));
                }
              }}
            />
            {errors.clientName && (
              <p className="text-[11px] text-red-500 mt-0.5">
                {errors.clientName}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="roleTitle"
              className="text-xs font-medium text-slate-700"
            >
              Role Title
            </label>
            <input
              id="roleTitle"
              type="text"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder-slate-400 focus:border-[color:var(--light-watermark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--light-watermark)]"
              placeholder="e.g. Senior Full Stack Engineer"
              value={form.roleTitle}
              onChange={handleInputChange("roleTitle")}
            />
            {errors.roleTitle && (
              <p className="text-[11px] text-red-500 mt-0.5">
                {errors.roleTitle}
              </p>
            )}
          </div>
        </section>

        {/* Required skills & experience */}
        <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <TagInput
            label="Required Skills"
            placeholder="Add skills (Enter or , to confirm)"
            value={form.requiredSkills}
            onChange={(tags) => handleChange("requiredSkills")(tags)}
          />
          {errors.requiredSkills && (
            <p className="text-[11px] text-red-500 mt-0.5">
              {errors.requiredSkills}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="minimumExperience"
              className="text-xs font-medium text-slate-700"
            >
              Minimum Experience (Years)
            </label>
            <input
              id="minimumExperience"
              type="number"
              min={0}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder-slate-400 focus:border-[color:var(--light-watermark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--light-watermark)]"
              placeholder="e.g. 5"
              value={form.minimumExperience}
              onChange={handleInputChange("minimumExperience")}
            />
            {errors.minimumExperience && (
              <p className="text-[11px] text-red-500 mt-0.5">
                {errors.minimumExperience}
              </p>
            )}
          </div>
        </section>

        {/* Certifications & availability */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="mandatoryCertifications"
              className="text-xs font-medium text-slate-700"
            >
              Mandatory Certifications
            </label>
            <input
              id="mandatoryCertifications"
              type="text"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder-slate-400 focus:border-[color:var(--light-watermark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--light-watermark)]"
              placeholder="e.g. AWS Solutions Architect, Azure DP-203"
              value={form.mandatoryCertifications}
              onChange={handleInputChange("mandatoryCertifications")}
            />
            {errors.mandatoryCertifications && (
              <p className="text-[11px] text-red-500 mt-0.5">
                {errors.mandatoryCertifications}
              </p>
            )}

            <p className="text-[11px] text-slate-500">
              Comma-separated list. Used as hard filters in AI matching.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="availabilityDate"
              className="text-xs font-medium text-slate-700"
            >
              Availability / Start Date
            </label>
            <input
              id="availabilityDate"
              type="date"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[color:var(--light-watermark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--light-watermark)]"
              value={form.availabilityDate}
              onChange={handleInputChange("availabilityDate")}
            />
            {errors.availabilityDate && (
              <p className="text-[11px] text-red-500 mt-0.5">
                {errors.availabilityDate}
              </p>
            )}
          </div>
        </section>

        {/* Requirement summary */}
        <section>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="summary"
              className="text-xs font-medium text-slate-700"
            >
              Requirement Summary
            </label>
            <textarea
              id="summary"
              rows={6}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder-slate-400 focus:border-[color:var(--light-watermark)] focus:outline-none focus:ring-2 focus:ring-[color:var(--light-watermark)]"
              placeholder="Describe the project, key responsibilities, tech stack, team context, and any constraints. This text will be embedded for AI matching."
              value={form.summary}
              onChange={(e) => {
                handleInputChange("summary")(e);
                if (errors.summary) {
                  setErrors((prev) => ({ ...prev, summary: undefined }));
                }
              }}
            />
            {errors.summary && (
              <p className="text-[11px] text-red-500 mt-0.5">
                {errors.summary}
              </p>
            )}
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            BenchMatch AI will embed this requirement and rank all eligible bench
            candidates in real time.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit for Matching"}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default NewRequirementPage;
