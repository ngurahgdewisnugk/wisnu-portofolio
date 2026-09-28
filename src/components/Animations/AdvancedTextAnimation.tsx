import { motion, type Variants } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface AdvancedTextAnimationProps {
  text: string;
  className?: string;
  animationStyle?: "slide" | "fade";
  once?: boolean;
  delay?: number;
  /** Seconds between one word and the next. */
  speed?: number;
  threshold?: number;
}

/**
 * Reveals text word by word as it scrolls into view.
 * Everything is rendered by React (no innerHTML), so the text is always
 * escaped and can never be interpreted as markup.
 */
const AdvancedTextAnimation = ({
  text,
  className = "",
  animationStyle = "slide",
  once = false,
  delay = 0,
  speed = 0.05,
  threshold = 0.1,
}: AdvancedTextAnimationProps) => {
  const { ref, inView } = useInView({ triggerOnce: once, threshold });

  const hidden = animationStyle === "slide" ? { y: 20, opacity: 0 } : { opacity: 0 };
  const variants: Variants = {
    hidden,
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: delay + i * speed, duration: 0.5 },
    }),
  };

  const words = text.split(" ");

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.p
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        aria-label={text}
      >
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
            custom={index}
            variants={variants}
            className="inline-block"
            aria-hidden="true"
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </motion.p>
    </div>
  );
};

export default AdvancedTextAnimation;
