import { IResumeAnalysis, IProject, IExperience, IEducation, ICertification, ISkillsCategory, IPersonalInfo } from '../types';

/**
 * Normalizes resume analysis data to guarantee all sections and properties are safely populated
 */
export function normalizeResumeData(data: any): IResumeAnalysis & { workExperience: IExperience[]; educationHistory: IEducation[] } {
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
      workExperience: [],
      educationHistory: [],
    };
  }

  const pInfo = data.personalInfo || data.personal_information || data.contact || {};
  const sk = data.skills || data.technical_skills || data.skills_by_category || {};

  const toStringArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === 'string' ? v.trim() : String(v))).filter(Boolean);
    }
    if (typeof val === 'string') {
      return val.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const personalInfo: IPersonalInfo = {
    fullName: pInfo.fullName || pInfo.full_name || pInfo.name || data.name || null,
    email: pInfo.email || data.email || null,
    phone: pInfo.phone || pInfo.phoneNumber || data.phone || null,
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

  const rawEdu = Array.isArray(data.education)
    ? data.education
    : Array.isArray(data.educationHistory)
    ? data.educationHistory
    : Array.isArray(data.academicBackground)
    ? data.academicBackground
    : [];

  const education: IEducation[] = rawEdu.map((edu: any) => ({
    degree: edu.degree || edu.title || null,
    institution: edu.institution || edu.school || edu.university || edu.college || null,
    field: edu.field || edu.major || edu.branch || null,
    startYear: edu.startYear || edu.start_year || edu.startDate || null,
    endYear: edu.endYear || edu.end_year || edu.endDate || null,
    grade: edu.grade || edu.cgpa || edu.gpa || null,
  }));

  const rawExp = Array.isArray(data.experience)
    ? data.experience
    : Array.isArray(data.workExperience)
    ? data.workExperience
    : Array.isArray(data.work_experience)
    ? data.work_experience
    : Array.isArray(data.employment_history)
    ? data.employment_history
    : [];

  const experience: IExperience[] = rawExp.map((exp: any) => ({
    company: exp.company || exp.organization || exp.employer || null,
    role: exp.role || exp.title || exp.position || null,
    startDate: exp.startDate || exp.start_date || null,
    endDate: exp.endDate || exp.end_date || null,
    description: toStringArray(exp.description || exp.responsibilities || exp.highlights),
  }));

  const rawProj = Array.isArray(data.projects)
    ? data.projects
    : Array.isArray(data.project)
    ? data.project
    : Array.isArray(data.personalProjects)
    ? data.personalProjects
    : [];

  const projects: IProject[] = rawProj.map((proj: any) => ({
    name: proj.name || proj.title || proj.projectName || null,
    description: proj.description || proj.summary || null,
    technologies: toStringArray(proj.technologies || proj.tech_stack || proj.techStack || proj.tools),
    role: proj.role || null,
    duration: proj.duration || proj.date || null,
  }));

  const rawCert = Array.isArray(data.certifications)
    ? data.certifications
    : Array.isArray(data.certificates)
    ? data.certificates
    : [];

  const certifications: ICertification[] = rawCert.map((cert: any) => ({
    name: cert.name || cert.title || null,
    issuer: cert.issuer || cert.organization || null,
    date: cert.date || cert.issue_date || null,
  }));

  return {
    personalInfo,
    summary: data.summary || data.professional_summary || data.objective || null,
    skills,
    education,
    experience,
    projects,
    certifications,
    workExperience: experience,
    educationHistory: education,
  };
}
