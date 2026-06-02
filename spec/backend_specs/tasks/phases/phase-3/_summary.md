# Phase 3 — AI Agent

```slc
@block PHASE phase_3_agent
priority: critical
intent: "Apify + Pexels MCP servers, lifespan management, recipe agent, Runner.run() validation"
scope: phase-3
depends_on: ["phase-2"]
estimate_minutes: 60

content:
  tasks: [3.1, 3.2, 3.3, 3.4, 3.5]

  prerequisites:
    - "Phase 1 deliverable met (uvicorn starts, tables exist)"
    - "APIFY_API_TOKEN and PEXELS_API_KEY in .env"
    - "GEMINI_API_KEY in .env"
    - "pexels-mcp-server installed (uv add pexels-mcp-server)"

  deliverable: >
    Running backend/tests/test_agent_manual.py produces a valid RecipeCard JSON
    with recipe.title, recipe.ingredients, image.url, and image.photographer populated.

  status: todo
@end
```
