import { buttonVariants } from "@/components/ui/button";
import { OracleSessionModeType, OracleSessionStatusType } from "@/db/shared";
import { VariantProps } from "class-variance-authority";
import {
  ArchiveXIcon,
  BugIcon,
  CalendarClockIcon,
  CircleCheckIcon,
  CirclePlayIcon,
  ClipboardCheckIcon,
  LucideIcon,
  MessageCircleQuestionIcon,
  MessagesSquareIcon,
  RouteIcon,
} from "lucide-react";

export const ORACLE_SESSION_STATE = {
  upcoming: {
    icon: CalendarClockIcon,
    buttonVariant: "default",
    buttonText: "Start session",
    isDisabled: false,
    href: (sessionId) => `/oracle/sessions/${sessionId}/waiting`,
  },
  active: {
    icon: CirclePlayIcon,
    buttonVariant: "default",
    buttonText: "Resume session",
    isDisabled: false,
    href: (sessionId) => `/oracle/sessions/${sessionId}`,
  },
  completed: {
    icon: CircleCheckIcon,
    buttonVariant: "ghost",
    buttonText: "Session completed",
    isDisabled: true,
    href: null,
  },
  abandoned: {
    icon: ArchiveXIcon,
    buttonVariant: "outline",
    buttonText: "Session abandoned",
    isDisabled: true,
    href: null,
  },
} satisfies Record<
  OracleSessionStatusType,
  {
    icon: LucideIcon;
    buttonVariant: VariantProps<typeof buttonVariants>["variant"];
    buttonText: string;
    isDisabled: boolean;
    href: ((sessionId?: string) => string) | null;
  }
>;

export const ORACLE_SESSION_MODE_ICONS = {
  guided: RouteIcon,
  debug: BugIcon,
  interview: MessagesSquareIcon,
  socratic: MessageCircleQuestionIcon,
  review: ClipboardCheckIcon,
} satisfies Record<OracleSessionModeType, LucideIcon>;
