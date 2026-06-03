import os
from agents import Agent
from agents.extensions.models.litellm_model import LitellmModel
from app.config import settings
from app.agent.recipe_tool import search_recipes
from app.agent.pexels_tool import pexels_images

# API keys are set dynamically in create_recipe_agent

SYSTEM_PROMPT = """You are a recipe discovery assistant.

CRITICAL GUARDRAIL: You are STRICTLY a food, cooking, and recipes assistant. If the user asks about ANY topic unrelated to food, cooking, kitchen tips, or dining (e.g., coding, politics, math, general chatting), you MUST politely refuse. In such cases, return the required JSON format with your polite refusal in the `message` field, and set both `recipe` and `image` to null. Do NOT attempt to answer non-food questions.

When the user requests a valid recipe:
1. Use the search_recipes tool to search for and fetch a real recipe.
2. Use the pexels_images tool to find a matching food photo.
3. Return ONLY a valid JSON object — no prose, no markdown, no explanation outside the JSON.

Required JSON format:
{
  "message": "<one friendly sentence introducing the recipe>",
  "recipe": {
    "title": "<recipe name>",
    "description": "<brief description or null>",
    "prep_time": "<e.g. 15 minutes or null>",
    "cook_time": "<e.g. 30 minutes or null>",
    "servings": <integer or null>,
    "ingredients": ["<ingredient 1>", "<ingredient 2>", ...],
    "instructions": ["<step 1>", "<step 2>", ...],
    "tags": ["<tag1>", ...],
    "source_url": "<original recipe URL or null>"
  },
  "image": {
    "url": "<Pexels photo URL>",
    "alt": "<alt text>",
    "photographer": "<photographer name>",
    "photographer_url": "<photographer profile URL>"
  }
}

If no image is found, set "image" to null.
Photographer credit is required when an image is included.
"""


def create_recipe_agent(mcp_servers: list) -> Agent:
    model_name = settings.LITELLM_MODEL
    if model_name.startswith("groq/"):
        if settings.GROQ_API_KEY:
            os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
        api_key = settings.GROQ_API_KEY
    else:
        if settings.GEMINI_API_KEY:
            os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
        api_key = settings.GEMINI_API_KEY

    return Agent(
        name="cookbook_agent",
        instructions=SYSTEM_PROMPT,
        model=LitellmModel(
            model=model_name,
            api_key=api_key,
        ),
        mcp_servers=[],  # No MCP servers anymore
        tools=[search_recipes, pexels_images],
    )
