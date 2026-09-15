import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export async function signedUrl(bucket: string, path: string | null | undefined, expires = 3600) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/") || path.startsWith("data:")) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expires);
  return data?.signedUrl ?? null;
}

export function useSignedUrl(bucket: string, path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(
    path && (path.startsWith("http") || path.startsWith("/")) ? path : null,
  );
  useEffect(() => {
    let active = true;
    void signedUrl(bucket, path).then((next) => {
      if (active) setUrl(next);
    });
    return () => {
      active = false;
    };
  }, [bucket, path]);
  return url;
}
