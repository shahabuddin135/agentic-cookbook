import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Agentic Cookbook",
  description: "Terms and conditions for using Agentic Cookbook.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 py-16 px-4">
      <article className="max-w-3xl mx-auto prose dark:prose-invert prose-headings:tracking-tight">
        <h1>Terms of Service</h1>
        <p className="lead">Last updated: June 2026</p>

        <h2>1. Acceptance</h2>
        <p>
          By creating an account on Agentic Cookbook, you agree to these Terms of Service
          and our <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>2. Service Description</h2>
        <p>
          Agentic Cookbook is an AI-powered recipe discovery tool. You describe a dish in
          natural language, and our AI agent finds a real recipe along with a photo from Pexels.
        </p>

        <h2>3. User Accounts</h2>
        <ul>
          <li>You must provide accurate information when creating an account.</li>
          <li>You are responsible for maintaining the security of your password.</li>
          <li>One account per person. Automated account creation is prohibited.</li>
        </ul>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for any unlawful purpose.</li>
          <li>Attempt to reverse-engineer, exploit, or overload the service.</li>
          <li>Exceed the rate limit of 10 requests per minute per user.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <ul>
          <li>Recipe content is sourced from public databases and attributed where possible.</li>
          <li>Photos are provided by Pexels under their <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">license</a>.</li>
          <li>Your conversation data belongs to you. You can export or delete it at any time.</li>
        </ul>

        <h2>6. Disclaimers</h2>
        <p>
          Recipes are provided &quot;as-is&quot; from third-party sources. We make no warranties
          regarding their accuracy, nutritional information, or suitability for specific
          dietary needs. Always verify ingredients for allergens.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Agentic Cookbook shall not be liable for
          any indirect, incidental, or consequential damages arising from your use of the service.
        </p>

        <h2>8. Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate these terms.
          You may delete your account at any time from your <Link href="/profile">Profile</Link>.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the service after
          changes constitutes acceptance.
        </p>

        <div className="mt-12 pt-6 border-t border-border not-prose text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">← Back to app</Link>
        </div>
      </article>
    </div>
  );
}
