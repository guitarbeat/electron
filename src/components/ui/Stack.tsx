import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import "./Stack.css";

export interface StackItem {
  id: string;
  content: React.ReactNode;
}

export interface StackAnimationConfig {
  stiffness: number;
  damping: number;
}

export interface StackProps {
  items: StackItem[];
  randomRotation?: boolean;
  sensitivity?: number;
  sendToBackOnClick?: boolean;
  animationConfig?: StackAnimationConfig;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  mobileClickOnly?: boolean;
  mobileBreakpoint?: number;
  className?: string;
  themed?: boolean;
  onTopItemChange?: (id: string) => void;
}

interface StackCard {
  id: string;
  content: React.ReactNode;
}

interface CardRotateProps {
  children: React.ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
  disableDrag?: boolean;
}

function CardRotate({
  children,
  onSendToBack,
  sensitivity,
  disableDrag = false,
}: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [24, -24]);
  const rotateY = useTransform(x, [-100, 100], [-24, 24]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (
      Math.abs(info.offset.x) > sensitivity ||
      Math.abs(info.offset.y) > sensitivity
    ) {
      x.set(0);
      y.set(0);
      onSendToBack();
      return;
    }

    x.set(0);
    y.set(0);
  };

  if (disableDrag) {
    return (
      <motion.div className="card-rotate-disabled" style={{ x: 0, y: 0 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="card-rotate"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.55}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

const DEFAULT_ANIMATION: StackAnimationConfig = {
  stiffness: 260,
  damping: 20,
};

const Stack: React.FC<StackProps> = ({
  items,
  randomRotation = false,
  sensitivity = 200,
  sendToBackOnClick = false,
  animationConfig = DEFAULT_ANIMATION,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  className = "",
  themed = true,
  onTopItemChange,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const rotationByIdRef = useRef(new Map<string, number>());

  const [stack, setStack] = useState<StackCard[]>(() =>
    items.map((item) => ({ id: item.id, content: item.content })),
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  useEffect(() => {
    setStack((prev) => {
      if (items.length === 0) return [];

      // ⚡ Bolt Optimization:
      // Replaced multi-pass chained array methods (.map().filter().map())
      // with a single O(N) loop to reduce memory allocations and improve iteration time
      const itemById = new Map(items.map((item) => [item.id, item]));
      const preserved: StackCard[] = [];
      const preservedIds = new Set<string>();

      for (const card of prev) {
        const item = itemById.get(card.id);
        if (item) {
          preserved.push({ id: card.id, content: item.content });
          preservedIds.add(card.id);
        }
      }

      const added: StackCard[] = [];
      for (const item of items) {
        if (!preservedIds.has(item.id)) {
          added.push({ id: item.id, content: item.content });
        }
      }

      if (preserved.length === 0 && added.length > 0) {
        return added;
      }

      return [...added, ...preserved];
    });
  }, [items]);

  const shouldDisableDrag = mobileClickOnly && isMobile;
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

  const sendToBack = useCallback(
    (id: string) => {
      setStack((prev) => {
        const next = [...prev];
        const index = next.findIndex((card) => card.id === id);
        if (index < 0) return prev;

        const [card] = next.splice(index, 1);
        next.unshift(card);
        onTopItemChange?.(next[next.length - 1]?.id ?? id);
        return next;
      });
    },
    [onTopItemChange],
  );

  const handleCardClick = useCallback(
    (event: React.MouseEvent, id: string) => {
      if (!shouldEnableClick) return;

      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, textarea, [role='button']")) {
        return;
      }

      sendToBack(id);
    },
    [sendToBack, shouldEnableClick],
  );

  useEffect(() => {
    if (!onTopItemChange || stack.length === 0) return;
    onTopItemChange(stack[stack.length - 1].id);
  }, [onTopItemChange, stack]);

  useEffect(() => {
    if (!autoplay || stack.length <= 1 || isPaused) return;

    const interval = window.setInterval(() => {
      const topCardId = stack[stack.length - 1]?.id;
      if (topCardId) sendToBack(topCardId);
    }, autoplayDelay);

    return () => window.clearInterval(interval);
  }, [autoplay, autoplayDelay, isPaused, sendToBack, stack]);

  const getRotation = useCallback(
    (id: string) => {
      if (!randomRotation) return 0;

      const rotations = rotationByIdRef.current;
      if (!rotations.has(id)) {
        rotations.set(id, Math.random() * 10 - 5);
      }
      return rotations.get(id) ?? 0;
    },
    [randomRotation],
  );

  const containerClassName = useMemo(
    () =>
      ["stack-container", themed ? "stack-container--themed" : "", className]
        .filter(Boolean)
        .join(" "),
    [className, themed],
  );

  if (stack.length === 0) return null;

  return (
    <div
      className={containerClassName}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => {
        const depth = stack.length - index - 1;
        const randomRotate = getRotation(card.id);

        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag || depth > 0}
          >
            <motion.div
              className="stack-card"
              onClick={(event) => handleCardClick(event, card.id)}
              animate={{
                rotateZ: depth * 4 + randomRotate,
                scale: 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: "90% 90%",
              }}
              initial={false}
              transition={{
                type: "spring",
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping,
              }}
              style={{ zIndex: index + 1 }}
            >
              {card.content}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
};

export default Stack;
