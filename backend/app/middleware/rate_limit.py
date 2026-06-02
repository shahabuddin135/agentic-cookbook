from collections import defaultdict, deque
from datetime import datetime, timedelta
from fastapi import HTTPException

# In-memory store: {user_id: deque of request timestamps}
_request_log: dict[str, deque] = defaultdict(deque)
WINDOW = timedelta(minutes=1)
MAX_REQUESTS = 10

def check_rate_limit(user_id: str) -> None:
    now = datetime.utcnow()
    window_start = now - WINDOW
    log = _request_log[user_id]

    # Remove timestamps outside the window
    while log and log[0] < window_start:
        log.popleft()

    if len(log) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Max 10 requests per minute.",
            headers={"Retry-After": "60"},
        )

    log.append(now)
