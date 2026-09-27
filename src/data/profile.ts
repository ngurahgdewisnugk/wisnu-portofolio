/**
 * Single source of truth for all personal content on the site.
 * Edit this file to update name, headline, about text, links, and tech stack.
 * Nothing in here is secret: everything is rendered publicly.
 */

export type TechCategory =
  | "cloud"
  | "containers"
  | "ci-cd"
  | "iac"
  | "observability"
  | "os"
  | "language"
  | "tools";

export interface TechItem {
  name: string;
  category: TechCategory;
  featured: boolean;
}

export const profile = {
  /** Full name shown in the hero, SEO tags, and footer. */
  name: "Ngurah Gede Wisnu",
  /** Short name used in the logo and page titles. */
  shortName: "Wisnu",
  headline: "Cloud Automation & Release Engineer",
  /** One-line summary for SEO descriptions and link previews. */
  tagline:
    "Cloud automation and release engineer building AWS infrastructure and CI/CD pipelines where every change is tested, scanned, and traceable.",
  about:
    "Cloud & DevOps engineer with 4+ years in banking IT, where I ran release management, application deployment, and IT risk & compliance. I bring that same discipline to the cloud: automated AWS infrastructure, containerized workloads, and CI/CD pipelines where every change is tested, scanned, and traceable before it reaches production. Currently preparing for the AWS Solutions Architect – Associate certification.",
  /** Words inside `about` that get the accent color. */
  aboutHighlights: ["banking IT", "AWS", "CI/CD", "traceable"],
  location: "Bali, Indonesia",
  /** Public GitHub account whose repos feed the Projects page. */
  githubUsername: "ngurahgdewisnugk",
  /** Repo topic that makes a repo appear on the Projects page. */
  portfolioTopic: "portfolio-project",
  /** Repo topic that makes a repo appear in the "Highlighted work" slider. */
  highlightTopic: "highlight",
  links: {
    github: "https://github.com/ngurahgdewisnugk",
    linkedin: "https://id.linkedin.com/in/ngurahgedewisnugk",
    sourceCode: "https://github.com/ngurahgdewisnugk/wisnu-portofolio",
  },
  /** Leave empty to hide the email card on the Contact page. */
  email: "",
  /** Leave empty to hide the "Download CV" button. */
  cvUrl: "",
  techStack: [
    { name: "AWS", category: "cloud", featured: true },
    { name: "Docker", category: "containers", featured: true },
    { name: "GitHub Actions", category: "ci-cd", featured: true },
    { name: "Linux", category: "os", featured: true },
    { name: "GCP", category: "cloud", featured: false },
    { name: "Kubernetes", category: "containers", featured: false },
    { name: "Terraform", category: "iac", featured: false },
    { name: "Nginx", category: "tools", featured: false },
    { name: "Prometheus", category: "observability", featured: false },
    { name: "Grafana", category: "observability", featured: false },
    { name: "Python", category: "language", featured: false },
    { name: "Bash", category: "language", featured: false },
    { name: "Git", category: "tools", featured: false },
  ] satisfies TechItem[],
} as const;

export type Profile = typeof profile;
