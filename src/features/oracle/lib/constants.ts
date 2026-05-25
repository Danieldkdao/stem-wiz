import { OracleSessionModeType, OracleSessionStatusType } from "@/db/shared";
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

export const ORACLE_SESSION_STATUS_ICONS = {
  upcoming: CalendarClockIcon,
  active: CirclePlayIcon,
  completed: CircleCheckIcon,
  abandoned: ArchiveXIcon,
} satisfies Record<OracleSessionStatusType, LucideIcon>;

export const ORACLE_SESSION_MODE_ICONS = {
  guided: RouteIcon,
  debug: BugIcon,
  interview: MessagesSquareIcon,
  socratic: MessageCircleQuestionIcon,
  review: ClipboardCheckIcon,
} satisfies Record<OracleSessionModeType, LucideIcon>;
