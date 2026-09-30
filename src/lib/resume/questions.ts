// The "build my resume" interview. Shared by the form (browser) and the API (server).
export const INTERVIEW_QUESTIONS = [
  {
    id: "school",
    question: "Where do you go to school?",
    hint: "Your school, major, expected graduation, and GPA if you want to share it.",
  },
  {
    id: "work",
    question: "What jobs or internships have you had?",
    hint: "For each one: where, your title, when, and what you did day to day.",
  },
  {
    id: "projects",
    question: "What have you built or worked on?",
    hint: "Class, team, or personal projects. What it was, what you did, and how it turned out.",
  },
  {
    id: "activities",
    question: "Clubs, sports, leadership, or volunteering?",
    hint: "Include any titles, how long, and what you did.",
  },
  {
    id: "skills",
    question: "What are you good at?",
    hint: "Tools, software, languages, certifications.",
  },
  {
    id: "awards",
    question: "Any awards or honors?",
    hint: "Dean's list, scholarships, team awards, anything you're proud of.",
  },
  {
    id: "about",
    question: "Who are you, and what are you looking for next?",
    hint: "A couple of sentences, like you'd say when meeting someone.",
  },
] as const;

export type InterviewAnswers = { name: string; email: string; phone: string } & Record<
  (typeof INTERVIEW_QUESTIONS)[number]["id"],
  string
>;

export function interviewTranscript(a: InterviewAnswers) {
  const lines = [`Name: ${a.name}`, a.email && `Email: ${a.email}`, a.phone && `Phone: ${a.phone}`].filter(Boolean);
  for (const q of INTERVIEW_QUESTIONS) {
    const answer = a[q.id]?.trim();
    if (answer) lines.push("", `Q: ${q.question}`, `A: ${answer}`);
  }
  return lines.join("\n");
}
