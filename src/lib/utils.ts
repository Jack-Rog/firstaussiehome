import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type Frequency = "weekly" | "monthly" | "annually";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyInput(value: number) {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseMoneyInput(value: string) {
  const digits = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function annualiseAmount(value: number, frequency: Frequency) {
  if (frequency === "weekly") {
    return value * 52;
  }

  if (frequency === "monthly") {
    return value * 12;
  }

  return value;
}

export function monthlyiseAmount(value: number, frequency: Frequency) {
  if (frequency === "weekly") {
    return (value * 52) / 12;
  }

  if (frequency === "annually") {
    return value / 12;
  }

  return value;
}

export function fromAnnualAmount(value: number, frequency: Frequency) {
  if (frequency === "weekly") {
    return value / 52;
  }

  if (frequency === "monthly") {
    return value / 12;
  }

  return value;
}

export function fromMonthlyAmount(value: number, frequency: Frequency) {
  if (frequency === "weekly") {
    return (value * 12) / 52;
  }

  if (frequency === "annually") {
    return value * 12;
  }

  return value;
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function safeNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
