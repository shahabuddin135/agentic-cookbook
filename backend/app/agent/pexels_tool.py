"""
Pexels image search tool.
Registered as a @function_tool so it runs in-process, bypassing all Windows subprocess/MCP issues.
"""

import httpx
from agents import function_tool
from app.config import settings


@function_tool
async def pexels_images(query: str) -> str:
    """Search for food photos on Pexels and return image URLs and photographer details. Always use this to find a matching photo for the recipe."""
    if not settings.PEXELS_API_KEY:
        return "Error: PEXELS_API_KEY is not set in environment."

    url = f"https://api.pexels.com/v1/search?query={query}&per_page=1"
    headers = {"Authorization": settings.PEXELS_API_KEY}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            if not data.get("photos"):
                return f"No photos found for '{query}' on Pexels."

            photo = data["photos"][0]

            # Return a clear JSON-like string the LLM can extract fields from
            return str({
                "url": photo["src"]["large"],
                "alt": photo.get("alt", query),
                "photographer": photo["photographer"],
                "photographer_url": photo["photographer_url"]
            })

        except Exception as e:
            return f"Error searching Pexels: {e}"
