import { ProjectCardInterface } from "@/interfaces/ProjectInterface";

import { profile } from "@/data/profile";

/**
 * Hand-picked projects that always appear in the "Highlighted work" slider.
 * Anything else shows up automatically from GitHub repos tagged with the
 * `highlight` topic.
 */
export const workData: ProjectCardInterface["project"][] = [
  {
    image: "/projects/portfolio-pipeline.svg",
    category: "DevOps",
    name: "Portfolio with CI/CD on AWS",
    description:
      "This site. Next.js app shipped by GitHub Actions: lint, tests, SAST and secret scan, image scan, push to GHCR, then SSH deploy to EC2 behind Nginx with Prometheus and Grafana monitoring.",
    link: "/version",
    github: profile.links.sourceCode,
    language: "typescript",
  },
];
