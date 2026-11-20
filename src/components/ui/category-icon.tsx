"use client";

import {
  Briefcase,
  Car,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  PlusCircle,
  Repeat,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tag,
  TrendingUp,
  Utensils,
  type LucideProps,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  gift: Gift,
  "plus-circle": PlusCircle,
  "shopping-cart": ShoppingCart,
  home: Home,
  car: Car,
  utensils: Utensils,
  "heart-pulse": HeartPulse,
  "gamepad-2": Gamepad2,
  repeat: Repeat,
  shirt: Shirt,
  "graduation-cap": GraduationCap,
  plane: Plane,
  smartphone: Smartphone,
  "piggy-bank": PiggyBank,
  tag: Tag,
};

interface CategoryIconProps extends LucideProps {
  name: string;
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon {...props} />;
}
