import { motion } from 'framer-motion';
import gsap from 'gsap';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RiAddLine,
  RiArrowDownSLine,
  RiCloseLine,
  RiDownloadFill,
  RiMailSendFill,
} from 'react-icons/ri';

import { profile } from '@/data/profile';

import { highlightTechArray } from './syntax-highlighter';

const techStackData = profile.techStack;

import {
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  fadeInUp,
  staggerContainer,
} from '@/components/Animations/AdvancedTransition';
import ClientOnly from '@/components/Animations/ClientOnly';
import FloatingElement from '@/components/Animations/FloatingElement';
import DevImg from '@/components/Other/DevImg/DevImg';
import { StackIcon } from '@/components/Other/ProfessionalBadge/Icons';
import ProfessionalBadge from '@/components/Other/ProfessionalBadge/ProfessionalBadge';
import Socials from '@/components/Other/Socials/Socials';
import { Button } from '@/components/Other/UI/button';

/** Wraps each highlight word found in `text` with the accent color. */
function highlightWords(text: string, words: readonly string[]) {
  if (words.length === 0) return text;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));
  return parts.map((part, i) =>
    words.includes(part) ? (
      <span key={i} className="text-primary font-semibold">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const InitialHome = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const codeBlockRef = useRef<HTMLPreElement>(null);
  const [techStackExpanded, setTechStackExpanded] = useState(false);
  const animationInitializedRef = useRef(false);

  useEffect(() => {
    if (titleRef.current) {
      const words = (titleRef.current.textContent || '').split(' ');
      titleRef.current.innerHTML = '';

      // Letters are animated one by one, but each word stays an unbreakable
      // group so the name never wraps mid-word and spaces are preserved.
      words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';
        word.split('').forEach((letter) => {
          const span = document.createElement('span');
          span.textContent = letter;
          span.className = 'title-letter';
          span.style.opacity = '0';
          span.style.display = 'inline-block';
          wordSpan.appendChild(span);
        });
        titleRef.current?.appendChild(wordSpan);
        if (wordIndex < words.length - 1) {
          titleRef.current?.appendChild(document.createTextNode(' '));
        }
      });

      gsap.to(titleRef.current.querySelectorAll('.title-letter'), {
        opacity: 1,
        stagger: 0.05,
        duration: 0.5,
        y: 0,
        ease: 'power2.out',
        delay: 0.5,
      });
    }
  }, []);

  // Generate the code text for the animation - memoized to prevent re-creation
  const codeText = useMemo(() => {
    const techByCategory = techStackData.reduce((acc, tech) => {
      if (!acc[tech.category]) acc[tech.category] = [];
      acc[tech.category].push(tech.name);
      return acc;
    }, {} as Record<string, string[]>);
    const pick = (...categories: string[]) =>
      categories.flatMap((c) => techByCategory[c] || []);

    const str = (v: string) => `<span style="color:#CE9178">'${v}'</span>`;
    const key = (k: string) => `<span style="color:#9CDCFE">${k}</span>`;

    return `<span style="color:#6A9955">// Every change: tested, scanned, traceable</span>
<span style="color:#569CD6">const</span> engineer = {
  ${key('name')}: ${str(profile.shortName)},
  ${key('role')}: ${str(profile.headline)},
  ${key('stack')}: {
    ${key('cloud')}: ${highlightTechArray(pick('cloud'))},
    ${key('containers')}: ${highlightTechArray(pick('containers'))},
    ${key('delivery')}: ${highlightTechArray(pick('ci-cd', 'iac'))},
    ${key('observability')}: ${highlightTechArray(pick('observability'))}
  },
  ${key('ship')}: (<span style="color:#4FC1FF">change</span>) <span style="color:#569CD6">=></span>
    <span style="color:#4EC9B0">test</span>(change) && <span style="color:#4EC9B0">scan</span>(change) && <span style="color:#4EC9B0">deploy</span>(change)
};`;
  }, []);

  // Simple and reliable animation initialization
  useEffect(() => {
    // Only run on client and once
    if (typeof window === 'undefined' || animationInitializedRef.current)
      return;

    // Add minimal required styles
    const addStyles = () => {
      const styleId = 'code-animation-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .code-block {
            transition: color 0.3s ease;
          }
        `;
        document.head.appendChild(style);
      }
    };

    addStyles();

    // Use a single timeout with adequate delay
    const animationTimeout = setTimeout(() => {
      if (codeBlockRef.current) {
        try {
          // Initialize with a safer animation configuration
          gsap.to(
            {},
            {
              duration: 6,
              ease: 'power1.inOut',
              onUpdate: function (this: { progress: () => number }) {
                // Simple fallback in case setupCodeTypingAnimation fails
                try {
                  // Manually implement the typing animation to avoid issues
                  if (codeBlockRef.current) {
                    const progress = this.progress();
                    const textLength = codeText.replace(/<[^>]*>/g, '').length;
                    const currentLength = Math.floor(progress * textLength);

                    // Create simplified typing effect
                    let plainTextCount = 0;
                    let displayHTML = '';
                    let inTag = false;
                    let currentTag = '';

                    for (let i = 0; i < codeText.length; i++) {
                      const char = codeText[i];

                      if (char === '<') {
                        inTag = true;
                        currentTag += char;
                      } else if (char === '>') {
                        inTag = false;
                        currentTag += char;
                        displayHTML += currentTag;
                        currentTag = '';
                      } else if (inTag) {
                        currentTag += char;
                      } else {
                        displayHTML += char;
                        plainTextCount++;

                        if (plainTextCount >= currentLength) {
                          break;
                        }
                      }
                    }

                    codeBlockRef.current.innerHTML = displayHTML;
                  }
                } catch (err) {
                  console.warn('Animation step error, using fallback:', err);
                  if (codeBlockRef.current && !codeBlockRef.current.innerHTML) {
                    codeBlockRef.current.innerHTML = codeText;
                  }
                }
              },
              onComplete: function () {
                // Make sure the final state is set
                if (codeBlockRef.current) {
                  codeBlockRef.current.innerHTML = codeText;
                }
              },
            },
          );

          // Mark as initialized to prevent re-runs
          animationInitializedRef.current = true;
        } catch (error) {
          console.error('Animation error:', error);

          // Simple fallback if animation fails
          if (codeBlockRef.current) {
            codeBlockRef.current.innerHTML = codeText;
          }
        }
      }
    }, 800);

    return () => {
      clearTimeout(animationTimeout);
    };
  }, [codeText]);

  useEffect(() => {
    if (techStackExpanded) {
      const badges = document.querySelectorAll('.tech-badge');
      gsap.fromTo(
        badges,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.03,
          ease: 'power2.out',
          duration: 0.4,
        },
      );
    }
  }, [techStackExpanded]);

  return (
    <section className="pt-12 md:pt-24 xl:py-24 xl:pt-0 mb-10 relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-20">
        <div className="absolute top-16 left-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute bottom-16 right-16 w-96 h-96 rounded-full bg-secondary/20 blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col xl:flex-row justify-between gap-x-8 items-center"
        >
          <motion.div
            variants={fadeInDown}
            className="flex max-w-[600px] flex-col justify-center
            mx-auto xl:mx-0 text-center xl:text-left"
          >
            <motion.div
              variants={fadeInUp}
              className="text-sm uppercase font-semibold
              mb-6 text-primary tracking-[4px] flex justify-center xl:justify-start"
            >
              <ProfessionalBadge
                text={profile.headline}
                icon={<StackIcon size={14} />}
                animated={true}
                gradient={true}
              />
            </motion.div>

            <h1
              ref={titleRef}
              className="text-[36px] sm:text-[45px] xl:text-[52px] leading-tight mb-4 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text"
            >
              {profile.name.toUpperCase()}
            </h1>

            <motion.p
              variants={fadeInDown}
              className="max-w-[500px] mx-auto xl:mx-0 text-sm mb-5 leading-relaxed text-center xl:text-left"
            >
              {highlightWords(profile.about, profile.aboutHighlights)}
            </motion.p>

            <motion.div
              variants={fadeInDown}
              className="flex flex-col gap-y-3 md:flex-row gap-x-3
              mx-auto xl:mx-0 mb-8"
            >
              <Link href="/contact" aria-label="contact">
                <Button className="gap-x-2 group">
                  Contact me{' '}
                  <RiMailSendFill
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Button>
              </Link>
              {profile.cvUrl && (
                <Link target="_blank" href={profile.cvUrl} aria-label="cv">
                  <Button variant="secondary" className="gap-x-2 group">
                    Download CV
                    <RiDownloadFill
                      size={18}
                      className="transition-transform group-hover:translate-y-1"
                    />
                  </Button>
                </Link>
              )}
            </motion.div>

            <motion.div variants={fadeInRight} className="hidden md:block mb-8">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-xs uppercase tracking-wider mb-2">
                  Tech Stack:
                </div>
                {techStackExpanded && (
                  <button
                    onClick={() => setTechStackExpanded(false)}
                    className="flex items-center justify-center p-2 rounded-full bg-white/10 transition-all duration-300 ease-in-out hover:bg-white/20 mb-2 hover:rotate-90"
                    aria-label="Collapse tech stack"
                  >
                    <RiCloseLine className="text-xs" />
                  </button>
                )}
              </div>

              <div
                className={`flex flex-wrap gap-x-3 gap-y-2 transition-all duration-500 ease-in-out ${
                  techStackExpanded
                    ? 'max-h-[500px] opacity-100 transform-gpu'
                    : 'max-h-[38px] overflow-hidden'
                }`}
              >
                {techStackData
                  .filter((tech) => tech.featured)
                  .map((tech, index) => (
                    <span
                      key={`featured-${tech.name}-${index}`}
                      className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs tech-badge"
                    >
                      {tech.name}
                    </span>
                  ))}

                {!techStackExpanded && (
                  <button
                    onClick={() => setTechStackExpanded(true)}
                    className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex items-center gap-x-1 cursor-pointer"
                    aria-label="Show more technologies"
                  >
                    <span>
                      +{techStackData.filter((tech) => !tech.featured).length}{' '}
                      more
                    </span>
                    <RiAddLine className="text-xs" />
                  </button>
                )}

                {techStackExpanded &&
                  techStackData
                    .filter((tech) => !tech.featured)
                    .map((tech, index) => (
                      <span
                        key={`additional-${tech.name}-${index}`}
                        className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs tech-badge"
                      >
                        {tech.name}
                      </span>
                    ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInRight}>
              <Socials
                containerStyles="flex gap-x-6 justify-center xl:justify-start"
                iconsStyles="text-foreground text-[22px] hover:text-primary transition-all"
              />
            </motion.div>
          </motion.div>

          <motion.div variants={fadeInLeft} className="hidden xl:flex relative">
            <FloatingElement
              className="w-full overflow-hidden"
              duration={10}
              distance={50}
            >
              <DevImg
                alt="Cloud delivery pipeline illustration"
                priority
                containerStyles="w-[510px] h-[520px] relative flex items-center"
                containerStylesImage="w-full h-auto"
                imgSrc="/hero-cloud.svg"
              />
            </FloatingElement>




            {/* Code block */}
            <div className="absolute -left-20 bottom-[-220px] z-30 ">
              <div className="h-[310px] w-[550px] bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 shadow-2xl ms-10">
                <div className="flex items-center gap-x-4 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <ClientOnly
                  fallback={
                    <div className="h-[260px] w-full flex items-center justify-center text-xs text-white/50 font-mono">
                      Loading code block...
                    </div>
                  }
                >
                  <div className="code-container relative h-[260px]">
                    <pre
                      ref={codeBlockRef}
                      className="text-xs text-white font-mono overflow-x-auto whitespace-pre-wrap h-full w-full"
                      style={{ willChange: 'contents' }}
                    ></pre>
                  </div>
                </ClientOnly>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll down button */}
        <motion.div
          variants={fadeInUp}
          className="hidden xl:flex absolute left-2/4 bottom-44 xl:bottom-12 animate-bounce"
        >
          <RiArrowDownSLine
            className="text-3xl text-primary cursor-pointer"
            onClick={() =>
              window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth',
              })
            }
          />
        </motion.div>
      </div>
    </section>
  );
};

export default InitialHome;
