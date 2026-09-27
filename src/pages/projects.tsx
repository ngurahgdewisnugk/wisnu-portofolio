import SmoothScrollSection from "@/components/Animations/SmoothScrollSection";
import Seo from "@/components/Other/Seo";
import { profile } from "@/data/profile";
import Projects from "@/components/Templates/Projects/Projects";

const ProjectsPage = () => {
  return (
    <>
      <Seo
        description={`Cloud, DevOps and automation projects by ${profile.name}.`}
        title={`Projects | ${profile.shortName}`}
      />
      <SmoothScrollSection>
        <Projects />
      </SmoothScrollSection>
    </>
  );
};

export default ProjectsPage;
