import type { PublicProfile } from "@/lib/profile-types";

// Fictional sample people for design previews, the landing page, and card samples. Everything
// written here is made up. Photos are Unsplash stock (free to use under the Unsplash License),
// loaded from Unsplash's CDN.
const u = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const base = {
  status: "active" as const,
  showPhoneOnSite: true,
  showPhoneOnCard: true,
  links: { linkedin: "https://www.linkedin.com" },
  theme: {},
  resumePdfPublicUrl: null,
  noindex: true,
  future: [],
};

const john: PublicProfile = {
  ...base,
  slug: "john",
  qrCode: "example0",
  name: "John Doe",
  headline: "Computer Engineering @ State University · D2 Track & Field",
  email: "john.doe@example.com",
  phone: "555-010-0199",
  links: { github: "https://github.com", linkedin: "https://www.linkedin.com" },
  facts: [
    { label: "Major", value: "Computer Engineering" },
    { label: "Athletics", value: "D2 Track & Field", detail: "Sprints and hurdles" },
    { label: "Academics", value: "3.8", detail: "College GPA" },
    { label: "School", value: "State University", detail: "Class of 2029" },
  ],
  slides: [
    {
      section: "About", title: "Hi, I'm John", role: "Sophomore · Computer Engineering",
      body: "I like building small things that work: apps, circuits, and the occasional robot. I run hurdles for State and teach an intro coding workshop in the summer.",
      points: [], link: null, tint: "#6b5a2a", media: { type: "image", url: u("1507003211169-0a1dd7228f2d"), position: "center 25%" },
    },
    {
      section: "Education", title: "B.S. Computer Engineering", role: "State University · 2025 – Present", body: null,
      points: ["GPA 3.8, Dean's List both semesters", "Coursework: Digital Logic, Data Structures, Circuits I"],
      link: null, tint: "#2a2f45", media: { type: "image", url: u("1541339907198-e08756dedf3f") },
    },
    {
      section: "Projects", title: "Campus Ride Board", role: "Personal project · 2026", body: null,
      points: ["Web app where students post and join rides home for breaks; about 300 users in the first month", "React front end, small Node API, sign-in with school email"],
      link: null, tint: "#1f3d5c", media: { type: "image", url: u("1498050108023-c5249f4df085") },
    },
    {
      section: "Projects", title: "Plant Watering Sensor", role: "Intro to Engineering · 2025", body: null,
      points: ["Soil sensor and pump on a microcontroller that waters a plant when the soil dries out", "Wrote the firmware and designed the 3D-printed case"],
      link: null, tint: "#2d4a3a", media: null,
    },
    {
      section: "Work", title: "IT Help Desk Assistant", role: "State University Library · 2025 – Present", body: null,
      points: ["Answer about 40 student and staff tickets a week", "Wrote the lab's printer setup guide"],
      link: null, tint: "#5c2a1f", media: null,
    },
    {
      section: "Skills", title: "Skills", role: "Tools I use", body: null,
      points: ["Python, JavaScript, C", "React, Node, Git", "Arduino, soldering, 3D printing"],
      link: null, tint: "#1f2f3a", media: null,
    },
  ],
};

const maya: PublicProfile = {
  ...base,
  slug: "maya",
  qrCode: "example1",
  name: "Maya Patel",
  headline: "B.S. Nursing @ Riverside University · Student Nurses Association",
  email: "maya.patel@example.com",
  phone: "555-010-0142",
  facts: [
    { label: "Major", value: "Nursing (BSN)" },
    { label: "Academics", value: "3.9", detail: "College GPA" },
    { label: "Clinical hours", value: "480", detail: "Med-surg, pediatrics, ICU" },
    { label: "School", value: "Riverside University", detail: "Class of 2027" },
  ],
  slides: [
    {
      section: "About", title: "Hi, I'm Maya", role: "Junior · Nursing",
      body: "I'm a nursing student who loves pediatrics. I work nights as a patient care tech and volunteer at a free clinic on weekends.",
      points: [], link: null, tint: "#3f2d5c", media: { type: "image", url: u("1494790108377-be9c29b29330"), position: "center 20%" },
    },
    {
      section: "Education", title: "Bachelor of Science in Nursing", role: "Riverside University · 2023 – Present", body: null,
      points: ["GPA 3.9, President's List", "BLS and ACLS certified"],
      link: null, tint: "#2a2f45", media: { type: "image", url: u("1523050854058-8df90110c9f1") },
    },
    {
      section: "Clinical", title: "Pediatric Rotation", role: "Riverside Children's Hospital · Spring 2026", body: null,
      points: ["Cared for up to 3 patients per shift under an RN preceptor", "Led family teaching on asthma inhalers"],
      link: null, tint: "#2d4a3a", media: { type: "image", url: u("1576091160399-112ba8d25d1d") },
    },
    {
      section: "Work", title: "Patient Care Technician", role: "Mercy General · 2024 – Present", body: null,
      points: ["Vitals, EKGs, and blood draws on a 32-bed med-surg unit", "Trained 5 new techs on charting"],
      link: null, tint: "#5c2a1f", media: null,
    },
    {
      section: "Leadership", title: "Vice President", role: "Student Nurses Association · 2025 – Present", body: null,
      points: ["Organized two blood drives with 180 donors", "Run the NCLEX study group"],
      link: null, tint: "#5c4a1f", media: { type: "image", url: u("1522202176988-66273c2fd55f") },
    },
    {
      section: "Skills", title: "Skills", role: "Certifications and tools", body: null,
      points: ["BLS, ACLS, CNA", "Epic charting", "Conversational Spanish and Gujarati"],
      link: null, tint: "#1f2f3a", media: null,
    },
  ],
};

