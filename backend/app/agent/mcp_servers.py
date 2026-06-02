from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan_mcp(app):
    # All tools are now in-process @function_tools.
    # No MCP subprocesses are started, completely bypassing Windows stdio issues.
    app.state.mcp_servers = []
    yield
