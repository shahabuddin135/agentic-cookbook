"""Manual integration test — run directly with: uv run python tests/test_agent_manual.py"""
import asyncio
import json
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agents import Runner
from app.agent.mcp_servers import create_local_recipes_server, create_pexels_server
from app.agent.agent import create_recipe_agent


async def main():
    local_recipes = create_local_recipes_server()
    pexels = create_pexels_server()

    async with local_recipes, pexels:
        mcp_servers = [local_recipes, pexels]
        agent = create_recipe_agent(mcp_servers)

        print("Sending request to agent...")
        result = await Runner.run(agent, input="simple pasta carbonara recipe")
        raw_output = result.final_output
        print("\n=== RAW OUTPUT ===")
        print(raw_output)

        try:
            parsed = json.loads(raw_output)
            print("\n=== PARSED ===")
            print(f"message: {parsed.get('message')}")
            print(f"recipe title: {parsed.get('recipe', {}).get('title')}")
            print(f"ingredients count: {len(parsed.get('recipe', {}).get('ingredients', []))}")
            print(f"image url: {parsed.get('image', {}).get('url') if parsed.get('image') else 'None'}")
            print(f"photographer: {parsed.get('image', {}).get('photographer') if parsed.get('image') else 'None'}")
        except json.JSONDecodeError as e:
            print(f"\n!!! JSON PARSE FAILED: {e}")
            print("Fallback will be used in production")


if __name__ == "__main__":
    asyncio.run(main())
