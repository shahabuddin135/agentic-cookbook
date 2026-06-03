"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ExternalLink, ChefHat, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { Recipe, RecipeImage } from "@/types";

interface RecipeDialogProps {
  recipe: Recipe;
  image: RecipeImage | null;
  /** The element that opens the dialog (rendered as the trigger). */
  trigger: ReactNode;
}

/**
 * "Cook mode" — an immersive, focused view of a single recipe response.
 * Ingredients and steps can be checked off as you cook.
 */
export function RecipeDialog({ recipe, image, trigger }: RecipeDialogProps) {
  const [imgError, setImgError] = useState(false);
  const [checkedIng, setCheckedIng] = useState<Set<number>>(new Set());
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const showHero = Boolean(image?.url) && !imgError;

  function toggle(set: Set<number>, i: number, update: (s: Set<number>) => void) {
    const next = new Set(set);
    next.has(i) ? next.delete(i) : next.add(i);
    update(next);
  }

  return (
    <Dialog>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent
        showCloseButton
        className="max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="max-h-[88vh] overflow-y-auto">
          {/* ── Hero ── */}
          {showHero && image ? (
            <div className="relative h-52 w-full sm:h-64">
              <Image
                src={image.url}
                alt={image.alt || recipe.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 640px"
                onError={() => setImgError(true)}
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <Badge className="mb-2 gap-1 bg-orange-500 text-white">
                  <ChefHat className="h-3 w-3" /> Cook mode
                </Badge>
                <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-lg">
                  {recipe.title}
                </h2>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-5 pt-6">
              <Badge className="mb-2 gap-1 bg-orange-500 text-white">
                <ChefHat className="h-3 w-3" /> Cook mode
              </Badge>
              <h2 className="text-2xl font-bold leading-tight text-foreground">
                {recipe.title}
              </h2>
            </div>
          )}

          <div className="space-y-6 p-5 sm:p-6">
            {/* ── Meta ── */}
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
              <p className="text-sm leading-relaxed text-foreground/80">
                {recipe.description}
              </p>
            )}

            {/* ── Ingredients (checkable) ── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  Ingredients
                </h3>
                <span className="text-xs text-muted-foreground">
                  {checkedIng.size}/{recipe.ingredients.length}
                </span>
              </div>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => {
                  const checked = checkedIng.has(i);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => toggle(checkedIng, i, setCheckedIng)}
                        className="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                            checked
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <span className={cn(checked && "text-muted-foreground line-through")}>
                          {ing}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* ── Steps (checkable) ── */}
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Instructions
              </h3>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => {
                  const done = doneSteps.has(i);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => toggle(doneSteps, i, setDoneSteps)}
                        className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60"
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                            done
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                          )}
                        >
                          {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                        </span>
                        <span
                          className={cn(
                            "pt-0.5 text-sm leading-relaxed",
                            done && "text-muted-foreground line-through"
                          )}
                        >
                          {step}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* ── Source ── */}
            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View the original recipe
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
