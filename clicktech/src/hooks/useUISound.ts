"use client";

import { useCallback } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { triggerSound } from "@/lib/ui/sound-engine";

export function useUISound() {
  const { soundEnabled, toggleSound, playSound } = useStore();

  const playClick = useCallback(() => {
    if (playSound) {
      playSound("click");
    } else {
      triggerSound("click");
    }
  }, [playSound]);

  const playHover = useCallback(() => {
    if (playSound) {
      playSound("hover");
    } else {
      triggerSound("hover");
    }
  }, [playSound]);

  const playTransition = useCallback(() => {
    if (playSound) {
      playSound("transition");
    } else {
      triggerSound("transition");
    }
  }, [playSound]);

  const playSuccess = useCallback(() => {
    if (playSound) {
      playSound("success");
    } else {
      triggerSound("success");
    }
  }, [playSound]);

  const playError = useCallback(() => {
    if (playSound) {
      playSound("error");
    } else {
      triggerSound("error");
    }
  }, [playSound]);

  return {
    enabled: soundEnabled,
    toggleSound,
    playClick,
    playHover,
    playTransition,
    playSuccess,
    playError,
  };
}
