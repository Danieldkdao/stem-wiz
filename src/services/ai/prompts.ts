import type {
  ArenaProblemTable,
  MatchSubmissionTable,
  OracleSessionTable,
  UserMatchTable,
} from "@/db/schema";
import { OracleSessionModeType, ProgrammingLanguageType } from "@/db/shared";

type ArenaProblem = typeof ArenaProblemTable.$inferSelect;
type MatchSubmission = typeof MatchSubmissionTable.$inferSelect;
type OracleSession = typeof OracleSessionTable.$inferSelect;
type UserMatch = typeof UserMatchTable.$inferSelect;

type GenerateMatchResultsPromptArgs = {
  arenaProblem: ArenaProblem;
  users: UserMatch[];
  submissions: MatchSubmission[];
};

const formatProgrammingLanguageForPrompt = (
  language: ProgrammingLanguageType,
) => {
  switch (language) {
    case "cpp":
      return "C++";
    case "java":
      return "Java";
    case "javascript":
      return "JavaScript";
    case "python":
      return "Python";
    case "typescript":
      return "TypeScript";
    default:
      throw new Error(`Unknown language: ${language satisfies never}`);
  }
};

const formatOracleSessionModeForPrompt = (mode: OracleSessionModeType) => {
  switch (mode) {
    case "debug":
      return "Debug";
    case "guided":
      return "Guided";
    case "interview":
      return "Interview";
    case "review":
      return "Review";
    case "socratic":
      return "Socratic";
    default:
      throw new Error(`Unknown session mode: ${mode satisfies never}`);
  }
};

const getOracleSessionModeGuidance = (mode: OracleSessionModeType) => {
  switch (mode) {
    case "debug":
      return "Create problems where the user must reason about bugs, broken logic, edge cases, or flawed implementations. Starter code may include intentionally incomplete or incorrect code only when the description clearly asks the user to fix it.";
    case "guided":
      return "Create approachable learning problems with clear scaffolding, helpful constraints, and a natural progression from understanding the task to implementing the solution.";
    case "interview":
      return "Create polished technical-interview problems focused on algorithms, data structures, tradeoffs, edge cases, and clear complexity expectations.";
    case "review":
      return "Create problems that reward clean implementation, maintainable design, careful refactoring, or improving an existing approach while still having objectively checkable behavior.";
    case "socratic":
      return "Create problems that encourage step-by-step reasoning. The statement should invite the user to discover invariants, examples, and edge cases without giving away the solution.";
    default:
      throw new Error(`Unknown session mode: ${mode satisfies never}`);
  }
};

const getDifficultyPlan = (problemCount: number) => {
  if (problemCount <= 1) return "Generate 1 medium problem.";
  if (problemCount === 2) return "Generate 1 easy problem and 1 medium problem.";
  if (problemCount === 3)
    return "Generate 1 easy problem and 2 medium problems.";
  if (problemCount === 4)
    return "Generate 1 easy problem, 2 medium problems, and 1 hard problem.";

  return "Generate 1 easy problem, 3 medium problems, and 1 hard problem.";
};

export const GENERATE_ORACLE_PROBLEMS_SYSTEM = `
You are an expert programming coach and problem author for an interactive coding practice product called Oracle.
Your job is to generate original, high-quality coding problems for one user session.

Follow these rules exactly:
- Generate the exact number of problems requested by the user prompt.
- Every problem must use the requested programming language for starter code, examples, terminology, and any implementation details.
- Every problem must be unique. Do not duplicate the same core algorithm, data structure, story, input shape, or required insight across problems in the same session.
- Problems must be appropriate for the session mode, title, description, and additional instructions.
- Additional instructions from the user are important and should be followed whenever possible, but they must not override the exact problem count, the requested language, the required output schema, or the need for original coding problems.
- Do not create trivia questions, essay questions, broad system-design prompts, UI tasks, database tasks, networking tasks, or problems that require external services, files, internet access, packages, hidden datasets, or non-deterministic behavior.
- Avoid well-known copied problems and branded examples. The problems should feel original even when they test common concepts.
- Keep each problem self-contained and solvable from the statement alone.
- Make examples small enough to inspect manually, but include enough edge cases to remove ambiguity.
- Prefer practical constraints that make the intended approach clear without requiring excessive boilerplate.

Each generated problem must include:
- A concise title that does not reveal the solution.
- A detailed markdown description with a clear task, input expectations, output expectations, at least two examples, constraints, and edge cases or clarifying notes.
- An appropriate difficulty: easy, medium, or hard.
- Starter code in the requested language that is idiomatic, minimal, syntactically plausible, and gives the user a clear place to implement the solution without solving it for them.
- A solution outline that explains the intended approach, why it works, key edge cases, and expected time and space complexity.
- A short concepts list with non-duplicative labels such as "Arrays", "Hash Map", "Two Pointers", "Recursion", or "Graphs".

Return only data that matches the requested structured output. Do not include prose outside the structured response.
`.trim();

