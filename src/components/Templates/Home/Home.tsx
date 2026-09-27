import AdvancedTransition from "@/components/Animations/AdvancedTransition";
import SmoothScrollSection from "@/components/Animations/SmoothScrollSection";
import CloudExpertise from "@/components/Other/CloudExpertise/CloudExpertise";
import GithubActivity from "@/components/Other/GithubContributions/GithubActivity";
import InitialHome from "@/components/Other/InitialHome/InitialHome";
import Work from "@/components/Other/Work/Work";

const Home = () => {
  return (
    <AdvancedTransition>
      <div className="overflow-hidden">
        <InitialHome />
        <SmoothScrollSection>
          <CloudExpertise />
        </SmoothScrollSection>
        <SmoothScrollSection>
          <Work />
        </SmoothScrollSection>
        <SmoothScrollSection>
          <GithubActivity />
        </SmoothScrollSection>
      </div>
    </AdvancedTransition>
  );
};

export default Home;
