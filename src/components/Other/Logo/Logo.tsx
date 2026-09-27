import Link from "next/link";

import { profile } from "@/data/profile";

const Logo = () => {
  return (
    <Link href="/" className="lg:mt-4" aria-label="Home">
      <p className="sm:text-4xl text-2xl font-bold text-secondary tracking-[4px] relative text-center uppercase">
        {profile.shortName}
        <span className="text-primary">.</span>
      </p>
    </Link>
  );
};

export default Logo;
