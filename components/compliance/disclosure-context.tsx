"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { StickyDisclosureRail } from "@/components/compliance/sticky-disclosure-rail";
import { REFERENCE_LINKS } from "@/src/lib/references";
import type { ExplorerSource } from "@/src/lib/types";

type DisclosureState = {
  sources: ExplorerSource[];
  assumptions: string[];
  reviewDate: string;
};

type DisclosureContextValue = {
  disclosure: DisclosureState;
  setDisclosure: (next: DisclosureState) => void;
};

const DEFAULT_DISCLOSURE: DisclosureState = {
  sources: [
    {
      label: REFERENCE_LINKS.SERVICE_NSW_FHBAS.label,
      href: REFERENCE_LINKS.SERVICE_NSW_FHBAS.href,
      note: REFERENCE_LINKS.SERVICE_NSW_FHBAS.note,
    },
    {
      label: REFERENCE_LINKS.FIRSTHOME_HOME_GUARANTEE.label,
      href: REFERENCE_LINKS.FIRSTHOME_HOME_GUARANTEE.href,
      note: REFERENCE_LINKS.FIRSTHOME_HOME_GUARANTEE.note,
    },
  ],
  assumptions: [
    "Factual education and modelling only.",
    "Official criteria and current settings remain the source of truth.",
  ],
  reviewDate: "2026-03-03",
};

const DisclosureContext = createContext<DisclosureContextValue | null>(null);

export function DisclosureProvider({ children }: { children: ReactNode }) {
  const [disclosure, setDisclosure] = useState<DisclosureState>(DEFAULT_DISCLOSURE);

  const value = useMemo(
    () => ({
      disclosure,
      setDisclosure,
    }),
    [disclosure],
  );

  return (
    <DisclosureContext.Provider value={value}>
      {children}
      <StickyDisclosureRail
        sources={disclosure.sources}
        assumptions={disclosure.assumptions}
        reviewDate={disclosure.reviewDate}
      />
    </DisclosureContext.Provider>
  );
}

export function useDisclosure() {
  const context = useContext(DisclosureContext);

  if (!context) {
    throw new Error("useDisclosure must be used within DisclosureProvider");
  }

  return context;
}
