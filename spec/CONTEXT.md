# CONTEXT.md — Intent Freezer

> Defines why the system exists and what it is NOT. Immutable unless user explicitly changes it.

```slc
@block CONTEXT cookbook_intent
priority: critical
intent: "Why Agentic Cookbook exists and what it is NOT"
scope: global
depends_on: none

content:
  goal: >
    Build an AI-powered recipe discovery web app. Users type a natural-language
    recipe request; an AI agent fetches a real recipe via the Apify Recipes Scraper
    MCP and a matching photo via the Pexels MCP, then streams a structured
    RecipeCard result back to the user. All chat history is persisted per-user.

  what_it_is:
    - "AI agent chat interface for recipe discovery"
    - "Persistent conversation history per user"
    - "GDPR + CCPA compliant data handling"
    - "JWT-authenticated single-page web app"

  non_goals:
    - "No user-generated recipe creation or editing"
    - "No social features (likes, comments, following, sharing)"
    - "No email verification — accounts are active immediately on sign-up"
    - "No password-reset or email-sending of any kind"
    - "No payments, subscriptions, or monetization"
    - "No mobile-native apps — web browser only"
    - "No multi-language / i18n support"
    - "No admin dashboard or content moderation"
    - "No third-party OAuth (Google, GitHub) — email+password only"
    - "No real-time collaboration"
@end
```