const marcus: PublicProfile = {
  ...base,
  slug: "marcus",
  qrCode: "example2",
  name: "Marcus Reed",
  headline: "Finance @ Lakeview College · D1 Basketball",
  email: "marcus.reed@example.com",
  phone: "555-010-0176",
  facts: [
    { label: "Major", value: "Finance", detail: "Minor in Economics" },
    { label: "Athletics", value: "NCAA D1 Basketball", detail: "Guard, 2-year starter" },
    { label: "Academics", value: "3.6", detail: "College GPA" },
    { label: "School", value: "Lakeview College", detail: "Class of 2027" },
  ],
  slides: [
    {
      section: "About", title: "Hi, I'm Marcus", role: "Junior · Finance",
      body: "I play point guard for Lakeview and study finance. I'm looking for a summer analyst internship in investment banking or corporate finance.",
      points: [], link: null, tint: "#1f3d5c", media: { type: "image", url: u("1506794778202-cad84cf45f1d"), position: "center 20%" },
    },
    {
      section: "Education", title: "B.S. Finance", role: "Lakeview College · 2023 – Present", body: null,
      points: ["GPA 3.6, Academic All-Conference", "Coursework: Corporate Finance, Financial Modeling, Econometrics"],
      link: null, tint: "#2a2f45", media: null,
    },
    {
      section: "Experience", title: "Finance Intern", role: "Harbor Credit Union · Summer 2025", body: null,
      points: ["Built a loan-default dashboard in Excel and Power BI used by the lending team", "Presented branch profitability findings to the CFO"],
      link: null, tint: "#2d4a3a", media: { type: "image", url: u("1454165804606-c3d57bc86b40") },
    },
    {
      section: "Athletics", title: "Men's Basketball", role: "Lakeview College · NCAA Division I", body: null,
      points: ["Two-year starter at point guard", "Team captain, 2026 season"],
      link: null, tint: "#5c2a1f", media: null,
    },
    {
      section: "Leadership", title: "Student-Athlete Advisory Committee", role: "Treasurer · 2025 – Present", body: null,
      points: ["Manage a $12,000 budget for athlete events", "Started a financial literacy workshop for freshmen"],
      link: null, tint: "#5c4a1f", media: { type: "image", url: u("1552664730-d307ca884978") },
    },
    {
      section: "Skills", title: "Skills", role: "Tools I use", body: null,
      points: ["Excel (models, pivot tables), Power BI", "Bloomberg Market Concepts certificate", "Public speaking"],
      link: null, tint: "#1f2f3a", media: null,
    },
  ],
};

const sofia: PublicProfile = {
  ...base,
  slug: "sofia",
  qrCode: "example3",
  name: "Sofia Alvarez",
  headline: "Biology, Pre-Med @ Northfield University · Undergraduate Researcher",
  email: "sofia.alvarez@example.com",
  phone: "555-010-0163",
  facts: [
    { label: "Major", value: "Biology", detail: "Pre-med track" },
    { label: "Academics", value: "3.95", detail: "College GPA" },
    { label: "Research", value: "Neuroscience lab", detail: "2 years, 1 poster" },
    { label: "School", value: "Northfield University", detail: "Class of 2026" },
  ],
  slides: [
    {
      section: "About", title: "Hi, I'm Sofia", role: "Senior · Biology, Pre-Med",
      body: "I study how sleep affects memory in a neuroscience lab, and I'm applying to medical school this cycle. Outside the lab I tutor chemistry and run half marathons.",
      points: [], link: null, tint: "#2d4a3a", media: { type: "image", url: u("1438761681033-6461ffad8d80"), position: "center 20%" },
    },
    {
      section: "Education", title: "B.S. Biology", role: "Northfield University · 2022 – 2026", body: null,
      points: ["GPA 3.95, Phi Beta Kappa", "Minor in Chemistry"],
      link: null, tint: "#2a2f45", media: null,
    },
    {
      section: "Research", title: "Undergraduate Researcher", role: "Sleep & Memory Lab · 2024 – Present", body: null,
      points: ["Ran behavioral trials and analyzed data in R", "Presented a poster at the state neuroscience conference"],
      link: null, tint: "#1f3d5c", media: { type: "image", url: u("1532094349884-543bc11b234d") },
    },
    {
      section: "Work", title: "Chemistry Tutor", role: "Northfield Learning Center · 2023 – Present", body: null,
      points: ["Tutor about 15 students a week in general and organic chemistry"],
      link: null, tint: "#5c2a1f", media: null,
    },
    {
      section: "Service", title: "Clinic Volunteer", role: "Eastside Free Clinic · 2023 – Present", body: null,
      points: ["Intake and Spanish interpreting, 150+ hours"],
      link: null, tint: "#5c4a1f", media: null,
    },
    {
      section: "Skills", title: "Skills", role: "Lab and data", body: null,
      points: ["Cell culture, PCR, microscopy", "R, SPSS", "Fluent Spanish"],
      link: null, tint: "#1f2f3a", media: null,
    },
  ],
};

export const EXAMPLES = { john, maya, marcus, sofia } as const;
export type ExampleId = keyof typeof EXAMPLES;
export const exampleIds = Object.keys(EXAMPLES) as ExampleId[];

// Which sample person shows each layout, so previews show a variety of people and majors.
export const EXAMPLE_FOR_TEMPLATE: Record<string, ExampleId> = {
  carousel: "john",
  profile: "marcus",
  timeline: "sofia",
  gallery: "maya",
};

export const headshotOf = (p: PublicProfile) => {
  const m = p.slides[0]?.media;
  return m?.type === "image" ? m.url.replace("w=1200", "w=400") : null;
};
