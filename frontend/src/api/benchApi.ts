export const API_BASE = "http://localhost:8001";

import type { RequirementFormValues } from "../types";

export async function createRequirement(form: RequirementFormValues) {
  const payload = {
    client_name: form.clientName,
    role_title: form.roleTitle,
    required_skills: form.requiredSkills,
    minimum_experience:
      form.minimumExperience === "" ? 0 : Number(form.minimumExperience),
    mandatory_certifications: form.mandatoryCertifications
      ? form.mandatoryCertifications.split(",").map((c) => c.trim())
      : [],
    availability_date: form.availabilityDate || null,
    requirement_summary: form.summary,
  };

  const res = await fetch(`${API_BASE}/requirements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create requirement");
  }

  return res.json();
}

export async function runSearch(requirementId: string, form: RequirementFormValues) {
  const payload = {
    requirement_id: requirementId,
    client_name: form.clientName,
    role_title: form.roleTitle,
    required_skills: form.requiredSkills,
    min_experience:
      form.minimumExperience === "" ? 0 : Number(form.minimumExperience),
    required_certs: form.mandatoryCertifications
      ? form.mandatoryCertifications.split(",").map((c) => c.trim())
      : [],
    availability_date: form.availabilityDate || null,
    requirement_summary: form.summary,
    top_n: 10,
    allow_partial: true,
  };

  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Search failed");
  }

  return res.json();
}

export async function getCandidateBreakdown(
  requirementId: string,
  employeeId: string
) {
  const res = await fetch(
    `http://localhost:8001/breakdown/${requirementId}/${employeeId}`
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load candidate breakdown");
  }

  return res.json();
}

