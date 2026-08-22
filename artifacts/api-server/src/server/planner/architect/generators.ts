import { qwen } from "../../ai/chat";
import type { ChatMessage } from "../../ai/types";
import type { MissionAnalysis } from "../missionAnalyzer";
import type {
  ApiDesign,
  BackendArchitecture,
  DatabaseSchemaDesign,
  FolderStructure,
  FrontendArchitecture,
  UserStory,
} from "./types";

async function completeJson<T>(messages: ChatMessage[], fallback: T): Promise<T> {
  try {
    const result = await qwen.complete({ messages, responseFormat: "json" });
    return JSON.parse(result.content) as T;
  } catch {
    return fallback;
  }
}

function analysisSummary(analysis: MissionAnalysis): string {
  return JSON.stringify({
    projectName: analysis.projectName,
    requirements: analysis.requirements,
    architecture: analysis.architecture,
    databaseDesign: analysis.databaseDesign,
  });
}

export async function generateUserStories(
  goal: string,
  analysis: MissionAnalysis,
): Promise<UserStory[]> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are DEVIL's user story writer. Return only valid JSON: an array of objects with " +
        "id, role, goal, benefit, and acceptanceCriteria (array of strings). Write standard " +
        '"As a <role>, I want <goal>, so that <benefit>" stories covering the core requirements. ' +
        "Never invent requirements not implied by the goal or analysis.",
    },
    {
      role: "user",
      content: `Goal: ${goal}\nMission analysis: ${analysisSummary(analysis)}\nWrite 5-8 user stories covering the primary requirements.`,
    },
  ];
  return completeJson<UserStory[]>(messages, [
    {
      id: "story-1",
      role: "user",
      goal: "accomplish the primary objective described in the goal",
      benefit: "the core need behind the request is met",
      acceptanceCriteria: ["The primary flow described in the goal can be completed end to end."],
    },
  ]);
}

export async function generateDatabaseSchema(
  goal: string,
  analysis: MissionAnalysis,
): Promise<DatabaseSchemaDesign> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are DEVIL's database architect. Return only valid JSON matching: " +
        "{ tables: [{ name, description, columns: [{ name, type, constraints: string[] }], relations: string[] }], notes: string[] }. " +
        "Use concrete SQL-style types (uuid, text, integer, timestamp, boolean, jsonb, decimal). " +
        "Include primary keys and foreign key relationships in `relations` as human-readable statements " +
        '(e.g. "bookings.showtime_id references showtimes.id"). Design for a production relational database.',
    },
    {
      role: "user",
      content: `Goal: ${goal}\nMission analysis: ${analysisSummary(analysis)}\nDesign the full relational schema needed to support this application.`,
    },
  ];
  return completeJson<DatabaseSchemaDesign>(messages, {
    tables: [
      {
        name: "entities",
        description: "Placeholder table — schema generation fell back to a default.",
        columns: [
          { name: "id", type: "uuid", constraints: ["primary key"] },
          { name: "created_at", type: "timestamp", constraints: ["not null", "default now()"] },
        ],
        relations: [],
      },
    ],
    notes: ["Schema generation failed to return structured JSON; refine the goal and retry."],
  });
}

export async function generateApiDesign(
  goal: string,
  analysis: MissionAnalysis,
  databaseSchema: DatabaseSchemaDesign,
): Promise<ApiDesign> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are DEVIL's API architect. Return only valid JSON matching: " +
        "{ baseUrl: string, authStrategy: string, endpoints: [{ method, path, description, requestBody, response, authRequired: boolean }] }. " +
        "method must be one of GET, POST, PUT, PATCH, DELETE. Design a REST API that covers full CRUD " +
        "and workflow operations for every table in the provided schema. requestBody and response should " +
        "be short human-readable shape descriptions, not full JSON Schema.",
    },
    {
      role: "user",
      content: `Goal: ${goal}\nMission analysis: ${analysisSummary(analysis)}\nDatabase schema: ${JSON.stringify(databaseSchema)}\nDesign the REST API surface.`,
    },
  ];
  return completeJson<ApiDesign>(messages, {
    baseUrl: "/api",
    authStrategy: "Bearer token (session or API key), required on all mutating routes.",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "Service health check.",
        requestBody: "none",
        response: "{ status: string }",
        authRequired: false,
      },
    ],
  });
}

export async function generateFrontendArchitecture(
  goal: string,
  analysis: MissionAnalysis,
): Promise<FrontendArchitecture> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are DEVIL's frontend architect. Return only valid JSON matching: " +
        "{ framework: string, routes: [{ path, purpose }], keyComponents: string[], stateManagement: string, stylingApproach: string }. " +
        "Assume a modern React + TypeScript SPA unless the goal clearly implies otherwise. " +
        "Cover every user-facing flow implied by the requirements.",
    },
    {
      role: "user",
      content: `Goal: ${goal}\nMission analysis: ${analysisSummary(analysis)}\nDesign the frontend architecture.`,
    },
  ];
  return completeJson<FrontendArchitecture>(messages, {
    framework: "React + TypeScript (Vite)",
    routes: [{ path: "/", purpose: "Primary landing / entry flow for the application." }],
    keyComponents: ["AppShell", "PrimaryFlow"],
    stateManagement: "React Query for server state, local component state for UI state.",
    stylingApproach: "Utility-first CSS (Tailwind) with a shared component library.",
  });
}

export async function generateBackendArchitecture(
  goal: string,
  analysis: MissionAnalysis,
  databaseSchema: DatabaseSchemaDesign,
): Promise<BackendArchitecture> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are DEVIL's backend architect. Return only valid JSON matching: " +
        "{ framework: string, layers: [{ name, responsibility }], services: string[], integrations: string[] }. " +
        "Describe a layered service architecture (routing, validation, service/domain logic, persistence) " +
        "appropriate for the goal and the provided database schema.",
    },
    {
      role: "user",
      content: `Goal: ${goal}\nMission analysis: ${analysisSummary(analysis)}\nDatabase schema: ${JSON.stringify(databaseSchema)}\nDesign the backend architecture.`,
    },
  ];
  return completeJson<BackendArchitecture>(messages, {
    framework: "Node.js + Express (TypeScript)",
    layers: [
      { name: "Routing", responsibility: "HTTP request/response handling and input validation." },
      { name: "Service", responsibility: "Domain logic and orchestration." },
      { name: "Persistence", responsibility: "Database access via an ORM." },
    ],
    services: ["Core domain service"],
    integrations: [],
  });
}

export async function generateFolderStructure(
  goal: string,
  frontend: FrontendArchitecture,
  backend: BackendArchitecture,
): Promise<FolderStructure> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are DEVIL's project scaffolder. Return only valid JSON matching: " +
        "{ tree: string, explanation: [{ path, purpose }] }. " +
        '`tree` is a single string containing an ASCII folder tree (use "├──", "└──", "│" characters, ' +
        "newline-separated). `explanation` lists the purpose of each top-level and notable nested path. " +
        "Base the structure on the given frontend and backend architecture.",
    },
    {
      role: "user",
      content: `Goal: ${goal}\nFrontend architecture: ${JSON.stringify(frontend)}\nBackend architecture: ${JSON.stringify(backend)}\nProduce a production-ready folder structure.`,
    },
  ];
  return completeJson<FolderStructure>(messages, {
    tree: "project/\n├── frontend/\n│   └── src/\n└── backend/\n    └── src/",
    explanation: [
      { path: "frontend/", purpose: "Client application." },
      { path: "backend/", purpose: "API server." },
    ],
  });
}
