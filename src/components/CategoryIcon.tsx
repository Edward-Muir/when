import React from 'react';
import {
  Crown,
  Flame,
  Building2,
  PenTool,
  Lightbulb,
  User,
  Radio,
  Hammer,
  Handshake,
  CloudLightning,
  ShoppingCart,
  Scale,
  Wheat,
  Swords,
  FlaskConical,
  Ship,
  Footprints,
  Palette,
  Stethoscope,
  Leaf,
  Landmark,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { Category } from '../types';

// One icon per category (lucide-react). Rendered as a faint watermark behind event art.
const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  empires: Crown,
  revolution: Flame,
  architecture: Building2,
  writing: PenTool,
  invention: Lightbulb,
  figures: User,
  media: Radio,
  craft: Hammer,
  diplomacy: Handshake,
  disasters: CloudLightning,
  commerce: ShoppingCart,
  law: Scale,
  agriculture: Wheat,
  warfare: Swords,
  science: FlaskConical,
  trade: Ship,
  migration: Footprints,
  art: Palette,
  medicine: Stethoscope,
  nature: Leaf,
  sports: Trophy,
};

interface CategoryIconProps {
  category: Category;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className = '' }) => {
  // Fallback to a neutral icon for any value not in the map (e.g. a stray legacy category).
  // eslint-disable-next-line security/detect-object-injection -- category is a typed union key
  const Icon = CATEGORY_ICONS[category] ?? Landmark;
  return <Icon className={`opacity-30 ${className}`.trim()} aria-hidden />;
};

export default CategoryIcon;
