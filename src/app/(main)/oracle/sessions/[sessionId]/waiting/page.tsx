import { LinkButton } from "@/components/link-button";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getOneSessionAction } from "@/features/oracle/actions/actions";
import { CreateUpdateSessionDialog } from "@/features/oracle/components/create-update-session-dialog";
import { OracleSessionNotFound } from "@/features/oracle/components/oracle-session-not-found";
import { SessionActionButton } from "@/features/oracle/components/session-action-button";
import {
  ORACLE_SESSION_MODE_ICONS,
  ORACLE_SESSION_STATE,
} from "@/features/oracle/lib/constants";
import {
  formatOptionalSessionDate,
  formatOracleSessionMode,
  formatOracleSessionStatus,
  formatProblemCount,
  formatDate,
  formatSessionDuration,
} from "@/features/oracle/lib/formatters";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { getCurrentUser } from "@/lib/auth/helpers";
import { ParamsId } from "@/lib/types";
import {
  ArrowLeftIcon,
  CalendarPlusIcon,
  ClockIcon,
  Code2Icon,
  EditIcon,
  FileTextIcon,
  InfoIcon,
  ListChecksIcon,
  NotebookTextIcon,
  SparklesIcon,
  TimerIcon,
} from "lucide-react";
import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";

type SessionWaitingProps = ParamsId<"sessionId">;

const SessionWaitingPage = (props: SessionWaitingProps) => {
  return (
    <div className="h-full w-full overflow-y-auto px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <LinkButton variant="ghost" className="w-fit" href="/oracle/sessions">
          <ArrowLeftIcon />
          Sessions
        </LinkButton>
        <Suspense fallback={<SessionWaitingLoading />}>
          <SessionWaitingSuspense {...props} />
        </Suspense>
      </div>
    </div>
  );
};

const SessionWaitingLoading = () => {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <Separator />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

const SessionWaitingSuspense = async ({ params }: SessionWaitingProps) => {
  const { sessionId } = await params;
  const { userId } = await getCurrentUser();

  if (!userId) {
    return (
      <SessionWaitingNotice
        title="Sign in required"
        description="You need to be signed in before you can view this Oracle session."
      />
    );
  }

  const existingSession = await getOneSessionAction(userId, sessionId);

  if (!existingSession) {
    return <OracleSessionNotFound />;
  }

  if (existingSession.status === "active")
    return redirect(`/oracle/sessions/${sessionId}`);
  if (existingSession.status !== "upcoming")
    return redirect("/oracle/sessions");

  const statusState = ORACLE_SESSION_STATE[existingSession.status];
  const StatusIcon = statusState.icon;
  const ModeIcon = ORACLE_SESSION_MODE_ICONS[existingSession.mode];
  const statusLabel = formatOracleSessionStatus(existingSession.status);
  const modeLabel = formatOracleSessionMode(existingSession.mode);
  const languageLabel = formatProgrammingLanguage(
    existingSession.programmingLanguage,
  );
  const sessionDuration = formatSessionDuration(existingSession);

  return (
    <section className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)]">
        <div className="flex min-w-0 flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-start gap-2 flex-wrap justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <StatusIcon />
                  {statusLabel}
                </Badge>
                <Badge variant="outline">
                  <ModeIcon />
                  {modeLabel} mode
                </Badge>
                <Badge variant="outline">
                  <Code2Icon />
                  {languageLabel}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                  {existingSession.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  {existingSession.description ||
                    "No description provided for this session."}
                </p>
              </div>
            </div>
            <TooltipWrapper content="Edit session configuration">
              <CreateUpdateSessionDialog
                useButton
                buttonChildren={<EditIcon />}
                existingSession={existingSession}
                variant="ghost"
                size="icon"
              />
            </TooltipWrapper>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <SessionInfoRow
              icon={<ModeIcon />}
              label="Mode"
              value={modeLabel}
            />
            <SessionInfoRow
              icon={<ListChecksIcon />}
              label="Problems"
              value={formatProblemCount(existingSession.numberOfProblems)}
            />
            <SessionInfoRow
              icon={<Code2Icon />}
              label="Language"
              value={languageLabel}
            />
            <SessionInfoRow
              icon={<ClockIcon />}
              label="Status"
              value={formatOracleSessionStatus(existingSession.status)}
            />
            <SessionInfoRow
              icon={<TimerIcon />}
              label="Time spent"
              value={sessionDuration}
            />
            <SessionInfoRow
              icon={<CalendarPlusIcon />}
              label="Created"
              value={formatDate(existingSession.createdAt)}
            />
            <SessionInfoRow
              icon={<SparklesIcon />}
              label="Updated"
              value={formatDate(existingSession.updatedAt)}
            />
            <SessionInfoRow
              icon={<ClockIcon />}
              label="Started"
              value={formatOptionalSessionDate(
                existingSession.startedAt,
                "Not started",
              )}
            />
          </div>

          <div className="rounded-lg border bg-background/60 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md border bg-muted p-2 text-muted-foreground">
                <NotebookTextIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">Additional instructions</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {existingSession.additionalInstructions ||
                    "No additional instructions were added for this session."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="border-t bg-muted/25 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="flex h-full flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <InfoIcon className="size-4" />
                Waiting room
              </div>
              <h2 className="text-2xl font-semibold">Ready when you are</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Review and edit the setup before starting. The Oracle will use
                this information to shape the session.
              </p>
            </div>

            <div className="flex flex-col divide-y rounded-lg border bg-background/70">
              <SessionChecklistItem>
                {formatProblemCount(existingSession.numberOfProblems)} queued
                for practice.
              </SessionChecklistItem>
              <SessionChecklistItem>
                Responses will follow {modeLabel.toLowerCase()} mode.
              </SessionChecklistItem>
              <SessionChecklistItem>
                Code examples and prompts will use {languageLabel}.
              </SessionChecklistItem>
              <SessionChecklistItem>
                Progress is tied to this session and can be resumed later.
              </SessionChecklistItem>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <SessionActionButton
                sessionId={existingSession.id}
                status={existingSession.status}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

const SessionInfoRow = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-background/60 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&>svg]:size-4">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
};

const SessionChecklistItem = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex gap-3 p-3 text-sm leading-6">
      <FileTextIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
      <span>{children}</span>
    </div>
  );
};

const SessionWaitingNotice = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        {description}
      </p>
      <LinkButton variant="outline" className="mt-6" href="/oracle/sessions">
        <ArrowLeftIcon />
        Back to sessions
      </LinkButton>
    </div>
  );
};

export default SessionWaitingPage;
