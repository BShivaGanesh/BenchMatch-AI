import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import TagInput from "../components/ui/TagInput";
import type { RequirementFormValues } from "../types";

const NewRequirementPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Simulate AI processing delay, then navigate with state
    setTimeout(() => {
      navigate("/shortlist", {
        state: {
          requirement: form,
          submittedAt: new Date().toISOString(),
        },
      });
    }, 1800);
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
    <div className="relative">
      {/* Full-page loading overlay while AI processes */}
      {isSubmitting && (
  <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40">
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--ig-blue)]">
        Evergreen AI Matching
      </div>

      <p className="text-sm font-medium text-slate-900">
        Analysing requirement and ranking bench candidates…
      </p>
      <p className="mt-1 text-xs text-slate-500">
        This may take a few seconds as AI scans skills, experience, and certifications.
      </p>

      {/* Custom circle loader */}
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
          <h2 className="text-base font-semibold text-slate-900">
            New Project Requirement
          </h2>
          <p className="text-xs text-slate-500">
            Capture the client context so Evergreen can generate the best bench matches.
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
              onChange={handleInputChange("clientName")}
            />
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
              onChange={handleInputChange("summary")}
            />
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            Evergreen will embed this requirement and rank all eligible bench candidates in real time.
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
