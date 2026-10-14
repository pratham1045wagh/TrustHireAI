import { IResumeAnalysis, IPersonalInfo, ISkillsCategory, IEducation, IExperience, IProject, ICertification } from '../types';

/**
 * Normalizes raw or partial resume data into canonical IResumeAnalysis structure
 * Ensures consistent naming across backend and frontend, and provides backward-compatible aliases.
 */
export function normalizeResumeData(data: any): IResumeAnalysis & { workExperience?: IExperience[]; educationHistory?: IEducation[] } {
  if (!data || typeof data !== 'object') {
    return {
      personalInfo: {
        fullName: null,
        email: null,
        phone: null,
        location: null,
        linkedin: null,
        github: null,
        portfolio: null,
      },
      summary: null,
      aiExecutiveSummary: null,
      ai_executive_summary: null,
      skills: {
        programmingLanguages: [],
        frameworks: [],
        libraries: [],
        databases: [],
        tools: [],
        cloud: [],
        other: [],
      },
      education: [],
      experience: [],
      projects: [],
      certifications: [],
    };
  }

  const pInfo = data.personalInfo || data.personal_information || data.contact || {};
  const sk = data.skills || data.technical_skills || data.skills_by_category || {};

  const toStringArray = (val: any): string[] => {
    if (!val) return [];
    let items: string[] = [];
    if (Array.isArray(val)) {
      items = val.map((v) => (typeof v === 'string' ? v.trim() : String(v))).filter(Boolean);
    } else if (typeof val === 'string') {
      items = val.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    }
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of items) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    }
    return unique;
  };

  const personalInfo: IPersonalInfo = {
    fullName: pInfo.fullName || pInfo.full_name || pInfo.name || data.name || null,
    email: pInfo.email || data.email || null,
    phone: pInfo.phone || pInfo.phoneNumber || pInfo.phone_number || data.phone || null,
    location: pInfo.location || pInfo.address || data.location || null,
    linkedin: pInfo.linkedin || pInfo.linkedIn || data.linkedin || null,
    github: pInfo.github || data.github || null,
    portfolio: pInfo.portfolio || pInfo.website || data.portfolio || null,
  };

  const skills: ISkillsCategory = {
    programmingLanguages: toStringArray(sk.programmingLanguages || sk.programming_languages || sk.languages),
    frameworks: toStringArray(sk.frameworks || sk.frameworks_and_libraries || sk.libraries_and_frameworks || sk.technologies),
    libraries: toStringArray(sk.libraries),
    databases: toStringArray(sk.databases || sk.database),
    tools: toStringArray(sk.tools || sk.developer_tools || sk.devops),
    cloud: toStringArray(sk.cloud || sk.cloud_platforms || sk.cloudPlatforms),
    other: toStringArray(sk.other || sk.core_competencies || sk.concepts || sk.coreConcepts),
  };

  // Education list (supports education, educationHistory, academicBackground, qualifications)
  const rawEdu = Array.isArray(data.education)
    ? data.education
    : Array.isArray(data.educationHistory)
    ? data.educationHistory
    : Array.isArray(data.academicBackground)
    ? data.academicBackground
    : Array.isArray(data.qualifications)
    ? data.qualifications
    : [];

  const education: IEducation[] = rawEdu.map((edu: any) => ({
    degree: edu.degree || edu.title || edu.qualification || null,
    institution: edu.institution || edu.school || edu.university || edu.college || null,
    field: edu.field || edu.major || edu.branch || edu.specialization || null,
    startYear: edu.startYear || edu.start_year || edu.startDate || edu.start_date || null,
    endYear: edu.endYear || edu.end_year || edu.endDate || edu.end_date || null,
    grade: edu.grade || edu.cgpa || edu.gpa || edu.percentage || edu.score || null,
  }));

  // Experience list (supports experience, workExperience, work_experience, employment_history, internships)
  const rawExp = Array.isArray(data.experience)
    ? data.experience
    : Array.isArray(data.workExperience)
    ? data.workExperience
    : Array.isArray(data.work_experience)
    ? data.work_experience
    : Array.isArray(data.employment_history)
    ? data.employment_history
    : Array.isArray(data.internships)
    ? data.internships
    : [];

  const experience: IExperience[] = rawExp.map((exp: any) => ({
    company: exp.company || exp.organization || exp.employer || exp.companyName || null,
    role: exp.role || exp.title || exp.position || exp.designation || null,
    startDate: exp.startDate || exp.start_date || null,
    endDate: exp.endDate || exp.end_date || null,
    description: toStringArray(exp.description || exp.responsibilities || exp.highlights || exp.bullets),
  }));

  // Projects list (supports projects, project, personalProjects, majorProjects)
  const rawProj = Array.isArray(data.projects)
    ? data.projects
    : Array.isArray(data.project)
    ? data.project
    : Array.isArray(data.personalProjects)
    ? data.personalProjects
    : Array.isArray(data.majorProjects)
    ? data.majorProjects
    : [];

  const projects: IProject[] = rawProj.map((proj: any) => ({
    name: proj.name || proj.title || proj.projectName || null,
    description: proj.description || proj.summary || proj.details || null,
    technologies: toStringArray(proj.technologies || proj.tech_stack || proj.techStack || proj.tools),
    role: proj.role || proj.position || null,
    duration: proj.duration || proj.date || proj.timeline || null,
  }));

  // Certifications list (supports certifications, certificates, licensesAndCertifications)
  const rawCert = Array.isArray(data.certifications)
    ? data.certifications
    : Array.isArray(data.certificates)
    ? data.certificates
    : Array.isArray(data.licenses_and_certifications)
    ? data.licenses_and_certifications
    : [];

  const certifications: ICertification[] = rawCert.map((cert: any) => ({
    name: cert.name || cert.title || cert.certificateName || null,
    issuer: cert.issuer || cert.organization || cert.issuingOrganization || cert.authority || null,
    date: cert.date || cert.issue_date || cert.issueDate || null,
  }));

  const aiExecutiveSummary =
    data.aiExecutiveSummary ||
    data.ai_executive_summary ||
    data.executiveSummary ||
    data.executive_summary ||
    null;

  const normalized: IResumeAnalysis & {
    workExperience?: IExperience[];
    educationHistory?: IEducation[];
    aiExecutiveSummary?: string | null;
    ai_executive_summary?: string | null;
  } = {
    personalInfo,
    summary: data.summary || data.professional_summary || data.objective || null,
    aiExecutiveSummary,
    ai_executive_summary: aiExecutiveSummary,
    skills,
    education,
    experience,
    projects,
    certifications,
    // Add backward-compatible aliases on the object
    workExperience: experience,
    educationHistory: education,
  };

  return normalized;
}
