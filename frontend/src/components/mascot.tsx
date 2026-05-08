import { useState, useCallback } from 'react'
import {
  motion,
  AnimatePresence,
  useAnimation,
  type Variants,
} from 'framer-motion'

const MASCOTS = [
  'broccoli', 'cauldron', 'cheese', 'icecream',
  'knightpan', 'pepper', 'slime', 'stove',
] as const

type MascotName = typeof MASCOTS[number] | (string & {})
type Mood = 'happy' | 'neutral' | 'sad'
type Animation = 'idle' | 'bounce' | 'pop' | 'celebrate' | 'shake' | 'none'

interface MascotProps {
  name?: MascotName
  mood?: Mood
  size?: number
  message?: string
  animation?: Animation
  className?: string
  random?: boolean
  interactive?: boolean
  delay?: number
  customImageUrls?: {
    happy?: string
    neutral?: string
    sad?: string
  }
}

// --- Framer Motion Variants ---
const entranceVariants: Variants = {
  hidden: { opacity: 0, scale: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 15, delay: delay / 1000 },
  }),
}

const idleVariants: Variants = {
  idle: {
    y: [0, -5, 0],
    scaleY: [1, 1.02, 1],
    scaleX: [1, 0.98, 1],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
}

const bounceVariants: Variants = {
  idle: {
    y: [0, -18, 0, -6, 0],
    scaleX: [1, 0.9, 1.1, 0.95, 1],
    scaleY: [1, 1.12, 0.88, 1.04, 1],
    transition: { duration: 1.6, repeat: Infinity, repeatDelay: 1.5, ease: [0.36, 0, 0.66, -0.56] },
  },
}

const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -12 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: [0, 1.2, 0.9, 1.05, 1],
    rotate: [-12, 5, -3, 1, 0],
    transition: { duration: 0.7, delay: delay / 1000, ease: 'easeOut' },
  }),
}

const celebrateVariants: Variants = {
  idle: {
    y: [0, -25, 0],
    rotate: [0, -10, 10, -5, 0],
    scaleX: [1, 0.85, 1.15, 0.95, 1],
    scaleY: [1, 1.15, 0.85, 1.05, 1],
    transition: { duration: 1.2, repeat: Infinity, repeatDelay: 2 },
  },
}

const shakeVariants: Variants = {
  idle: {
    x: [0, -6, 6, -4, 4, -2, 0],
    rotate: [0, -3, 3, -2, 2, -1, 0],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 3 },
  },
}

const tapReaction = {
  scale: [1, 0.8, 1.15, 0.95, 1],
  y: [0, 8, -12, 2, 0],
  rotate: [0, 0, -8, 4, 0],
  transition: { duration: 0.5, ease: 'easeOut' as const },
}

const bubbleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20, delay: 0.3 },
  },
}

export default function Mascot({
  name,
  mood = 'happy',
  size = 120,
  message,
  animation = 'idle',
  className = '',
  random = false,
  interactive = true,
  delay = 0,
  customImageUrls,
}: MascotProps) {
  const [randomName] = useState<MascotName>(() => 
    MASCOTS[Math.floor(Math.random() * MASCOTS.length)]
  );
  
  const mascotName = name || (random ? randomName : 'broccoli');

  const [interactionMood, setInteractionMood] = useState<Mood | null>(null);
  const currentMood = interactionMood || mood;

  const controls = useAnimation();

  const handleTap = useCallback(async () => {
    if (!interactive) return;
    await controls.start(tapReaction);
    
    setInteractionMood('happy');
    setTimeout(() => setInteractionMood(null), 800);
  }, [interactive, controls]);

  const getSrc = (moodName: Mood) => {
    if (customImageUrls) {
      if (moodName === 'happy' && customImageUrls.happy) return customImageUrls.happy;
      if (moodName === 'sad' && customImageUrls.sad) return customImageUrls.sad;
      if (customImageUrls.neutral) return customImageUrls.neutral;
    }
    return `/mascots/${mascotName}_${moodName}.png`;
  };

  const src = getSrc(currentMood);

  const getAnimationVariant = () => {
    switch (animation) {
      case 'bounce': return bounceVariants
      case 'celebrate': return celebrateVariants
      case 'shake': return shakeVariants
      case 'pop': return idleVariants 
      case 'idle': return idleVariants
      default: return undefined
    }
  }

  const getEntranceVariant = () => {
    if (animation === 'pop') return popVariants
    return entranceVariants
  }

  const animVariant = getAnimationVariant()

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.div
        custom={delay}
        variants={getEntranceVariant()}
        initial="hidden"
        animate="visible"
        style={{ originY: 1 }} 
      >
        <motion.div
          variants={animVariant}
          animate={animation !== 'none' ? 'idle' : undefined}
          onTap={handleTap}
          whileHover={interactive ? { scale: 1.08, transition: { duration: 0.2 } } : undefined}
          style={{ cursor: interactive ? 'pointer' : 'default', originY: 1 }}
        >
          <motion.div animate={controls}>
            <img
              src={src}
              alt={`${mascotName} mascot`}
              width={size}
              height={size}
              className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] select-none pointer-events-none"
              draggable={false}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            variants={bubbleVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative bg-[#222240] border border-white/10 rounded-2xl px-4 py-2.5 max-w-[250px] text-center"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#222240] border-l border-t border-white/10 rotate-45" />
            <p className="text-sm text-gray-200 relative z-10 font-medium">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MascotStatic({
  name = 'broccoli',
  mood = 'happy',
  size = 120,
  message,
  className = '',
  customImageUrls,
}: Omit<MascotProps, 'animation' | 'random' | 'interactive' | 'delay'>) {
  const getSrc = (moodName: Mood) => {
    if (customImageUrls) {
      if (moodName === 'happy' && customImageUrls.happy) return customImageUrls.happy;
      if (moodName === 'sad' && customImageUrls.sad) return customImageUrls.sad;
      if (customImageUrls.neutral) return customImageUrls.neutral;
    }
    return `/mascots/${name}_${moodName}.png`;
  };

  const src = getSrc(mood);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="animate-float">
        <img
          src={src}
          alt={`${name} mascot`}
          width={size}
          height={size}
          className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        />
      </div>
      {message && (
        <div className="relative bg-[#222240] border border-white/10 rounded-2xl px-4 py-2.5 max-w-[250px] text-center animate-slide-up">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#222240] border-l border-t border-white/10 rotate-45" />
          <p className="text-sm text-gray-200 relative z-10 font-medium">{message}</p>
        </div>
      )}
    </div>
  )
}