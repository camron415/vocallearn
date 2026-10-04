"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GlassButton } from "@/components/Glass";
import { MenuSheet } from "@/components/MenuSheet";
import { SimpleSheet } from "@/components/SimpleSheet";
import { useCoarsePointer } from "@/lib/coarse-pointer";
import { createClient } from "@/lib/supabase/client";
import type { HaloRecipe } from "@/lib/types";

type LibraryCache = {
  recipes: HaloRecipe[];
  photos: Record<string, string>;
};

let libraryCache: LibraryCache | null = null;

function decodeImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

async function photosFor(recipes: HaloRecipe[]) {
  const paths = recipes
    .map((recipe) => recipe.photo_path)
    .filter((path): path is string => Boolean(path));
  if (!paths.length) return {};
  const supabase = createClient();
  const rows = await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage
        .from("halo-recipe-photos")
        .createSignedUrl(path, 60 * 60);
      return [path, data?.signedUrl] as const;
    })
  );
  const photos: Record<string, string> = {};
  for (const [path, url] of rows) {
    if (url) photos[path] = url;
  }
  await Promise.all(Object.values(photos).map((src) => decodeImage(src)));
  return photos;
}

function EmbeddedSheet({
  open,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  cardClassName?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return <>{children}</>;
}

export function LibraryMenu({
  demo = false,
  hideTrigger = false,
  embedded = false,
  open: openProp,
  onOpenChange,
}: {
  demo?: boolean;
  hideTrigger?: boolean;
  embedded?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) setInnerOpen(next);
  };
  const coarse = useCoarsePointer();
  const Sheet = embedded ? EmbeddedSheet : coarse ? SimpleSheet : MenuSheet;
  const [recipes, setRecipes] = useState<HaloRecipe[] | null>(
    libraryCache?.recipes ?? null
  );
  const [photos, setPhotos] = useState<Record<string, string>>(
    libraryCache?.photos ?? {}
  );
  const [ready, setReady] = useState(Boolean(libraryCache));
  const [loading, setLoading] = useState(false);
  const [recipeError, setRecipeError] = useState("");

  useEffect(() => {
    if (open || embedded) return;
    setRecipes(null);
    setPhotos({});
    setReady(false);
    setLoading(false);
    setRecipeError("");
  }, [open, embedded]);

  useEffect(() => {
    if (embedded || !recipes?.length) return;
    const paths = recipes
      .map((recipe) => recipe.photo_path)
      .filter((path): path is string => Boolean(path));
    if (!paths.length) return;
    const supabase = createClient();
    let cancelled = false;
    void Promise.all(
      paths.map(async (path) => {
        const { data } = await supabase.storage
          .from("halo-recipe-photos")
          .createSignedUrl(path, 60 * 60);
        return [path, data?.signedUrl] as const;
      })
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [path, url] of rows) {
        if (url) next[path] = url;
      }
      setPhotos(next);
    });
    return () => {
      cancelled = true;
    };
  }, [embedded, recipes]);

  useEffect(() => {
    if (!embedded || !open || demo) return;
    if (libraryCache) {
      setRecipes(libraryCache.recipes);
      setPhotos(libraryCache.photos);
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    setRecipeError("");
    void (async () => {
      try {
        const res = await fetch("/api/recipes");
        const data = (await res.json().catch(() => ({}))) as {
          recipes?: HaloRecipe[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setRecipeError(data.error || "Could not load recipes.");
          setReady(true);
          return;
        }
        const list = Array.isArray(data.recipes) ? data.recipes : [];
        const nextPhotos = await photosFor(list);
        if (cancelled) return;
        libraryCache = { recipes: list, photos: nextPhotos };
        setRecipes(list);
        setPhotos(nextPhotos);
        setReady(true);
      } catch {
        if (!cancelled) {
          setRecipeError("Could not load recipes.");
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [embedded, open, demo]);

  async function showRecipes() {
    if (demo || loading) return;
    setLoading(true);
    setRecipeError("");
    try {
      const res = await fetch("/api/recipes");
      const data = (await res.json().catch(() => ({}))) as {
        recipes?: HaloRecipe[];
        error?: string;
      };
      if (!res.ok) {
        setRecipeError(data.error || "Could not load recipes.");
        return;
      }
      setRecipes(Array.isArray(data.recipes) ? data.recipes : []);
    } catch {
      setRecipeError("Could not load recipes.");
    } finally {
      setLoading(false);
    }
  }

  const saved =
    recipes == null ? null : recipes.length === 0 ? (
      <p className="login-sub">
        No recipes yet. After Cove gives you one, tap{" "}
        <strong>Save this recipe</strong> under the answer.
      </p>
    ) : (
      <ul className="recipe-list">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="recipe-card">
            <h2>{recipe.title}</h2>
            {recipe.ingredients ? (
              <>
                <h3>Ingredients</h3>
                <pre>{recipe.ingredients}</pre>
              </>
            ) : null}
            {recipe.steps ? (
              <>
                <h3>Steps</h3>
                <pre>{recipe.steps}</pre>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    );

  const sheetRecipes =
    recipes == null ? null : recipes.length === 0 ? (
      <p className="phone-menu-empty">
        No recipes yet. After Cove gives you one, tap Save this recipe under the answer.
      </p>
    ) : (
      <ul className="phone-recipe-list">
        {recipes.map((recipe) => {
          const src = recipe.photo_path ? photos[recipe.photo_path] : undefined;
          return (
            <li key={recipe.id} className="phone-recipe">
              {src ? <img className="phone-recipe-photo" src={src} alt="" /> : null}
              <p className="phone-recipe-title">{recipe.title}</p>
              {recipe.ingredients ? (
                <p className="phone-recipe-copy">{recipe.ingredients}</p>
              ) : null}
              {recipe.steps ? <p className="phone-recipe-copy">{recipe.steps}</p> : null}
            </li>
          );
        })}
      </ul>
    );

  const recipeBody = embedded ? (
    demo ? (
      <p className="login-sub">Preview only</p>
    ) : recipeError && recipes == null ? (
      <p className="form-error">{recipeError}</p>
    ) : ready ? (
      sheetRecipes
    ) : null
  ) : (
    saved ?? (
      <>
        <p className="field-label">Saved recipes</p>
        <p className="login-sub">
          Recipes you saved from chat. After a cooking answer, tap{" "}
          <strong>Save this recipe</strong> under the reply.
        </p>
        {recipeError ? <p className="form-error">{recipeError}</p> : null}
        <GlassButton
          onClick={() => void showRecipes()}
          disabled={demo || loading}
        >
          {demo ? "Preview only" : loading ? "Opening…" : "Open saved recipes"}
        </GlassButton>
      </>
    )
  );

  return (
    <div className="history-wrap" data-saves-pocket>
      {hideTrigger ? null : (
      <GlassButton title="Open library" onClick={() => setOpen(true)}>
        <span className="topbar-action-label">Library</span>
        <svg
          className="topbar-action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </GlassButton>
      )}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={recipes ? "Recipes" : "Library"}
        titleId="library-title"
        cardClassName="settings-page"
      >
        {embedded ? (
          recipeBody
        ) : (
          <section className="settings-block settings-block--end">
            {recipeBody}
          </section>
        )}
      </Sheet>
    </div>
  );
}
