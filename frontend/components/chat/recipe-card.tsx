"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecipeDialog } from "@/components/chat/recipe-dialog";
import {
  Clock,
  Users,
  ExternalLink,
  Maximize2,
  Copy,
  Check,
} from "lucide-react";
import type { RecipeResponse } from "@/types";

interface RecipeCardProps {
  data: RecipeResponse;
}

export function RecipeCard({ data }: RecipeCardProps) {
  const { recipe, image, message } = data;
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const showHero = Boolean(image?.url) && !imgError;

  /* Plain-text reply (no structured recipe) — render as a simple agent note. */
  if (!recipe) {
    return (
      <div className="rounded-2xl rounded-tl-md bg-card neu-flat p-4 md:p-5 text-sm md:text-base leading-relaxed text-foreground/90">
        {message}
      </div>
    );
  }

  async function handleCopy() {
    if (!recipe) return;
    const text = [
      recipe.title,
      "",
      "Ingredients:",
      ...recipe.ingredients.map((i) => `• ${i}`),
      "",
      "Instructions:",
      ...recipe.instructions.map((s, i) => `${i + 1}. ${s}`),
      recipe.source_url ? `\nSource: ${recipe.source_url}` : "",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }

  return (
    <div className="group overflow-hidden rounded-2xl rounded-tl-md bg-card neu-flat">
      {/* ── Hero image ── */}
      {showHero && image && (
        <div className="relative h-52 w-full overflow-hidden sm:h-60">
          <Image
            src={image.url}
            alt={image.alt || recipe.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 600px"
            onError={() => setImgError(true)}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <h3 className="absolute inset-x-4 bottom-4 text-xl font-bold leading-tight text-white drop-shadow-lg sm:text-2xl">
            {recipe.title}
          </h3>
          {image.photographer && (
            <a
              href={image.photographer_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-1 text-[10px] text-white/70 backdrop-blur-sm transition-colors hover:text-white"
            >
              📷 {image.photographer}
            </a>
          )}
        </div>
      )}

      <div className="space-y-5 p-5 sm:p-6">
        {!showHero && (
          <h3 className="text-xl font-bold leading-tight sm:text-2xl">
            {recipe.title}
          </h3>
        )}

        {message && (
          <p className="text-sm italic text-muted-foreground">{message}</p>
        )}

        {/* ── Meta badges ── */}
        <div className="flex flex-wrap gap-2">
          {recipe.prep_time && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" /> Prep {recipe.prep_time}
            </Badge>
          )}
          {recipe.cook_time && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" /> Cook {recipe.cook_time}
            </Badge>
          )}
          {recipe.servings && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" /> Serves {recipe.servings}
            </Badge>
          )}
          {recipe.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {recipe.description && (
          <p className="text-sm text-foreground/80">{recipe.description}</p>
        )}

        {/* ── Ingredients | Instructions ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Ingredients
            </h4>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Instructions
            </h4>
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Action toolbar ── */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <RecipeDialog
            recipe={recipe}
            image={image}
            trigger={
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Cook mode
              </Button>
            }
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </Button>
          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" /> Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