export const generateOracleProblemsPrompt = (session: OracleSession) => {
  const languageLabel = formatProgrammingLanguageForPrompt(
    session.programmingLanguage,
  );
  const modeLabel = formatOracleSessionModeForPrompt(session.mode);
  const additionalInstructions = session.additionalInstructions?.trim();
  const description = session.description?.trim();

  return `
Generate coding problems for the following Oracle session.

Session details:
- Title: ${session.title}
- Description: ${description || "No session description was provided."}
- Programming language: ${languageLabel} (${session.programmingLanguage})
- Session mode: ${modeLabel}
- Number of problems to generate: ${session.numberOfProblems}
- Difficulty plan: ${getDifficultyPlan(session.numberOfProblems)}
- Additional instructions: ${
    additionalInstructions || "No additional instructions were provided."
  }

Mode guidance:
${getOracleSessionModeGuidance(session.mode)}

Quality requirements:
- Generate exactly ${session.numberOfProblems} ${
    session.numberOfProblems === 1 ? "problem" : "problems"
  }, no more and no fewer.
- Make the set cohesive for the session theme, but ensure each problem has a distinct concept focus and distinct solution strategy.
- If the additional instructions specify a topic, difficulty, style, or constraint, reflect that across the problem set while still preserving variety.
- If the additional instructions are vague, infer a sensible practice set from the title, description, mode, and language.
- Use ${languageLabel} starter code only. Do not include starter code in any other language.
- Keep descriptions detailed enough for a user to implement without asking follow-up questions.
- Use markdown headings inside each description, preferably: Problem, Input, Output, Examples, Constraints, Notes.
- Include at least two examples per problem. At least one example should cover an edge case or boundary case.
- Starter code should include the expected function or class signature, clear parameter names, and a TODO placeholder, but should not include the completed algorithm.
- Solution outlines should be specific enough for an evaluator or tutor to understand the intended solution without needing to solve the problem from scratch.
- Concepts should be concise and useful for tagging; use 2 to 5 concepts per problem.

Before finalizing, mentally verify:
- The count is exactly ${session.numberOfProblems}.
- All starter code is ${languageLabel}.
- No two problems are duplicates or near-duplicates.
- Every problem is self-contained, testable, and appropriately scoped.
- The additional instructions have been followed unless they conflict with the required rules.
`.trim();
};

