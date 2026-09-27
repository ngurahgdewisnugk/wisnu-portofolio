import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  RiGithubFill,
  RiLinkedinFill,
  RiMailFill,
  RiMapPin2Fill,
} from "react-icons/ri";

import AdvancedTextAnimation from "@/components/Animations/AdvancedTextAnimation";
import {
  fadeInUp,
  staggerContainer,
} from "@/components/Animations/AdvancedTransition";
import FloatingElement from "@/components/Animations/FloatingElement";
import TextReveal from "@/components/Animations/TextReveal";
import { profile } from "@/data/profile";

interface ContactCard {
  title: string;
  label: string;
  href: string;
  note: string;
  icon: ReactNode;
}

const contactCards: ContactCard[] = [
  {
    title: "LinkedIn",
    label: "Connect with me",
    href: profile.links.linkedin,
    note: "Best way to reach me",
    icon: <RiLinkedinFill />,
  },
  {
    title: "GitHub",
    label: `@${profile.githubUsername}`,
    href: profile.links.github,
    note: "Code, labs and pipelines",
    icon: <RiGithubFill />,
  },
  ...(profile.email
    ? [
        {
          title: "Email",
          label: profile.email,
          href: `mailto:${profile.email}`,
          note: "I usually reply within a day",
          icon: <RiMailFill />,
        },
      ]
    : []),
];

const Contact = () => {
  return (
    <section className="min-h-screen relative overflow-hidden justify-center flex flex-col items-center">
      {/* Animated glowing orbs */}
      <motion.div
        className="absolute top-[20%] left-[15%] w-24 h-24 bg-primary/30 rounded-full filter blur-2xl mix-blend-screen"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-[30%] right-[10%] w-32 h-32 bg-secondary/20 rounded-full filter blur-2xl mix-blend-screen"
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute top-[60%] left-[5%] w-16 h-16 bg-primary/40 rounded-full filter blur-2xl mix-blend-screen"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute top-[10%] right-[20%] w-20 h-20 bg-secondary/30 rounded-full filter blur-2xl mix-blend-screen"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 3,
        }}
      />

      {/* Original background decorations */}
      <motion.div
        className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-1/3 left-0 w-80 h-80 bg-secondary/5 rounded-full filter blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1,
        }}
      />

      <div className="container mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="pt-12 xl:pt-24"
        >
          <div className="flex flex-col justify-center text-center max-w-3xl mx-auto">
            <motion.div variants={fadeInUp}>
              <div className="flex items-center gap-x-4 text-primary text-lg mb-4 justify-center">
                <span className="w-[30px] h-[2px] bg-primary"></span>
                <TextReveal text="Say hello" className="text-xl" />
                <span className="w-[30px] h-[2px] bg-primary"></span>
              </div>
              <h1 className="h1 mb-8">Let&apos;s Connect!</h1>
              <AdvancedTextAnimation
                text="Working on cloud migration, CI/CD, or release automation? I'm always happy to talk about infrastructure, delivery pipelines, or opportunities to collaborate."
                animationStyle="fade"
                className="subtitle mb-12"
                speed={0.02}
              />
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className={`grid gap-8 mb-12 ${
                contactCards.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2"
              }`}
            >
              {contactCards.map((card, index) => (
                <FloatingElement
                  key={card.title}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300"
                  duration={5}
                  distance={10}
                  delay={index * 0.2}
                >
                  <a href={card.href} target="_blank" rel="noopener noreferrer">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="text-4xl text-primary">{card.icon}</div>
                      <h3 className="text-xl font-semibold">{card.title}</h3>
                      <span className="text-white/70 hover:text-primary transition-colors break-all">
                        {card.label}
                      </span>
                      <p className="text-sm text-white/50">{card.note}</p>
                    </motion.div>
                  </a>
                </FloatingElement>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <div className="flex items-center gap-x-4 text-white/70 justify-center mb-2">
                <RiMapPin2Fill size={18} />
                <span>{profile.location}</span>
              </div>
              <p className="text-sm text-white/50">
                Open to remote and on-site roles in cloud and DevOps engineering
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
