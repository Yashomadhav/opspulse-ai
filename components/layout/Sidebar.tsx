"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  AlertTriangle,
  Bell,
  Lightbulb,
  FlaskConical,
  Activity,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  sidebarVariants,
  sidebarLabelVariants,
  springSmooth,
} from "@/lib/motion";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Executive overview & KPIs",
  },
  {
    href: "/shifts",
    label: "Shift Monitor",
    icon: Clock,
    description: "Live shift performance",
  },
  {
    href: "/bottlenecks",
    label: "Bottlenecks",
    icon: AlertTriangle,
    description: "Process stage analysis",
  },
  {
    href: "/alerts",
    label: "Alerts Feed",
    icon: Bell,
    description: "Live operational alerts",
    badge: true,
  },
  {
    href: "/recommendations",
    label: "Recommendations",
    icon: Lightbulb,
    description: "AI action recommendations",
  },
  {
    href: "/simulator",
    label: "Simulator",
    icon: FlaskConical,
    description: "What-if scenario analysis",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      initial={false}
      className="relative flex flex-col h-screen ops-sidebar overflow-hidden flex-shrink-0 z-10"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border min-h-[65px]">
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={springSmooth}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg cursor-pointer"
        >
          <Zap className="w-4 h-4 text-white" />
        </motion.div>

        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="logo-text"
              variants={sidebarLabelVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="text-sm font-bold text-foreground leading-tight">
                OpsPulse AI
              </p>
              <p className="text-[10px] text-muted-foreground">
                Operations Control Tower
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.p
              key="nav-label"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, ...springSmooth }}
            >
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group overflow-hidden",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                    transition={springSmooth}
                  />
                )}

                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                    transition={springSmooth}
                  />
                )}

                <motion.div
                  whileHover={{ scale: 1.15, rotate: isActive ? 0 : 5 }}
                  transition={springSmooth}
                  className="relative z-10 flex-shrink-0"
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                </motion.div>

                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      key={`label-${item.href}`}
                      variants={sidebarLabelVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="relative z-10 truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Alert badge */}
                {!collapsed && item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
                    className="relative z-10 ml-auto flex h-2 w-2 rounded-full bg-red-500"
                  >
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                  </motion.span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Status indicator */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 border-t border-border"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Activity className="w-3 h-3 text-emerald-500" />
              </motion.div>
              <span className="text-[11px] text-muted-foreground">
                Live data · 15s refresh
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={springSmooth}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={springSmooth}
        >
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </motion.div>
      </motion.button>
    </motion.aside>
  );
}
