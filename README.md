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

Create `.env.local`:

```
OPENAI_API_KEY=your_key_here
```

## 👨‍💻 Author

Built as an exploration of reliable, observable, cost-aware AI workflow systems.
