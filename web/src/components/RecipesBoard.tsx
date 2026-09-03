"use client";

import { useEffect, useRef, useState } from "react";
import { HaloHeader } from "@/components/HaloHeader";
import { GlassButton } from "@/components/Glass";
import { createClient } from "@/lib/supabase/client";
import { compressRecipePhoto } from "@/lib/recipe-image";
import type { HaloProfile, HaloRecipe } from "@/lib/types";
import type { HistoryItem } from "@/components/HistoryMenu";

const PHOTO_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif";

export function RecipesBoard({
  recipes,
  conversations,
  profile,
  onOpenChat,
}: {
  recipes: HaloRecipe[];
  conversations: HistoryItem[];
  profile?: HaloProfile;
  onOpenChat: (id: string) => void;
}) {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState<Record<string, string>>({});
  const [items, setItems] = useState(recipes);
  const [chats, setChats] = useState(conversations);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);
  const previewUrls = useRef<Record<string, string>>({});

  useEffect(() => {
    setItems(recipes);
  }, [recipes]);

  useEffect(() => {
    setChats(conversations);
  }, [conversations]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(previewUrls.current)) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const paths = items
      .map((recipe) => recipe.photo_path)
      .filter((path): path is string => Boolean(path));
    if (!paths.length) return;

    void Promise.all(
      paths.map(async (path) => {
        const { data } = await supabase.storage
          .from("halo-recipe-photos")
          .createSignedUrl(path, 60 * 60);
        return [path, data?.signedUrl] as const;
      })
    ).then((rows) => {
      const next: Record<string, string> = {};
      for (const [path, url] of rows) {
        if (url) next[path] = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
      }
      setPhotos((prev) => ({ ...prev, ...next }));
    });
  }, [items]);

  function setPreview(recipeId: string, blob: Blob) {
    const prev = previewUrls.current[recipeId];
    if (prev) URL.revokeObjectURL(prev);
    const url = URL.createObjectURL(blob);
    previewUrls.current[recipeId] = url;
    setPreviews((current) => ({ ...current, [recipeId]: url }));
  }

  async function addPhoto(recipeId: string, file: File) {
    if (photoBusy) return;
    setPhotoBusy(recipeId);
    setPhotoError((prev) => {
      const next = { ...prev };
      delete next[recipeId];
      return next;
    });
    try {
      const blob = await compressRecipePhoto(file);
      setPreview(recipeId, blob);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in again to add a photo.");

      const path = `${user.id}/${recipeId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("halo-recipe-photos")
        .upload(path, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadError) throw new Error("Could not save that photo.");

      const res = await fetch(`/api/recipes/${recipeId}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || "Could not save that photo."
        );
      }

      const { data: signed } = await supabase.storage
        .from("halo-recipe-photos")
        .createSignedUrl(path, 60 * 60);
      if (signed?.signedUrl) {
        setPhotos((prev) => ({
          ...prev,
          [path]: `${signed.signedUrl}&t=${Date.now()}`,
        }));
      }
      setItems((prev) =>
        prev.map((recipe) =>
          recipe.id === recipeId ? { ...recipe, photo_path: path } : recipe
        )
      );
    } catch (err) {
      setPhotoError((prev) => ({
        ...prev,
        [recipeId]:
          err instanceof Error ? err.message : "Could not save that photo.",
      }));
    } finally {
      setPhotoBusy(null);
    }
  }

  async function removeRecipe(recipeId: string) {
    if (busyId) return;
    setBusyId(recipeId);
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
      if (!res.ok) return;
      setItems((prev) => prev.filter((recipe) => recipe.id !== recipeId));
      const preview = previewUrls.current[recipeId];
      if (preview) {
        URL.revokeObjectURL(preview);
        delete previewUrls.current[recipeId];
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="ask-stage">
      <HaloHeader
        conversations={chats}
        homeHref="/ask"
        showHome
        title="Recipes"
        profile={profile}
        onOpenChat={onOpenChat}
        onDeleted={(id) =>
          setChats((prev) => prev.filter((chat) => chat.id !== id))
        }
      />
      <main className="recipes-main">
        {items.length === 0 ? (
          <p className="chat-empty">
            No recipes yet. After Cove gives you one, tap{" "}
            <strong>Save this recipe</strong> under the answer.
          </p>
        ) : (
          <ul className="recipe-list">
            {items.map((recipe) => {
              const src =
                previews[recipe.id] ||
                (recipe.photo_path ? photos[recipe.photo_path] : undefined);
              return (
                <li key={recipe.id} className="recipe-card">
                  {src ? (
                    <img className="recipe-photo" src={src} alt="" />
                  ) : (
                    <label
                      className={`recipe-photo recipe-photo--empty${
                        photoBusy === recipe.id ? " is-busy" : ""
                      }`}
                    >
                      {photoBusy === recipe.id ? "Adding photo…" : "Add a photo"}
                      <input
                        type="file"
                        accept={PHOTO_ACCEPT}
                        className="sr-only"
                        disabled={photoBusy === recipe.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) void addPhoto(recipe.id, file);
                        }}
                      />
                    </label>
                  )}
                  <div className="recipe-card-head">
                    <h2>{recipe.title}</h2>
                    <GlassButton
                      title="Remove this recipe"
                      disabled={busyId === recipe.id}
                      onClick={() => void removeRecipe(recipe.id)}
                    >
                      Remove
                    </GlassButton>
                  </div>
                  {src ? (
                    <label className="stone-btn recipe-photo-swap">
                      {photoBusy === recipe.id ? "Adding…" : "Change photo"}
                      <input
                        type="file"
                        accept={PHOTO_ACCEPT}
                        className="sr-only"
                        disabled={photoBusy === recipe.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) void addPhoto(recipe.id, file);
                        }}
                      />
                    </label>
                  ) : null}
                  {photoError[recipe.id] ? (
                    <p className="form-error">{photoError[recipe.id]}</p>
                  ) : null}
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
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
