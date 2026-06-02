import os
import sys
from litellm import completion
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"Testing Groq API key: {api_key[:10]}...")

os.environ["GROQ_API_KEY"] = api_key

try:
    response = completion(
        model="groq/llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "hi"}],
    )
    print("SUCCESS! Groq API is working.")
except Exception as e:
    print(f"FAILED: {e}")
