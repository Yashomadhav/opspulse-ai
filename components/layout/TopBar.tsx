"use client";

import React from "react";
import { RefreshCw, Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { springSmooth, springBouncy } from "@/lib/motion";

interface TopBarProps {
  title: string;
  subtitle?: string;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TopBar({
  title,
  subtitle,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
}: TopBarProps) {
  const { theme, setTheme } = useTheme();

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : null;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-card/40 backdrop-blur-xl border-b border-border/50"
    >
      {/* Left: Page title */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.3, ease: "easeOut" }}
          className="text-lg font-semibold text-foreground leading-tight"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
            className="text-xs text-muted-foreground mt-0.5"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Live timestamp */}
        <AnimatePresence mode="wait">
          {formattedTime && (
            <motion.div
              key="timestamp"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springSmooth}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/40 border border-border/60 backdrop-blur-sm"
            >
              {/* Pulsing live dot */}
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={formattedTime}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs text-muted-foreground font-mono tabular-nums"
                >
                  {formattedTime}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Refresh button */}
        {onRefresh && (
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={springSmooth}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 gap-1.5 bg-card/40 backdrop-blur-sm border-border/60"
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  isRefreshing
                    ? { duration: 0.8, repeat: Infinity, ease: "linear" }
                    : { duration: 0.3 }
                }
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </motion.div>
              <span className="hidden sm:inline text-xs">
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </span>
            </Button>
          </motion.div>
        )}

        {/* Theme toggle */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={springSmooth}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 relative overflow-hidden"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={springBouncy}
                  className="absolute"
                >
                  <Moon className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={springBouncy}
                  className="absolute"
                >
                  <Sun className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Notifications */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={springSmooth}
        >
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="h-4 w-4" />
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"
            />
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
}
