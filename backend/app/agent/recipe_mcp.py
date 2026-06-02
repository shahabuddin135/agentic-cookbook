import sys
try:
    import httpx
    from mcp.server.fastmcp import FastMCP
    import json

    mcp = FastMCP("Local Recipe Scraper")

    @mcp.tool()
    async def search_recipes(query: str) -> str:
        """Searches for a recipe based on a query and returns recipe details. Use this when the user asks for a recipe."""
        # We use TheMealDB free API for reliable recipe data
        search_url = f"https://www.themealdb.com/api/json/v1/1/search.php?s={query}"
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(search_url)
                resp.raise_for_status()
                data = resp.json()
                
                if not data or not data.get("meals"):
                    return f"Could not find any recipes for {query}."
                    
                meal = data["meals"][0]
                
                # Extract ingredients
                ingredients = []
                for i in range(1, 21):
                    ing = meal.get(f"strIngredient{i}")
                    meas = meal.get(f"strMeasure{i}")
                    if ing and ing.strip():
                        ingredients.append(f"{meas.strip()} {ing.strip()}" if meas else ing.strip())
                
                recipe_text = f"Recipe: {meal.get('strMeal')}\n"
                recipe_text += f"Category: {meal.get('strCategory')} | Area: {meal.get('strArea')}\n\n"
                recipe_text += "Ingredients:\n" + "\n".join(f"- {i}" for i in ingredients) + "\n\n"
                recipe_text += "Instructions:\n" + meal.get('strInstructions', '')
                
                return recipe_text
                
            except Exception as e:
                return f"Error searching for recipe: {str(e)}"

    if __name__ == "__main__":
        mcp.run(transport="stdio")
except Exception as e:
    with open("mcp_error.txt", "w") as f:
        import traceback
        traceback.print_exc(file=f)
    sys.exit(1)
