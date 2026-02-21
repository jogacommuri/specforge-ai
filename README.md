# 🚀 SpecForge AI

**Forging product intent into production-ready architecture.**

SpecForge AI is a multi-agent engineering copilot that transforms high-level product specifications into structured engineering artifacts — with built-in reliability, observability, and cost-awareness.

It demonstrates a production-style AI workflow engine built using Next.js 16, TypeScript, and structured LLM orchestration.

## 🧠 What It Does

Given a feature specification, SpecForge AI:

- Generates structured requirements
- Designs REST API contracts
- Produces comprehensive test cases
- Evaluates output quality using a critic agent
- Retries low-confidence outputs automatically
- Tracks token usage and estimated cost
- Streams results in real-time through a graph-based UI

## 🏗 Architecture Overview

```
Feature Input
     ↓
Requirements Agent
     ↓
Evaluator (Confidence + Suggestions)
     ↓
Retry Loop (if confidence < threshold)
     ↓
API Design Agent
     ↓
Evaluator
     ↓
Test Case Agent
     ↓
Evaluator
     ↓
Pipeline Summary (Metrics + Cost + Confidence)
```

The system uses a **Generator–Critic** pattern to improve reliability and reduce hallucinations.

## 🔁 Reliability Strategy

SpecForge AI does not blindly trust LLM output.

Each major agent:

- Produces structured JSON validated via Zod schemas
- Is evaluated by a secondary evaluator agent
- Receives a confidence score (0–1)
- Retries once if below threshold (default: 0.75)

This ensures:

- Better requirement completeness
- Improved non-functional coverage
- Reduced shallow outputs
- Deterministic validation boundaries

## 📊 Observability & Cost Awareness

Each pipeline run tracks:

- Execution duration per agent
- Total pipeline duration
- Token usage per agent
- Total tokens per run
- Estimated cost per run
- Retry attempts
- Lowest confidence score

This enables:

- Reliability vs. latency tradeoffs
- Cost-aware execution
- Transparent AI runtime behavior

Example runtime output:

```
REQUIREMENTS
Completed
2.31s
Confidence: 82%
Attempts: 2
Tokens: 8,243
Est. Cost: $0.0082
```

## 🎛 Graph Visualization

The frontend visualizes agent execution as a streaming pipeline:

**Requirements → Eval → API → Eval → Tests → Eval → Summary**

Features:

- Real-time state transitions (idle / running / completed / error)
- Animated edges between agents
- Progressive streaming updates
- Runtime metrics display

## 🛠 Tech Stack

**Frontend**

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Streaming UI with Web Streams API

**Backend**

- OpenAI SDK
- Zod schema validation
- Custom orchestrator
- Async generator-based streaming

## 🧩 Why Custom Orchestration (Instead of LangChain)?

SpecForge AI intentionally implements a custom orchestrator to:

- Fully control retry logic
- Track token and cost usage precisely
- Maintain deterministic schema validation
- Demonstrate deep understanding of LLM workflow design

The architecture can be migrated to LangGraph in future iterations.

## ⚖️ Tradeoffs

| Decision | Benefit | Tradeoff |
|----------|---------|----------|
| Evaluator Agent | Higher output quality | Increased token usage |
| Retry Loop | Self-correcting system | Increased latency |
| Structured Validation | Deterministic boundaries | More orchestration complexity |
| Streaming Execution | Improved UX | Slight implementation overhead |

## 🚀 Example Input

```
Build a SaaS project management platform with:
- Role-based access control
- Task dependencies
- Real-time collaboration
- API rate limiting
- Data encryption at rest and in transit
```

## 📈 Future Improvements

- Parallel agent execution mode
- Adaptive retry threshold based on cost
- Token-aware context trimming
- Vector retrieval (RAG) integration
- State machine (LangGraph-style) refactor
- Persistent run history

## 🎯 What This Project Demonstrates

This project is designed to showcase:

- Multi-agent LLM orchestration
- Self-evaluating AI workflows
- Generator–Critic architecture
- Cost-aware AI execution
- Structured output enforcement
- Streaming pipeline UI
- Systems-level thinking for AI reliability

## 🧪 Running Locally

```bash
npm install
npm run dev
```

Create `.env.local` (see `.env.example` for template):

```
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL=postgresql://user:password@host:5432/database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Setting up Clerk Authentication

1. Create a free account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your **Publishable Key** and **Secret Key** from the Clerk dashboard
4. Add them to your `.env.local` file as shown above
5. Configure your application URL in Clerk dashboard:
   - Development: `http://localhost:3000`
   - Add `/api/webhooks/clerk` as a webhook endpoint (if using webhooks)

The application will automatically:
- Protect `/dashboard` routes (requires authentication)
- Allow public access to `/` (home page)
- Provide sign-in/sign-up pages at `/sign-in` and `/sign-up`

### Setting up Supabase + Prisma

1. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com) and create a free account
   - Create a new project
   - Wait for the database to be provisioned

2. **Get your database connection string:**
   - Go to Project Settings → Database
   - Copy the **Connection string** (URI format)
   - Use the format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Add it to `.env.local` as `DATABASE_URL`

3. **Get your Supabase API keys:**
   - Go to Project Settings → API
   - Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Add both to `.env.local`

4. **Set up the database schema:**
   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Push schema to database (for development)
   npm run db:push

   # Or create a migration (for production)
   npm run db:migrate
   ```

5. **Optional: Open Prisma Studio to view data:**
   ```bash
   npm run db:studio
   ```

The database schema includes:
- `PipelineRun` - Stores each pipeline execution with metadata
- `PipelineAgent` - Stores individual agent execution details per run

## 👨‍💻 Author

Built as an exploration of reliable, observable, cost-aware AI workflow systems.
