import { buttonVariants } from "@/components/ui/button";
import { OracleSessionModeType, OracleSessionStatusType } from "@/db/shared";
import { VariantProps } from "class-variance-authority";
import {
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
    buttonVariant: "outline",
    buttonText: "View summary",
    isDisabled: false,
    href: (sessionId) => `/oracle/sessions/${sessionId}/summary`,
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