export const GENERATE_MATCH_RESULTS_SYSTEM = `
You are a senior software developer judging a live coding battle between users.
Your job is to choose the single best submission for the given programming problem.

You must respond with exactly one of the allowed choices provided in the user prompt:
- One of the submitted match user IDs, if that user's submission is the best answer.
- The literal option "none", if no submitted solution meaningfully answers the problem.

Be somewhat strict. Do not award a winner just because a submission has code, has good style, or appears related to the prompt. A winning submission should substantially solve the requested problem and should be plausible code for the requested language and constraints.

At the same time, judging is nuanced and depends heavily on the situation. Mediocre code can still deserve the win when it is the best meaningful attempt. However, if only one user submitted code, that submission is not automatically the winner. Judge a single submission by the same standards you would use in a two-submission match: it should be a valid attempt, show decent effort, be related to the actual problem, avoid gibberish or placeholder content, and be somewhat or fully correct on the core requirements. Do not choose "none" merely because the best submission is imperfect. Choose "none" when no submission meaningfully solves or attempts the actual task.

Use "none" when:
- No user submitted code.
- Every submission is blank, placeholder code, unrelated to the problem, or mostly pseudocode.
- Every submission fails to address the main requirement of the problem.
- Every submission has a fundamental correctness issue that would make it fail ordinary valid inputs.
- The submissions are impossible to judge as answers to the provided problem.

When choosing between valid or partially valid submissions, consider these factors in order:
1. Correctness: Does the code solve the stated problem for typical, edge, and boundary cases?
2. Completeness: Does it implement the whole requested behavior, not just a narrow example?
3. Runtime complexity: Is the algorithm efficient enough for realistic input sizes?
4. Space complexity: Does it avoid unnecessary memory use?
5. Simplicity: Is the approach understandable and appropriately direct?
6. Robustness: Does it handle empty inputs, invalid-looking values, duplicates, large values, or other important edge cases implied by the problem?
7. Language quality: Is the code idiomatic for the requested programming language?
8. Elegance and maintainability: Is the code clean, readable, and easy to reason about?

The reference solution, if provided, is a guide to intent and expected behavior. Do not require submissions to match it exactly. Equivalent or better approaches should be credited. However, if a submission disagrees with the reference solution on core behavior, treat that as a serious correctness concern.

If multiple submissions are correct, prefer the one with the best combination of clarity, efficiency, and reliability. If two submissions are effectively tied, choose the simpler and more maintainable one. If submissions are imperfect, weigh how serious the issues are against the overall effort and whether the code still solves the central problem. Generally be strict, but adapt to the quality of the field: a flawed but working and relevant solution can win over blank, unrelated, or non-working submissions. If no submission clears the bar for a meaningful solution or meaningful attempt, choose "none".

Do not explain your reasoning in the final answer. Do not include markdown. Do not include a label. Return only the chosen option exactly as provided.
`.trim();

export const generateMatchResultsPrompt = ({
  arenaProblem,
  users,
  submissions,
}: GenerateMatchResultsPromptArgs) => {
  const submissionByUserId = new Map(
    submissions.map((submission) => [submission.userId, submission]),
  );
  const choiceOptions = [...users.map((user) => user.userId), "none"];

  const renderedSubmissions = users
    .map((user, index) => {
      const submission = submissionByUserId.get(user.userId);
      const code = submission?.code.trim();

      return `
Submission ${index + 1}
User ID: ${user.userId}
Submitted: ${submission ? "yes" : "no"}
Code:
\`\`\`${arenaProblem.programmingLanguage}
${code || "[no submitted code]"}
\`\`\`
`.trim();
    })
    .join("\n\n---\n\n");

  return `
You are judging the final result of a live arena match. The users have competed on the same problem, and your decision will determine the recorded winner. Be fair, careful, and strict enough that a user only wins when their submission meaningfully solves the problem.

Allowed choice options:
${choiceOptions.map((option) => `- ${option}`).join("\n")}

You must choose exactly one of those options. Choose a user ID only if that user has the strongest valid solution. Choose "none" if none of the submissions answer the question at all, or if all submissions are too incorrect, incomplete, unrelated, or empty to deserve a win.

You may sometimes receive only one submitted solution. A lone submission is not automatically the winner. Grade it against the same standards as a normal match: it must be a valid attempt, show decent effort, be relevant to the problem, not be gibberish or placeholder code, and be somewhat or fully correct for the core requirements. If the only submitted solution does not clear that bar, choose "none".

Problem:
Title: ${arenaProblem.title}
Difficulty: ${arenaProblem.difficultyLevel}
Programming language: ${arenaProblem.programmingLanguage}
Time limit: ${arenaProblem.timeLimit}ms

Problem description:
${arenaProblem.description}

Reference solution:
\`\`\`${arenaProblem.programmingLanguage}
${arenaProblem.solution}
\`\`\`

User submissions:
${renderedSubmissions}

Reminder:
- Return only the winning user ID or "none".
- Do not return a user ID that is not listed in the allowed choices.
- Do not reward code that is merely similar-looking but does not solve the problem.
- Consider correctness first, then completeness, complexity, simplicity, robustness, idiomatic style, and maintainability.
- If nobody submitted a meaningful solution, return "none".
`.trim();
};
