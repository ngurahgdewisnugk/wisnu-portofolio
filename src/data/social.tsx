import { RiGithubFill, RiLinkedinFill } from "react-icons/ri";

import { profile } from "@/data/profile";

export const icons = [
  {
    path: profile.links.github,
    name: <RiGithubFill />,
    title: "GitHub",
  },
  {
    path: profile.links.linkedin,
    name: <RiLinkedinFill />,
    title: "LinkedIn",
  },
];
