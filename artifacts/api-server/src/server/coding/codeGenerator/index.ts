/**
 * DEVIL Coding Agent Foundation - Code Generator
 * 
 * Generates complete project structures for various frameworks.
 * - React apps
 * - Next.js apps
 * - Express APIs
 * - FastAPI apps
 * - Node.js services
 * - TypeScript projects
 */

import { fileOperationsEngine } from "../fileOperations";
import { workspaceManager } from "../workspace";
import { logEvent } from "../../control-plane/eventLog";

// ============================================================================
// TYPES
// ============================================================================

export const ProjectType = {
  REACT: "react",
  NEXTJS: "nextjs",
  EXPRESS: "express",
  FASTAPI: "fastapi",
  NODE_SERVICE: "node_service",
  TYPESCRIPT: "typescript",
  VANILLA: "vanilla",
} as const;

export type ProjectTypeType = (typeof ProjectType)[keyof typeof ProjectType];

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  projectType: ProjectTypeType;
  files: TemplateFile[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface TemplateFile {
  path: string;
  content: string;
  description?: string;
}

export interface GenerationRequest {
  projectName: string;
  projectType: ProjectTypeType;
  workspaceId: string;
  options?: GenerationOptions;
}

export interface GenerationOptions {
  typescript?: boolean;
  styledComponents?: boolean;
  tailwind?: boolean;
  prisma?: boolean;
  docker?: boolean;
  ci?: boolean;
  tests?: boolean;
  documentation?: boolean;
  customFiles?: TemplateFile[];
}

export interface GenerationResult {
  success: boolean;
  workspaceId: string;
  projectName: string;
  filesGenerated: number;
  files: string[];
  warnings: string[];
  errors: string[];
}

// ============================================================================
// CODE TEMPLATES
// ============================================================================

const REACT_TEMPLATE: CodeTemplate = {
  id: "react-vite-ts",
  name: "React + Vite + TypeScript",
  description: "Modern React app with Vite bundler and TypeScript",
  projectType: ProjectType.REACT,
  dependencies: {
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  devDependencies: {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    typescript: "^5.3.0",
    vite: "^5.0.0"
  },
  scripts: {
    dev: "vite",
    build: "tsc && vite build",
    preview: "vite preview",
    lint: "eslint src --ext ts,tsx"
  },
  files: [
    {
      path: "package.json",
      content: JSON.stringify({
        name: "{{projectName}}",
        version: "1.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview",
          lint: "eslint src --ext ts,tsx"
        },
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0"
        },
        devDependencies: {
          "@types/react": "^18.2.0",
          "@vitejs/plugin-react": "^4.2.0",
          typescript: "^5.3.0",
          vite: "^5.0.0"
        }
      }, null, 2),
      description: "Package configuration"
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ["src"],
        references: [{ path: "./tsconfig.node.json" }]
      }, null, 2),
      description: "TypeScript configuration"
    },
    {
      path: "tsconfig.node.json",
      content: JSON.stringify({
        compilerOptions: {
          composite: true,
          skipLibCheck: true,
          module: "ESNext",
          moduleResolution: "bundler",
          allowSyntheticDefaultImports: true
        },
        include: ["vite.config.ts"]
      }, null, 2),
      description: "Node TypeScript config"
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})`,
      description: "Vite configuration"
    },
    {
      path: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{projectName}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      description: "HTML entry point"
    },
    {
      path: "src/main.tsx",
      content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      description: "Main entry point"
    },
    {
      path: "src/App.tsx",
      content: `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-red-500 mb-4">
        🔥 DEVIL App
      </h1>
      <p className="text-gray-400">
        Your React application is ready!
      </p>
    </div>
  )
}

export default App`,
      description: "Root App component"
    },
    {
      path: "src/index.css",
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      description: "Global styles with Tailwind"
    },
    {
      path: "tailwind.config.js",
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        devil: {
          500: '#ef4444',
          600: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}`,
      description: "Tailwind configuration"
    },
    {
      path: "postcss.config.js",
      content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      description: "PostCSS configuration"
    }
  ]
};

