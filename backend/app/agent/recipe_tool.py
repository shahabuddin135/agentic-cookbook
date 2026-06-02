"""
Recipe search tool — uses TheMealDB free API.
Registered as a @function_tool so it runs in-process (no MCP subprocess needed).
"""

import httpx
from agents import function_tool


@function_tool
async def search_recipes(query: str) -> str:
    """Search for a recipe by name or keyword and return ingredients + instructions."""
    url = f"https://www.themealdb.com/api/json/v1/1/search.php?s={query}"

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            if not data or not data.get("meals"):
                return f"Could not find any recipes for '{query}'."

            meal = data["meals"][0]

            ingredients = []
            for i in range(1, 21):
                ing = meal.get(f"strIngredient{i}")
                meas = meal.get(f"strMeasure{i}")
                if ing and ing.strip():
                    ingredients.append(
                        f"{meas.strip()} {ing.strip()}" if meas and meas.strip() else ing.strip()
                    )

            text = f"Recipe: {meal.get('strMeal')}\n"
            text += f"Category: {meal.get('strCategory')} | Area: {meal.get('strArea')}\n\n"
            text += "Ingredients:\n" + "\n".join(f"- {i}" for i in ingredients) + "\n\n"
            text += "Instructions:\n" + meal.get("strInstructions", "")
            return text

        except Exception as e:
            return f"Error searching for recipe: {e}"
