import {
  BedDouble, CookingPot, ShowerHead, Waves, WashingMachine, Sparkles, Sofa,
  Car, Trash2, Trees, UtensilsCrossed, BookOpen, Target, DoorOpen, Shirt,
  Flame, PawPrint, PenLine, SprayCan, Sprout, Boxes, GlassWater, Dumbbell,
  type LucideIcon,
} from "lucide-react";
export function missionIcon(text: string): LucideIcon {
  const t = (text || "").toLowerCase();
  if (/cama|habitaci|dormitor|base/.test(t)) return BedDouble;
  if (/cocina|conquista la cocina/.test(t)) return CookingPot;
  if (/cena|comida|fog|utensil/.test(t)) return UtensilsCrossed;
  if (/ba(ñ|n)o|ducha/.test(t)) return ShowerHead;
  if (/piscina|agua|ola/.test(t)) return Waves;
  if (/lavander|lavadora|colada|ropa/.test(t)) return WashingMachine;
  if (/cristal|ventana|espejo/.test(t)) return Sparkles;
  if (/sal(ó|o)n|sofa|sofá/.test(t)) return Sofa;
  if (/coche|garaje|car/.test(t)) return Car;
  if (/basura|reciclaj/.test(t)) return Trash2;
  if (/jard|c(é|e)sped|terraza|patio/.test(t)) return Trees;
  if (/puerta|entrada|escaler/.test(t)) return DoorOpen;
  if (/plancha|doblar|camis/.test(t)) return Shirt;
  if (/barbacoa|parrilla|brasa/.test(t)) return Flame;
  if (/mascota|perro|gato|pez|animal|pasear/.test(t)) return PawPrint;
  if (/deber|colegio|escuela|examen|repas/.test(t)) return PenLine;
  if (/fregar|fregona|limpi|aspir|barrer|polvo|mopa/.test(t)) return SprayCan;
  if (/regar|planta|maceta|huerto|flor/.test(t)) return Sprout;
  if (/s(ó|o)tano|trastero|garaje|caja|ordenar|guardar/.test(t)) return Boxes;
  if (/vaso|bebida|hidrat|beber/.test(t)) return GlassWater;
  if (/deporte|ejercicio|gimnas|entren|correr|pesas/.test(t)) return Dumbbell;
  if (/estudi|matem|lengua|hist|ingl|cienc|geograf/.test(t)) return BookOpen;
  return Target;
}

import {
  Brain, Star, Medal, Timer, Crown, Award,
  Cat, Dog, Rabbit, Bird, Fish, Ghost, Rocket, Gamepad2, Bot, Origami,
} from "lucide-react";

const BADGE_ICONS: Record<string, LucideIcon> = {
  target: Target, flame: Flame, brain: Brain, star: Star,
  sparkles: Sparkles, medal: Medal, timer: Timer, crown: Crown,
};
export const badgeIcon = (key: string): LucideIcon => BADGE_ICONS[key] || Award;

export type AvatarDef = { key: string; Icon: LucideIcon; level: number; name: string };
export const AVATARS: AvatarDef[] = [
  { key: "cat", Icon: Cat, level: 1, name: "Gato" },
  { key: "dog", Icon: Dog, level: 1, name: "Perro" },
  { key: "rabbit", Icon: Rabbit, level: 2, name: "Conejo" },
  { key: "bird", Icon: Bird, level: 3, name: "Pájaro" },
  { key: "fish", Icon: Fish, level: 4, name: "Pez" },
  { key: "ghost", Icon: Ghost, level: 5, name: "Fantasma" },
  { key: "origami", Icon: Origami, level: 6, name: "Origami" },
  { key: "bot", Icon: Bot, level: 7, name: "Robot" },
  { key: "rocket", Icon: Rocket, level: 8, name: "Cohete" },
  { key: "gamepad", Icon: Gamepad2, level: 10, name: "Gamer" },
  { key: "crown", Icon: Crown, level: 12, name: "Corona" },
];
export const avatarIcon = (key: string): LucideIcon | null => AVATARS.find((a) => a.key === key)?.Icon || null;
