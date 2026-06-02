"use client";

import { useState, useEffect } from "react";
import { getConsent, setConsent, type ConsentPref } from "@/lib/consent";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const pref = getConsent();
    if (!pref) setVisible(true);
  }, []);

  async function handleAccept(analytics: boolean) {
    const pref: ConsentPref = { essential: true, analytics };
    setConsent(pref);
    setVisible(false);

    // Best-effort POST to backend — fire and forget
    try {
      const API = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${API}/api/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pref),
      });
    } catch {
      // Consent cookie is already set locally — backend log is optional
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="max-w-lg mx-auto bg-white dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <Cookie className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">We value your privacy</h3>
            <p className="text-xs text-muted-foreground mt-1">
              We use essential cookies for authentication. Analytics cookies help us improve
              the experience. You can change your preference anytime in your profile.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => handleAccept(false)}
            variant="outline"
            size="sm"
          >
            Essential only
          </Button>
          <Button
            onClick={() => handleAccept(true)}
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