const NEXTJS_TEMPLATE: CodeTemplate = {
  id: "nextjs-14",
  name: "Next.js 14 App Router",
  description: "Next.js with App Router and React Server Components",
  projectType: ProjectType.NEXTJS,
  dependencies: {
    next: "^14.0.0",
    react: "^18.2.0",
    "react-dom": "^18.2.0"
  },
  devDependencies: {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    typescript: "^5.3.0"
  },
  scripts: {
    dev: "next dev",
    build: "next build",
    start: "next start",
    lint: "next lint"
  },
  files: [
    {
      path: "package.json",
      content: JSON.stringify({
        name: "{{projectName}}",
        version: "1.0.0",
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {
          next: "^14.0.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0"
        },
        devDependencies: {
          "@types/node": "^20.0.0",
          "@types/react": "^18.2.0",
          typescript: "^5.3.0"
        }
      }, null, 2)
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify({
        compilerOptions: {
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./*"] }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"]
      }, null, 2)
    },
    {
      path: "app/layout.tsx",
      content: `import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '{{projectName}}',
  description: 'Generated by DEVIL AI Agent',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <nav className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-red-500">🔥 DEVIL</h1>
        </nav>
        <main className="p-8">{children}</main>
      </body>
    </html>
  )
}`,
      description: "Root layout"
    },
    {
      path: "app/page.tsx",
      content: `export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">Welcome to {{projectName}}</h1>
      <p className="text-gray-400">
        Your Next.js application is ready!
      </p>
    </div>
  )
}`,
      description: "Home page"
    },
    {
      path: "app/globals.css",
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      description: "Global styles"
    }
  ]
};

const EXPRESS_TEMPLATE: CodeTemplate = {
  id: "express-typescript",
  name: "Express API with TypeScript",
  description: "RESTful API with Express and TypeScript",
  projectType: ProjectType.EXPRESS,
  dependencies: {
    express: "^4.18.0",
    cors: "^2.8.5",
    helmet: "^7.0.0",
    dotenv: "^16.3.0"
  },
  devDependencies: {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/cors": "^2.8.0",
    typescript: "^5.3.0",
    ts-node: "^10.9.0",
    nodemon: "^3.0.0"
  },
  scripts: {
    dev: "nodemon --exec ts-node src/index.ts",
    build: "tsc",
    start: "node dist/index.js"
  },
  files: [
    {
      path: "package.json",
      content: JSON.stringify({
        name: "{{projectName}}",
        version: "1.0.0",
        scripts: {
          dev: "nodemon --exec ts-node src/index.ts",
          build: "tsc",
          start: "node dist/index.js"
        },
        dependencies: {
          express: "^4.18.0",
          cors: "^2.8.5",
          helmet: "^7.0.0",
          dotenv: "^16.3.0"
        },
        devDependencies: {
          "@types/express": "^4.17.0",
          "@types/node": "^20.0.0",
          typescript: "^5.3.0",
          ts-node: "^10.9.0",
          nodemon: "^3.0.0"
        }
      }, null, 2)
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          module: "commonjs",
          lib: ["ES2020"],
          outDir: "./dist",
          rootDir: "./src",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true
        },
        include: ["src/**/*"],
        exclude: ["node_modules"]
      }, null, 2)
    },
    {
      path: "src/index.ts",
      content: `import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to {{projectName}} API',
    version: '1.0.0',
    endpoints: ['/health', '/api/users']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🔥 DEVIL API running on port \${PORT}\`);
});

export default app;`,
      description: "Express app entry point"
    }
  ]
};

const FASTAPI_TEMPLATE: CodeTemplate = {
  id: "fastapi",
  name: "FastAPI Python",
  description: "Modern Python API with FastAPI",
  projectType: ProjectType.FASTAPI,
  dependencies: {},
  devDependencies: {},
  scripts: {
    dev: "uvicorn main:app --reload",
    start: "uvicorn main:app --host 0.0.0.0 --port 8000"
  },
  files: [
    {
      path: "requirements.txt",
      content: `fastapi==0.104.0
uvicorn==0.24.0
pydantic==2.5.0
python-dotenv==1.0.0
`
    },
    {
      path: "main.py",
      content: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI(
    title="{{projectName}}",
    description="Generated by DEVIL AI Agent",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to {{projectName}}",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`
    },
    {
      path: ".env.example",
      content: `# Environment variables
PORT=8000
DEBUG=true
`
    }
  ]
};

const NODE_SERVICE_TEMPLATE: CodeTemplate = {
  id: "node-service",
  name: "Node.js Service",
  description: "Minimal Node.js service with TypeScript",
  projectType: ProjectType.NODE_SERVICE,
  dependencies: {},
  devDependencies: {
    typescript: "^5.3.0",
    "@types/node": "^20.0.0",
    jest: "^29.7.0",
    "@types/jest": "^29.5.0",
    ts-jest: "^29.1.0"
  },
  scripts: {
    build: "tsc",
    start: "node dist/index.js",
    test: "jest",
    dev: "ts-node src/index.ts"
  },
  files: [
    {
      path: "package.json",
      content: JSON.stringify({
        name: "{{projectName}}",
        version: "1.0.0",
        main: "dist/index.js",
        scripts: {
          build: "tsc",
          start: "node dist/index.js",
          test: "jest",
          dev: "ts-node src/index.ts"
        },
        devDependencies: {
          typescript: "^5.3.0",
          "@types/node": "^20.0.0",
          jest: "^29.7.0"
        }
      }, null, 2)
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          module: "commonjs",
          outDir: "./dist",
          rootDir: "./src",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true
        },
        include: ["src/**/*"],
        exclude: ["node_modules"]
      }, null, 2)
    },
    {
      path: "src/index.ts",
      content: `console.log('🔥 DEVIL Node.js Service');

// Your code here

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});`,
      description: "Entry point"
    }
  ]
};

