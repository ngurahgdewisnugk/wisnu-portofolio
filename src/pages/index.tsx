import Seo from "@/components/Other/Seo";
import { profile } from "@/data/profile";
import Home from "@/components/Templates/Home/Home";

const HomePage = () => {
  return (
    <>
      <Seo
        description={profile.tagline}
        title={`${profile.shortName} | ${profile.headline}`}
      />
      <Home />
    </>
  );
};

export default HomePage;
