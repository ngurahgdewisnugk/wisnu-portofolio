import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  RiCloudLine,
  RiGitMergeLine,
  RiLineChartLine,
  RiShieldCheckLine,
  RiStackLine,
  RiTaskLine,
} from "react-icons/ri";
import { useInView } from "react-intersection-observer";

import {
  fadeInLeft,
  fadeInRight,
  fadeInUp,
  staggerContainer,
} from "@/components/Animations/AdvancedTransition";
import ClientOnly from "@/components/Animations/ClientOnly";

type ExpertiseCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
};

const ExpertiseCard = ({
  icon,
  title,
  description,
  delay = 0,
}: ExpertiseCardProps) => {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ delay }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 flex flex-col items-center text-center shadow-lg hover:bg-white/10 transition-all"
    >
      <div className="text-primary text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/70">{description}</p>
    </motion.div>
  );
};

const CloudExpertise = () => {
  const controls = useAnimation();
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  const terminalRef = useRef<HTMLPreElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (inView) {
      controls.start("animate");
    }
  }, [controls, inView]);

  useEffect(() => {
    if (inView && terminalRef.current && !hasAnimated.current) {
      hasAnimated.current = true;
      const terminal = terminalRef.current as HTMLPreElement;
      const text = `$ git push origin main
[ci]  lint ........................ passed
[ci]  unit tests .................. passed
[ci]  SAST + secret scan .......... passed
[cd]  docker build -t app:3f9c2e1 . done
[cd]  image scan (HIGH,CRITICAL) .. 0 found
[cd]  push ghcr.io/.../app:3f9c2e1  done
[cd]  deploy to production ........ done
[cd]  smoke test /health .......... 200 OK
Release 3f9c2e1 is live.`;

      const lines = text.split("\n");
      let lineIndex = 0;

      terminal.innerHTML = "";

      const typeNextLine = () => {
        if (lineIndex < lines.length) {
          const line = lines[lineIndex];
          const lineElement = document.createElement("div");
          terminal.appendChild(lineElement);

          let charIndex = 0;
          const typeChar = () => {
            if (charIndex < line.length) {
              lineElement.textContent += line[charIndex];
              charIndex++;
              setTimeout(typeChar, Math.random() * 50 + 10);
            } else {
              lineIndex++;
              setTimeout(typeNextLine, 300);
            }
          };

          typeChar();
        }
      };

      setTimeout(typeNextLine, 1000);
    }
  }, [inView]);

  return (
    <section className="lg:py-5 lg:pb-10 xl:pt-48 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary/5 rounded-full filter blur-3xl opacity-30"></div>
      </div>

      <div className="container mx-auto">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={controls}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            Cloud &amp; DevOps Expertise
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg">
            Shipping changes to the cloud quickly, safely, and with evidence
            for every release
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <motion.div
            className="absolute top-1/2 left-1/2 inset-x-1/2 w-64 md:w-80 h-64 md:h-80 bg-secondary/20 rounded-full blur-3xl pointer-events-none z-0"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <ExpertiseCard
            icon={<RiGitMergeLine />}
            title="CI/CD Automation"
            description="GitHub Actions pipelines that lint, test, scan, build, and deploy, with production releases only from main."
            delay={0.1}
          />

          <ExpertiseCard
            icon={<RiCloudLine />}
            title="AWS Infrastructure"
            description="EC2, VPC, security groups, IAM and S3 set up with least privilege and cost awareness in mind."
            delay={0.2}
          />

          <ExpertiseCard
            icon={<RiStackLine />}
            title="Containers"
            description="Docker images built once and promoted by commit SHA, run with Docker Compose, with hands-on Kubernetes practice."
            delay={0.3}
          />

          <ExpertiseCard
            icon={<RiTaskLine />}
            title="Release Management"
            description="Years of production releases in banking: change approval, rollback plans, and release evidence."
            delay={0.4}
          />

          <ExpertiseCard
            icon={<RiShieldCheckLine />}
            title="Security &amp; Compliance"
            description="Secrets kept out of code, dependency and image scanning as pipeline gates, and IT risk assessment."
            delay={0.5}
          />

          <ExpertiseCard
            icon={<RiLineChartLine />}
            title="Monitoring"
            description="Prometheus metrics, Grafana dashboards and structured logs to see what production is actually doing."
            delay={0.6}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={controls}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 "
        >
          <motion.div
            variants={fadeInLeft}
            className="bg-white/10 rounded-lg border border-white/10 p-6 shadow-2xl overflow-visible"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="ml-2 text-xs text-white/60">pipeline.log</div>
            </div>
            <ClientOnly>
              <pre
                ref={terminalRef}
                className="font-mono text-xs text-green-400 bg-black/70 p-4 rounded h-[250px] overflow-y-auto"
              ></pre>
            </ClientOnly>
          </motion.div>

          <motion.div variants={fadeInRight} className="space-y-6">
            <h3 className="text-2xl font-bold">How I Ship</h3>
            <p className="text-white/80 text-justify">
              Banking taught me that a release is only as good as its evidence.
              I build delivery pipelines where every step is automated,
              repeatable, and leaves an audit trail.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Every image tagged with its commit SHA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Quality and security gates block bad builds</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Secrets in a vault, never in the repo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Health checks and smoke tests after every deploy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Rollback plan ready before release</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CloudExpertise;
