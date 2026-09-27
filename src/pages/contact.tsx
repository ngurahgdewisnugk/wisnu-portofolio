import Seo from "@/components/Other/Seo";
import { profile } from "@/data/profile";
import Contact from "@/components/Templates/Contact/Contact";

const ContactPage = () => {
  return (
    <>
      <Seo
        description={`Get in touch with ${profile.name} about cloud, DevOps, and release engineering.`}
        title={`Contact | ${profile.shortName}`}
      />
      <Contact />
    </>
  );
};

export default ContactPage;
