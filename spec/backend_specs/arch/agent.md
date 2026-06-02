# arch/agent.md — AI Agent Module (WARM)

```slc
@block ARCH agent_module
priority: critical
intent: "OpenAI Agents SDK recipe agent — LiteLLM, Apify+Pexels MCP, Runner.run()"
scope: module
depends_on: [arch/database.database_module]

content:
  files:
    - "backend/app/agent/agent.py"
    - "backend/app/agent/mcp_servers.py"

  mcp_servers:
    apify_recipes:
      class: "MCPServerSse"
      params:
        url: "https://mcp.apify.com/?tools=web.harvester/recipes-scraper"
        headers: "Authorization: Bearer {APIFY_API_TOKEN}"
      cache_tools_list: true
      name: "apify_recipes"
      transport: "remote SSE — no subprocess, requires internet"

    pexels_images:
      class: "MCPServerStdio"
      params:
        command: "pexels-mcp-server"
        args: []
        env: "PEXELS_API_KEY={PEXELS_API_KEY}"
      cache_tools_list: true
      name: "pexels_images"
      transport: "local stdio — spawns pexels-mcp-server subprocess"

  agent:
    name: "cookbook_agent"
    model: "LitellmModel(model={LITELLM_MODEL}, api_key={GEMINI_API_KEY})"
    instructions: |
      System prompt instructs agent to:
      1. Call recipes_scraper tool → get recipe JSON
      2. Call pexels image search tool → get image + photographer
      3. Return ONLY valid JSON matching RecipeCard schema (no prose outside JSON)

  recipe_card_schema:
    message: "string — friendly intro sentence"
    recipe:
      title: string
      description: "string | null"
      prep_time: "string | null"
      cook_time: "string | null"
      servings: "int | null"
      ingredients: "[string]"
      instructions: "[string]"
      tags: "[string] | null"
      source_url: "string | null"
    image: "object | null"
    image_fields:
      url: string
      alt: string
      photographer: string
      photographer_url: string

  runner:
    call: "result = await Runner.run(agent, input=message)"
    output: "result.final_output — JSON string"
    parse: "json.loads(result.final_output)"
    fallback: "{message: raw_output, recipe: null, image: null}"

  lifecycle:
    - "Both MCP servers started in FastAPI lifespan via lifespan_mcp(app)"
    - "app.state.mcp_servers = [apify_server, pexels_server] set on startup"
    - "create_recipe_agent(mcp_servers) called per request — agent is stateless"
    - "os.environ[GEMINI_API_KEY] set at module load from settings"
    - "MCP servers disconnect cleanly in lifespan finally block"

  boundaries:
    - "Runner.run() — NOT run_streamed() (see MEMORY.md)"
    - "Agent MUST return JSON parseable to RecipeCard schema"
    - "Photographer credit is mandatory (Pexels API ToS)"
    - "image field is null if Pexels returns no result"
@end
```
