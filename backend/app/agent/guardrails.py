import re

# Words or phrases that immediately trigger a rejection before hitting the LLM
INPUT_TRIPWIRES = [
    "ignore previous instructions",
    "system prompt",
    "write a poem",
    "write code",
    "how to hack",
    "politics",
    "bomb",
    "bypass",
]

# Words or phrases that indicate the LLM hallucinated outside its domain
OUTPUT_TRIPWIRES = [
    "as an ai language model",
    "i cannot fulfill",
    "i'm unable to",
    "def ", # Python function definition
    "class ",
    "<html>",
]

def check_input_guardrails(user_input: str) -> str | None:
    """
    Checks the input against tripwires.
    Returns an error message if a tripwire is triggered, else None.
    """
    lower_input = user_input.lower()
    for tripwire in INPUT_TRIPWIRES:
        if tripwire in lower_input:
            return f"Tripwire Triggered: Your request contains forbidden content related to '{tripwire}'. Please ask only about food and recipes."
    
    # Optional regex-based tripwires (e.g., trying to execute system commands)
    if re.search(r"(rm -rf|sudo |exec\()", lower_input):
        return "Tripwire Triggered: Potentially malicious command detected."
        
    return None

def check_output_guardrails(model_output: str) -> str | None:
    """
    Checks the raw output string from the LLM.
    Returns an error message if a tripwire is triggered, else None.
    """
    lower_output = model_output.lower()
    for tripwire in OUTPUT_TRIPWIRES:
        if tripwire in lower_output:
            return f"Tripwire Triggered: The agent generated forbidden content ('{tripwire}')."
            
    return None
