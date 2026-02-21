# SpecForge AI - Agent Architecture Analysis

This document provides an overview of the multi-agent system implemented in the **SpecForge AI** repository.

## Architecture Pattern: Generator-Critic

The system utilizes a **Generator-Critic** pattern. For every major phase of the engineering pipeline, there is a "Generator" agent that creates structured outputs and a "Critic" (Evaluator) agent that grades those outputs. 

If the evaluator's confidence score falls below a threshold (`0.75`), the generator agent is re-run with the evaluator's feedback, up to a maximum number of attempts (by default, 2 attempts total per phase).

All agents utilize `gpt-4o-mini` with `response_format: { type: "json_object" }` to ensure they strictly return parseable JSON data conforming to distinct Zod schemas.

## The Agent Pipeline

The execution of the agents is managed by a custom orchestrator (`lib/orchestrator/orchestrate.ts`) that streams results using Web Streams API. The pipeline is executed sequentially:

1. **Requirements Generation**
2. **API Design**
3. **Test Case Generation**

---

### 1. Requirements Phase

#### Generator: Requirements Agent
- **Location:** `lib/agents/requirements.ts`
- **Role:** "Senior software architect"
- **Task:** Breaks down a high-level feature description into structured functional requirements, non-functional requirements, and underlying assumptions.
- **Inputs:** Feature description, Optional feedback (for retries).
- **Outputs:** JSON adhering to `RequirementsSchema`.

#### Critic: Evaluator Agent
- **Location:** `lib/agents/evaluator.ts`
- **Role:** "Senior software architect reviewing another engineer's work"
- **Task:** Analyzes the generated requirements for completeness, clarity, edge cases, and non-functional depth.
- **Outputs:** Generates a confidence score (`0-1`), along with an array of issues and suggestions. 

---

### 2. API Design Phase

#### Generator: API Design Agent
- **Location:** `lib/agents/api.ts`
- **Role:** "Senior backend architect"
- **Task:** Designs REST API endpoints based on the validated requirements.
- **Inputs:** Feature description, Validated Requirements, Optional feedback.
- **Outputs:** JSON payload containing endpoints with HTTP methods, paths, descriptions, request bodies, and expected responses. Matches `ApiSchema`.

#### Critic: API Evaluator
- **Location:** `lib/agents/api-evaluator.ts`
- **Role:** "Senior backend architect reviewing API designs"
- **Task:** Evaluates the API schema for RESTful principles, completeness, alignment with requirements, clarity, edge case handling, and security.
- **Outputs:** Confidence score, list of issues, and improvement suggestions.

---

### 3. Test Case Phase

#### Generator: Test Case Agent
- **Location:** `lib/agents/test.ts`
- **Role:** "Senior QA engineer"
- **Task:** Generates comprehensive test cases based on the API design and feature requirements.
- **Inputs:** Feature description, Validated Requirements, Validated API Design, Optional feedback.
- **Outputs:** JSON structure categorizing tests into: `happyPath`, `edgeCases`, and `securityTests`. Matches `TestSchema`.

#### Critic: Test Evaluator
- **Location:** `lib/agents/test-evaluator.ts`
- **Role:** "Senior QA engineer reviewing test cases"
- **Task:** Grades test cases strictly for coverage completeness, alignment with requirements and APIs, boundary conditions, and security validation.
- **Outputs:** Confidence score, identified issues, and suggestions for better coverage.

## Retry and Cost-Awareness Mechanisms

The orchestration layer tracks:
- **Total tokens** consumed globally per step (generator + critic tokens combined).
- **Estimated Cost:** Continuously sums token usages across attempts.
- **Duration:** Latency metrics collected to trace the cost-performance of the pipeline.

If an Evaluator Agent returns a confidence `< 0.75`, the Orchestrator injects the `suggestions` array into the prompt of the relevant Generator Agent on the next loop, enabling iterative, self-healing refinement before advancing to the next phase of the pipeline.
