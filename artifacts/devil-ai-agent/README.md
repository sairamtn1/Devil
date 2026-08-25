# DEVIL AI Agent Frontend

Next.js-based frontend for the DEVIL autonomous AI agent platform.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Pages

- `/` - Landing page
- `/dashboard` - Mission Control Dashboard
- `/architect` - Architect 2.0 Intelligence Engine
- `/orchestrator` - Multi-Agent Orchestrator
- `/image` - Image Studio
- `/video` - Video Studio
- `/missions` - Mission History
- `/settings` - Settings

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- TanStack Query
- Wouter (Routing)

## Structure

```
src/
├── app/           # Next.js app directory
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── pages/         # Page components
│   ├── architect.tsx
│   ├── orchestrator.tsx
│   ├── image.tsx
│   └── video.tsx
└── components/   # Shared components
```

## Development

The frontend connects to the API server at `/api`. Make sure the API server is running.

```bash
# Start API server (from artifacts/api-server)
cd ../api-server
npm run dev
```
