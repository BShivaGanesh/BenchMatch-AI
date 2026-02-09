export interface RequirementFormValues {
  clientName: string;
  roleTitle: string;
  requiredSkills: string[];
  minimumExperience: number | ""; // already like this
  mandatoryCertifications: string; // comma-separated
  availabilityDate: string;
  summary: string;
}

export interface RequirementApiResponse {
  status: string;
  requirement_id: string;
  data: {
    requirement_id: string;
    client_name: string;
    role_title: string;
    status: string;
    required_skills: string[];
    minimum_experience: number;
    mandatory_certifications: string[];
    availability_date: string | null;
    requirement_summary: string;
  };
}
