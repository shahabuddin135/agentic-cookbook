import { redirect } from "next/navigation";

// Root landing. Authenticated users belong in the chat workspace; proxy.ts
// (route protection) bounces unauthenticated visitors from /chat to /sign-in.
export default function Home() {
  redirect("/chat");
}
