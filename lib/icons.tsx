import {
  BedDouble, CookingPot, ShowerHead, Waves, WashingMachine, Sparkles, Sofa,
  Car, Trash2, Trees, UtensilsCrossed, BookOpen, Target, DoorOpen, Shirt,
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
  if (/estudi|matem|lengua|hist|ingl/.test(t)) return BookOpen;
  return Target;
}
