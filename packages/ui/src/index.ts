import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

const notionColourMap = {
  default: { bg: "bg-gray-200", text: "text-gray-800", ring: "ring-gray-300" },
  gray: { bg: "bg-gray-200", text: "text-gray-800", ring: "ring-gray-300" },
  brown: { bg: "bg-amber-200", text: "text-amber-800", ring: "ring-amber-300" },
  orange: {
    bg: "bg-orange-200",
    text: "text-orange-800",
    ring: "ring-orange-300",
  },
  yellow: {
    bg: "bg-yellow-200",
    text: "text-yellow-800",
    ring: "ring-yellow-300",
  },
  green: { bg: "bg-green-200", text: "text-green-800", ring: "ring-green-300" },
  blue: { bg: "bg-blue-200", text: "text-blue-800", ring: "ring-blue-300" },
  purple: {
    bg: "bg-purple-200",
    text: "text-purple-800",
    ring: "ring-purple-300",
  },
  pink: { bg: "bg-pink-200", text: "text-pink-800", ring: "ring-pink-300" },
  red: { bg: "bg-red-200", text: "text-red-800", ring: "ring-red-300" },
} as const;

export { cn, notionColourMap };
