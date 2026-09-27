import Link from "next/link";
import { RiGithubFill } from "react-icons/ri";

import Socials from "@/components/Other/Socials/Socials";
import { profile } from "@/data/profile";
import { getVersionInfo } from "@/lib/version";

const Footer = () => {
  // Evaluated at render time on the server, so it shows the running image version.
  const { version, commitShort } = getVersionInfo();

  return (
    <footer className="bg-tertiary py-12">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-between">
          <Socials
            containerStyles="flex gap-x-6 mx-auto xl:mx-0 mb-4"
            iconsStyles="text-white/70 text-[20px] hover:text-primary transition-all"
          />

          <div className="text-center lg:text-start text-muted-foreground mb-3">
            &copy; {new Date().getFullYear()} {profile.name}
          </div>
          <Link
            href={profile.links.sourceCode}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/50 hover:text-primary transition-all text-sm mb-2"
          >
            <RiGithubFill className="text-lg" />
            View source &amp; CI/CD pipeline
          </Link>
          <Link
            href="/version"
            className="font-mono text-xs text-white/30 hover:text-primary transition-all"
            aria-label="Deployed version"
          >
            v{version} ({commitShort})
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