const TEMPLATES: Record<ProjectTypeType, CodeTemplate> = {
  [ProjectType.REACT]: REACT_TEMPLATE,
  [ProjectType.NEXTJS]: NEXTJS_TEMPLATE,
  [ProjectType.EXPRESS]: EXPRESS_TEMPLATE,
  [ProjectType.FASTAPI]: FASTAPI_TEMPLATE,
  [ProjectType.NODE_SERVICE]: NODE_SERVICE_TEMPLATE,
  [ProjectType.TYPESCRIPT]: NODE_SERVICE_TEMPLATE,
  [ProjectType.VANILLA]: NODE_SERVICE_TEMPLATE,
};

// ============================================================================
// CODE GENERATOR
// ============================================================================

export class CodeGenerator {
  /**
   * Generate a complete project
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const { projectName, projectType, workspaceId, options = {} } = request;
    const warnings: string[] = [];
    const errors: string[] = [];
    const generatedFiles: string[] = [];

    // Get template
    const template = TEMPLATES[projectType];
    if (!template) {
      return {
        success: false,
        workspaceId,
        projectName,
        filesGenerated: 0,
        files: [],
        warnings,
        errors: [`Unknown project type: ${projectType}`]
      };
    }

    // Log start
    await logEvent({
      missionId: workspaceId,
      eventType: "checkpoint_created",
      severity: "info",
      message: `Generating ${template.name} project`,
      details: { projectName, projectType, workspaceId }
    });

    // Generate files
    for (const file of template.files) {
      try {
        // Replace project name placeholder
        const content = file.content.replace(/\{\{projectName\}\}/g, projectName);
        
        await fileOperationsEngine.writeFile(workspaceId, file.path, content);
        generatedFiles.push(file.path);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to create ${file.path}: ${message}`);
      }
    }

    // Generate additional files based on options
    if (options.tailwind) {
      await this.addTailwind(workspaceId, projectType, generatedFiles);
    }

    if (options.docker) {
      await this.addDockerfile(workspaceId, projectName, projectType, generatedFiles);
    }

    if (options.ci) {
      await this.addCI(workspaceId, projectName, generatedFiles);
    }

    if (options.tests) {
      await this.addTests(workspaceId, projectType, generatedFiles);
    }

    if (options.documentation) {
      await this.addDocumentation(workspaceId, projectName, generatedFiles);
    }

    // Add custom files
    if (options.customFiles) {
      for (const file of options.customFiles) {
        try {
          await fileOperationsEngine.writeFile(workspaceId, file.path, file.content);
          generatedFiles.push(file.path);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to create ${file.path}: ${message}`);
        }
      }
    }

    const success = errors.length === 0;

    // Log completion
    await logEvent({
      missionId: workspaceId,
      eventType: success ? "checkpoint_created" : "validation_warning",
      severity: success ? "info" : "warning",
      message: `Project generation ${success ? "completed" : "completed with errors"}`,
      details: { filesGenerated: generatedFiles.length, errors: errors.length }
    });

    return {
      success,
      workspaceId,
      projectName,
      filesGenerated: generatedFiles.length,
      files: generatedFiles,
      warnings,
      errors
    };
  }

  /**
   * Get available templates
   */
  getTemplates(): CodeTemplate[] {
    return Object.values(TEMPLATES);
  }

