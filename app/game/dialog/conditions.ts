// app/dialog/conditions.ts
import type { DialogConditionContext } from "../../components/DialogContext";

// ✅ Check if the player has a specific inventory item
export function hasItem(id: string) {
  return (ctx: DialogConditionContext) =>
    Array.isArray(ctx.inventory) &&
    ctx.inventory.some((item: any) => item.id === id);
}

// ✅ Check if a loop-state flag equals a given value
export function flagEquals<T = any>(flagName: string, value: T) {
  return (ctx: DialogConditionContext) =>
    ctx.flags && ctx.flags[flagName] === value;
}

// ✅ Check if current time is within [fromMinutes, toMinutes)
export function timeBetweenMinutes(fromMinutes: number, toMinutes: number) {
  return (ctx: DialogConditionContext) =>
    ctx.timeMinutes >= fromMinutes && ctx.timeMinutes < toMinutes;
}

// ✅ Convenience: check between hours (whole hours only)
// e.g. timeBetweenHours(12, 13) → 12:00–12:59
export function timeBetweenHours(fromHour: number, toHour: number) {
  const from = fromHour * 60;
  const to = toHour * 60;
  return timeBetweenMinutes(from, to);
}
