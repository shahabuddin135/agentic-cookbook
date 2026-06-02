import os
import sys
from litellm import completion
from dotenv import load_dotenv

load_dotenv()

models = [
    "gemini/gemini-2.0-flash",
    "gemini/gemini-2.0-flash-lite",
    "gemini/gemini-2.0-pro-exp-02-05",
    "gemini/gemini-1.5-flash",
    "gemini/gemini-1.5-pro",
    "gemini/gemini-2.5-flash",
    "gemini/gemini-2.5-pro",
]

api_key = os.getenv("GEMINI_API_KEY")
os.environ["GEMINI_API_KEY"] = api_key

if not api_key:
    print("No GEMINI_API_KEY found")
    sys.exit(1)

for model in models:
    try:
        print(f"Testing {model}...")
        response = completion(
            model=model,
            messages=[{"role": "user", "content": "hi"}],
        )
        print(f"SUCCESS: {model}")
        sys.exit(0)
    except Exception as e:
        print(f"FAILED: {model} - {str(e)[:100]}...")

sys.exit(1)
