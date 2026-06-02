import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Agentic Cookbook",
  description: "How Agentic Cookbook collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 py-16 px-4">
      <article className="max-w-3xl mx-auto prose dark:prose-invert prose-headings:tracking-tight">
        <h1>Privacy Policy</h1>
        <p className="lead">Last updated: June 2026</p>

        <h2>1. Data We Collect</h2>
        <ul>
          <li><strong>Account data:</strong> Name, email address, and hashed password when you sign up.</li>
          <li><strong>Conversation data:</strong> Messages you send to the AI recipe assistant and the recipes it returns.</li>
          <li><strong>Consent records:</strong> Your cookie consent preferences, including a SHA-256 hash of your IP address (never stored in plain text) and user-agent string.</li>
          <li><strong>Session data:</strong> Authentication tokens stored in secure HTTP-only cookies.</li>
        </ul>

        <h2>2. How We Use Your Data</h2>
        <ul>
          <li>To provide and improve the recipe discovery service.</li>
          <li>To authenticate your identity and protect your account.</li>
          <li>To comply with legal obligations (GDPR, CCPA).</li>
        </ul>

        <h2>3. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. When you request deletion,
          your data is scheduled for permanent removal within 30 days.
        </p>

        <h2>4. Your Rights (GDPR)</h2>
        <p>If you are located in the European Economic Area, you have the right to:</p>
        <ul>
          <li><strong>Access:</strong> View your personal data via your <Link href="/profile">Profile</Link>.</li>
          <li><strong>Portability:</strong> Export all your data as a JSON file from your Profile.</li>
          <li><strong>Erasure:</strong> Request permanent deletion of your account and all associated data.</li>
          <li><strong>Rectification:</strong> Update your name at any time.</li>
        </ul>

        <h2>5. Your Rights (CCPA)</h2>
        <p>
          If you are a California resident, you have the right to know what personal information
          is collected and to request its deletion. <strong>We do not sell your personal information
          to third parties.</strong>
        </p>

        <h2>6. Cookies</h2>
        <ul>
          <li><strong>Essential cookies:</strong> Authentication session cookies. Required for the app to function.</li>
          <li><strong>Analytics cookies:</strong> Optional. Only set if you consent via the cookie banner.</li>
        </ul>

        <h2>7. Third-Party Services</h2>
        <ul>
          <li><strong>Pexels:</strong> Recipe photos are sourced from Pexels. Their <a href="https://www.pexels.com/privacy-policy/" target="_blank" rel="noopener noreferrer">privacy policy</a> applies to image delivery.</li>
          <li><strong>Neon:</strong> Our database is hosted on Neon (EU region) for data residency compliance.</li>
          <li><strong>Google Gemini:</strong> Your recipe queries are processed by Google&apos;s Gemini AI model. No personal data beyond the recipe query is sent.</li>
        </ul>

        <h2>8. Contact</h2>
        <p>
          For privacy inquiries, email us at <strong>privacy@agentic-cookbook.app</strong>.
        </p>

        <div className="mt-12 pt-6 border-t border-border not-prose text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">← Back to app</Link>
        </div>
      </article>
    </div>
  );
}
