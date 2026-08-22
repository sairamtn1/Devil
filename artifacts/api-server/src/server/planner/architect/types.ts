import type { MissionAnalysis } from "../missionAnalyzer";
import type { MissionTasks } from "../taskGenerator";

export type UserStory = {
  id: string;
  role: string;
  goal: string;
  benefit: string;
  acceptanceCriteria: string[];
};

export type DatabaseColumn = {
  name: string;
  type: string;
  constraints: string[];
};

export type DatabaseTable = {
  name: string;
  description: string;
  columns: DatabaseColumn[];
  relations: string[];
};

export type DatabaseSchemaDesign = {
  tables: DatabaseTable[];
  notes: string[];
};

export type ApiEndpoint = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  requestBody: string;
  response: string;
  authRequired: boolean;
};

export type ApiDesign = {
  baseUrl: string;
  authStrategy: string;
  endpoints: ApiEndpoint[];
};

export type FrontendRoute = {
  path: string;
  purpose: string;
};

export type FrontendArchitecture = {
  framework: string;
  routes: FrontendRoute[];
  keyComponents: string[];
  stateManagement: string;
  stylingApproach: string;
};

export type BackendLayer = {
  name: string;
  responsibility: string;
};

export type BackendArchitecture = {
  framework: string;
  layers: BackendLayer[];
  services: string[];
  integrations: string[];
};

export type FolderEntry = {
  path: string;
  purpose: string;
};

export type FolderStructure = {
  tree: string;
  explanation: FolderEntry[];
};

export type ImplementationTaskCategory =
  | "frontend"
  | "backend"
  | "database"
  | "deployment"
  | "general";

export type ImplementationTask = {
  id: string;
  title: string;
  category: ImplementationTaskCategory;
  description: string;
};

export type ArchitectPlan = {
  missionId: string;
  projectId: string;
  projectName: string;
  goal: string;
  missionAnalysis: MissionAnalysis;
  requirements: string[];
  userStories: UserStory[];
  databaseSchema: DatabaseSchemaDesign;
  apiDesign: ApiDesign;
  frontendArchitecture: FrontendArchitecture;
  backendArchitecture: BackendArchitecture;
  folderStructure: FolderStructure;
  implementationTasks: ImplementationTask[];
  memoryUsed: boolean;
  createdAt: string;
};

// Re-exported so downstream modules only need to import from one place.
export type { MissionAnalysis, MissionTasks };
