// =====================================================================
//  PROGRAMAR — Edge Function de Supabase
//  Recibe una pieza desde el Content Studio y la deja programada en el
//  planificador de Metricool.
//
//  Por qué existe: el token de Metricool NO puede vivir en el index.html.
//  Cualquiera que abra "Ver código fuente" tendría control total de la
//  cuenta, y un mismo token cubre TODAS las marcas. Aquí el token vive en
//  los secretos de Supabase y nunca sale al navegador.
//
//  Cómo desplegarla: ver INSTRUCCIONES.md, al lado de este archivo.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API = "https://app.metricool.com/api";

// Redes que acepta Metricool. Se filtra contra esta lista para no reenviar
// cualquier cosa que llegue desde el navegador.
const REDES = ["instagram", "facebook", "linkedin", "twitter", "threads",
               "tiktok", "bluesky", "pinterest", "youtube"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responder = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

/* Agrega a cada URL las credenciales que Metricool pide en la query. */
function conAuth(ruta: string, blogId: string) {
  const sep = ruta.includes("?") ? "&" : "?";
  const q = new URLSearchParams({
    userToken: Deno.env.get("METRICOOL_TOKEN") ?? "",
    userId: Deno.env.get("METRICOOL_USER_ID") ?? "",
    blogId,
  });
  return `${API}${ruta}${sep}${q}`;
}

async function metricool(ruta: string, blogId: string, init: RequestInit = {}) {
  const r = await fetch(conAuth(ruta, blogId), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Mc-Auth": Deno.env.get("METRICOOL_TOKEN") ?? "",
      ...(init.headers ?? {}),
    },
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`Metricool ${r.status}: ${texto.slice(0, 400)}`);
  try { return JSON.parse(texto); } catch { return texto; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return responder({ error: "Solo POST" }, 405);

  try {
    // --- 1. Solo entra quien tiene sesión iniciada en la app ---
    // Sin esto, cualquiera que descubra la URL podría publicar en las redes
    // de la clienta.
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return responder({ error: "Necesitas iniciar sesión." }, 401);

    if (!Deno.env.get("METRICOOL_TOKEN") || !Deno.env.get("METRICOOL_USER_ID")) {
      return responder({ error: "Faltan los secretos METRICOOL_TOKEN y METRICOOL_USER_ID." }, 500);
    }

    // --- 2. Lo que manda la app ---
    const {
      blogId, texto = "", media = [], redes = [],
      fecha, zona = "America/New_York", borrador = false, tipoInstagram,
    } = await req.json();

    if (!blogId) return responder({ error: "Falta el blogId de la marca." }, 400);
    if (!fecha)  return responder({ error: "Falta la fecha de publicación." }, 400);

    const destinos = (redes as string[]).filter((n) => REDES.includes(n));
    if (!destinos.length) return responder({ error: "Elige al menos una red." }, 400);

    // --- 3. Metricool necesita servir las imágenes desde su propio dominio ---
    // Se le pasa cada URL y devuelve la suya. Si alguna falla, se avisa cuál
    // en vez de programar la pieza con una imagen que no va a cargar.
    const imagenes: string[] = [];
    for (const url of (media as string[]).filter(Boolean)) {
      try {
        const normal = await metricool(
          `/actions/normalize/image/url?url=${encodeURIComponent(url)}`, blogId);
        imagenes.push(typeof normal === "string" ? normal.trim() : String(normal));
      } catch (e) {
        return responder({ error: `No se pudo preparar una de las imágenes: ${e.message}` }, 400);
      }
    }

    // --- 4. Se crea la publicación programada ---
    const cuerpo: Record<string, unknown> = {
      text: texto,
      providers: destinos.map((network) => ({ network })),
      publicationDate: { dateTime: fecha, timezone: zona },
      draft: !!borrador,
      autoPublish: !borrador,
      media: imagenes,
    };
    if (tipoInstagram && destinos.includes("instagram")) {
      cuerpo.instagramData = { type: tipoInstagram };
    }

    const creada = await metricool("/v2/scheduler/posts", blogId, {
      method: "POST",
      body: JSON.stringify(cuerpo),
    });

    return responder({
      ok: true,
      id: creada?.data?.id ?? creada?.id ?? null,
      redes: destinos,
      fecha,
      zona,
    });
  } catch (e) {
    return responder({ error: e.message ?? String(e) }, 500);
  }
});
