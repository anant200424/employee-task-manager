"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

export type RevealAnimation =
  | "fade"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale";

interface ScrollRevealProps {
  children: ReactNode;
  animation?: RevealAnimation;
  delay?: number; // ms
  duration?: number; // ms
  threshold?: number; // 0 to 1
  className?: string;
  once?: boolean;
}

export const ScrollReveal = ({
  children,
  animation = "slide-up",
  delay = 0,
  duration = 550,
  threshold = 0.12,
  className = "",
  once = true,
}: ScrollRevealProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = domRef.current;
    if (!el) return;

    // If browser doesn't support IntersectionObserver, reveal immediately
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold, once]);

  // Base and active CSS transforms
  const getTransformStyles = (): { initial: string; active: string } => {
    switch (animation) {
      case "fade":
        return { initial: "opacity-0", active: "opacity-100" };
      case "slide-up":
        return {
          initial: "opacity-0 translate-y-6",
          active: "opacity-100 translate-y-0",
        };
      case "slide-down":
        return {
          initial: "opacity-0 -translate-y-6",
          active: "opacity-100 translate-y-0",
        };
      case "slide-left":
        return {
          initial: "opacity-0 translate-x-6",
          active: "opacity-100 translate-x-0",
        };
      case "slide-right":
        return {
          initial: "opacity-0 -translate-x-6",
          active: "opacity-100 translate-x-0",
        };
      case "scale":
        return {
          initial: "opacity-0 scale-95",
          active: "opacity-100 scale-100",
        };
      default:
        return {
          initial: "opacity-0 translate-y-6",
          active: "opacity-100 translate-y-0",
        };
    }
  };

  const { initial, active } = getTransformStyles();

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`transition-all ${isVisible ? active : initial} ${className}`}
    >
      {children}
    </div>
  );
};
