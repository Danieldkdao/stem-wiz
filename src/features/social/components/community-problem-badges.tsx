import { Badge } from "@/components/ui/badge";
import {
  CommunityProblemStatusType,
  DifficultyLevelType,
  ProgrammingLanguageType,
} from "@/db/shared";
import { getDifficultyBadge } from "@/features/oracle/lib/formatters";
import { CodeIcon } from "lucide-react";
import {
  formatCommunityProblemStatus,
  formatProgrammingLanguage,
  getVisibilityStatusIcon,
} from "../lib/formatters";

export const CommunityProblemBadges = ({
  difficultyLevel,
  programmingLanguage,
  status,
}: {
  difficultyLevel: DifficultyLevelType;
  programmingLanguage: ProgrammingLanguageType;
  status: CommunityProblemStatusType;
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {getDifficultyBadge(difficultyLevel)}
      <Badge variant="secondary">
        <CodeIcon />
        {formatProgrammingLanguage(programmingLanguage)}
      </Badge>
      <Badge>
        {getVisibilityStatusIcon(status)}
        {formatCommunityProblemStatus(status).label}
      </Badge>
    </div>
  );
};
