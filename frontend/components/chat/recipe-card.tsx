"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, ExternalLink } from "lucide-react";
import type { RecipeResponse } from "@/types";

interface RecipeCardProps {
  data: RecipeResponse;
}

export function RecipeCard({ data }: RecipeCardProps) {
  const { recipe, image, message } = data;
  const [imgError, setImgError] = useState(false);
  const showHero = Boolean(image?.url) && !imgError;

  if (!recipe) {
    return (
      <Card className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur border-0 shadow-lg">
        <CardContent className="p-6">
          <p className="text-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-white/60 dark:bg-neutral-800/60 backdrop-blur border-0 shadow-xl group">
      {/* Hero Image */}
      {showHero && image && (
        <div className="relative h-56 sm:h-64 w-full overflow-hidden">
          <Image
            src={image.url}
            alt={image.alt || recipe.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 600px"
            onError={() => setImgError(true)}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg leading-tight">
              {recipe.title}
            </h3>
          </div>
          {image.photographer && (
            <div className="absolute top-3 right-3">
              <a
                href={image.photographer_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-white/70 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm hover:text-white transition-colors"
              >
                📷 {image.photographer}
              </a>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Title — shown here when there is no hero image (or it failed to load) */}
        {!showHero && (
          <h3 className="text-xl sm:text-2xl font-bold leading-tight">
            {recipe.title}
          </h3>
        )}

        {/* Message */}
        {message && (
          <p className="text-sm text-muted-foreground italic">{message}</p>
        )}

        {/* Meta Badges */}
        <div className="flex flex-wrap gap-2">
          {recipe.prep_time && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" /> Prep: {recipe.prep_time}
            </Badge>
          )}
          {recipe.cook_time && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" /> Cook: {recipe.cook_time}
            </Badge>
          )}
          {recipe.servings && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" /> Serves {recipe.servings}
            </Badge>
          )}
          {recipe.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-orange-600 border-orange-300 dark:border-orange-700 dark:text-orange-400">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-foreground/80">{recipe.description}</p>
        )}

        {/* Two-Column: Ingredients | Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ingredients */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3">
              Ingredients
            </h4>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3">
              Instructions
            </h4>
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="text-sm flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-xs font-bold text-orange-700 dark:text-orange-300">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Source URL */}
        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" /> View original recipe
          </a>
        )}
      </CardContent>
    </Card>
  );
}