  /**
   * Get template by project type
   */
  getTemplate(projectType: ProjectTypeType): CodeTemplate | undefined {
    return TEMPLATES[projectType];
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async addTailwind(workspaceId: string, projectType: ProjectTypeType, generatedFiles: string[]): Promise<void> {
    // Add Tailwind to existing CSS file
    const cssFile = projectType === ProjectType.NEXTJS ? "app/globals.css" : "src/index.css";
    
    if (await fileOperationsEngine.exists(workspaceId, cssFile)) {
      const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* DEVIL Custom Styles */`;
      await fileOperationsEngine.writeFile(workspaceId, cssFile, cssContent);
    }

    // Add Tailwind config
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        devil: {
          500: '#ef4444',
          600: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}`;
    await fileOperationsEngine.writeFile(workspaceId, "tailwind.config.js", tailwindConfig);
    generatedFiles.push("tailwind.config.js");
  }

  private async addDockerfile(workspaceId: string, projectName: string, projectType: ProjectTypeType, generatedFiles: string[]): Promise<void> {
    let dockerfile: string;

    if (projectType === ProjectType.FASTAPI) {
      dockerfile = `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`;
    } else {
      dockerfile = `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]`;
    }

    await fileOperationsEngine.writeFile(workspaceId, "Dockerfile", dockerfile);
    generatedFiles.push("Dockerfile");
  }

  private async addCI(workspaceId: string, projectName: string, generatedFiles: string[]): Promise<void> {
    const workflow = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm test`;

    await fileOperationsEngine.writeFile(workspaceId, ".github/workflows/ci.yml", workflow);
    generatedFiles.push(".github/workflows/ci.yml");
  }

  private async addTests(workspaceId: string, projectType: ProjectTypeType, generatedFiles: string[]): Promise<void> {
    let testContent: string;
    const testDir = projectType === ProjectType.NEXTJS ? "app" : "src";

    if (projectType === ProjectType.FASTAPI) {
      testContent = `from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()`;
      await fileOperationsEngine.writeFile(workspaceId, "test_main.py", testContent);
      generatedFiles.push("test_main.py");
    } else {
      testContent = `describe('DEVIL App', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});`;
      
      const testFile = projectType === ProjectType.REACT || projectType === ProjectType.NEXTJS 
        ? `${testDir}/App.test.tsx`
        : `${testDir}/index.test.ts`;
      
      await fileOperationsEngine.writeFile(workspaceId, testFile, testContent);
      generatedFiles.push(testFile);
    }
  }

  private async addDocumentation(workspaceId: string, projectName: string, generatedFiles: string[]): Promise<void> {
    const readme = `# ${projectName}

Generated by **DEVIL AI Agent**

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
\`\`\`

## Features

- 🚀 Fast and modern
- 🔥 DEVIL-powered
- 📦 Easy to deploy

## License

MIT`;
    
    await fileOperationsEngine.writeFile(workspaceId, "README.md", readme);
    generatedFiles.push("README.md");
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const codeGenerator = new CodeGenerator();
