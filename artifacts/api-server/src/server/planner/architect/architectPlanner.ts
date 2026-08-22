import { db, missionsTable } from "@workspace/db";
import { retrieveRelevantMemory } from "../../memory/retrieve";
import { saveMemory, saveProjectContext } from "../../memory/store";
import { analyzeMission } from "../missionAnalyzer";
import { generateTasks, type MissionTasks } from "../taskGenerator";
import {
  generateApiDesign,
  generateBackendArchitecture,
  generateDatabaseSchema,
  generateFolderStructure,
  generateFrontendArchitecture,
  generateUserStories,
} from "./generators";
import type { ArchitectPlan, ImplementationTask } from "./types";

type Input = {
  userId: string;
  goal: string;
};

type Result = {
  plan: ArchitectPlan;
  missionId: string;
  projectId: string;
};

function normalizeTasks(tasks: MissionTasks): ImplementationTask[] {
  const toTasks = (items: string[], category: ImplementationTask["category"], prefix: string) =>
    items.map((description, index) => ({
      id: `${prefix}-${index + 1}`,
      title: description.length > 60 ? `${description.slice(0, 57)}...` : description,
      category,
      description,
    }));

  return [
    ...toTasks(tasks.frontendPlan ?? [], "frontend", "task-frontend"),
    ...toTasks(tasks.backendPlan ?? [], "backend", "task-backend"),
    ...toTasks(tasks.deploymentPlan ?? [], "deployment", "task-deployment"),
    ...toTasks(tasks.tasks ?? [], "general", "task-general"),
  ];
}

/**
 * DEVIL Architect: produces mission analysis, requirements, user stories,
 * database schema, API design, frontend architecture, backend architecture,
 * folder structure, and implementation tasks for a single goal.
 *
 * Reuses, without modification:
 *  - memory/retrieve.ts (retrieveRelevantMemory)
 *  - memory/store.ts (saveProjectContext, saveMemory)
 *  - planner/missionAnalyzer.ts (analyzeMission)
 *  - planner/taskGenerator.ts (generateTasks)
 *  - ai/chat.ts (via missionAnalyzer/taskGenerator/generators, all through
 *    the shared `qwen` provider)
 *  - @workspace/db schema (missionsTable, projectsTable via saveProjectContext)
 */
export async function createArchitectPlan(input: Input): Promise<Result> {
  const context = await retrieveRelevantMemory(input.userId, input.goal);
  const contextText = JSON.stringify({
    memories: context.memories.map((memory) => memory.content),
    projects: context.projects.map((project) => ({ name: project.name, context: project.context })),
  });

  // Stage 1: mission analysis anchors every later stage.
  const missionAnalysis = await analyzeMission(input.goal, contextText);

  // Stage 2: sections that only depend on the mission analysis run in parallel.
  const [userStories, databaseSchema, frontendArchitecture, rawTasks] = await Promise.all([
    generateUserStories(input.goal, missionAnalysis),
    generateDatabaseSchema(input.goal, missionAnalysis),
    generateFrontendArchitecture(input.goal, missionAnalysis),
    generateTasks(input.goal, missionAnalysis as unknown as Record<string, unknown>),
  ]);

  // Stage 3: sections that benefit from the database schema.
  const [apiDesign, backendArchitecture] = await Promise.all([
    generateApiDesign(input.goal, missionAnalysis, databaseSchema),
    generateBackendArchitecture(input.goal, missionAnalysis, databaseSchema),
  ]);

  // Stage 4: folder structure depends on both frontend and backend architecture.
  const folderStructure = await generateFolderStructure(input.goal, frontendArchitecture, backendArchitecture);

  const planBody = {
    projectName: missionAnalysis.projectName,
    goal: input.goal,
    missionAnalysis,
    requirements: missionAnalysis.requirements,
    userStories,
    databaseSchema,
    apiDesign,
    frontendArchitecture,
    backendArchitecture,
    folderStructure,
    implementationTasks: normalizeTasks(rawTasks),
    memoryUsed: context.memories.length > 0,
  };

  const project = await saveProjectContext({
    userId: input.userId,
    name: missionAnalysis.projectName,
    context: planBody as unknown as Record<string, unknown>,
  });

  const [mission] = await db
    .insert(missionsTable)
    .values({
      id: `mission-${crypto.randomUUID()}`,
      userId: input.userId,
      projectId: project.id,
      goal: input.goal,
      status: "architected",
      plan: planBody as unknown as Record<string, unknown>,
    })
    .returning();

  await saveMemory({
    userId: input.userId,
    projectId: project.id,
    kind: "architect-plan",
    content: `${missionAnalysis.projectName}: full architecture generated for "${input.goal}"`,
    metadata: { missionId: mission.id },
  });

  const plan: ArchitectPlan = {
    ...planBody,
    missionId: mission.id,
    projectId: project.id,
    createdAt: mission.createdAt.toISOString(),
  };

  return { plan, missionId: mission.id, projectId: project.id };
}
