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

/* Copia un video de Drive al bucket público "videos" de Supabase Storage y
   devuelve su enlace, que termina en .mp4. El nombre es el id del archivo de
   Drive: volver a programar el mismo reel reutiliza la copia. Los videos de más
   de 60 días se borran aquí mismo para no llenar el 1 GB del plan gratis. */
const BUCKET = "videos";
const LIMITE = 50 * 1024 * 1024;

async function copiarVideo(url: string) {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const driveId = new URL(url).searchParams.get("id") ?? crypto.randomUUID();
  const nombre = `${driveId.replace(/[^A-Za-z0-9_-]/g, "")}.mp4`;

  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  if (!bucket) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: true });
    if (error && !/exist/i.test(error.message)) throw error;
  }

  const publica = admin.storage.from(BUCKET).getPublicUrl(nombre).data.publicUrl;
  const { data: ya } = await admin.storage.from(BUCKET).list("", { search: nombre });
  if (ya?.some((f) => f.name === nombre)) return publica;

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Drive respondió ${r.status}`);
  const tam = Number(r.headers.get("content-length") ?? 0);
  if (tam > LIMITE) throw new Error(`video de ${Math.round(tam / 1048576)} MB, pasa del límite de 50 MB`);
  const datos = new Uint8Array(await r.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET)
    .upload(nombre, datos, { contentType: "video/mp4", upsert: true });
  if (error) throw error;

  // limpieza de copias viejas
  const { data: todos } = await admin.storage.from(BUCKET).list("", { limit: 1000 });
  const corte = Date.now() - 60 * 24 * 3600 * 1000;
  const viejos = (todos ?? []).filter((f) => f.created_at && Date.parse(f.created_at) < corte)
    .map((f) => f.name);
  if (viejos.length) await admin.storage.from(BUCKET).remove(viejos);

  return publica;
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
      accion, id, blogId, texto = "", media = [], videos = [], redes = [],
      fecha, zona = "America/New_York", borrador = false, tipoInstagram, tipoFacebook,
      q = "", cursor = "", ubicacion, audioIg, musicaTiktok, portada,
    } = await req.json();

    if (!blogId) return responder({ error: "Falta el blogId de la marca." }, 400);

    // Quitar una publicación programada: pasa cuando en la app se retira la aprobación
    // del diseño de algo que se había programado solo.
    if (accion === "borrar") {
      if (!id) return responder({ error: "Falta el id de la publicación." }, 400);
      await metricool(`/v2/scheduler/posts/${encodeURIComponent(String(id))}`, blogId, { method: "DELETE" });
      return responder({ ok: true, borrada: id });
    }
    // Catálogos para elegir desde la app: música de Instagram, canciones en tendencia
    // de TikTok y lugares (Instagram y Facebook usan los lugares de Facebook).
    // Sin texto de búsqueda, Instagram devuelve sus sugerencias.
    if (accion === "musica-ig") {
      const ruta = new URLSearchParams({ limit: "25" });
      if (q) ruta.set("searchQuery", String(q));
      if (cursor) ruta.set("musicCursor", String(cursor));
      const r = await metricool(`/v2/scheduler/catalogs/instagram/audio?${ruta}`, blogId);
      return responder({ ok: true, data: r?.data ?? r });
    }
    if (accion === "musica-tiktok") {
      const r = await metricool(
        "/v2/scheduler/catalogs/tiktok/trending-tracks?countryCode=US&dateRange=7DAY", blogId);
      return responder({ ok: true, data: r?.data ?? r });
    }
    if (accion === "ubicacion") {
      const r = await metricool(
        `/actions/facebook/search-location?q=${encodeURIComponent(String(q))}`, blogId);
      return responder({ ok: true, data: r?.data ?? r });
    }

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

    // Los videos (reels, YouTube) llegan como enlace de descarga directa de Drive.
    // Metricool no reconoce ese enlace como video (no termina en .mp4): normalize lo
    // devuelve igual y el planificador dice "Preview not available for this url".
    // Por eso el video se copia primero a Supabase Storage, con un nombre .mp4, y es
    // ese enlace el que se normaliza y se manda. Si la copia no se puede hacer
    // (archivo de más de 50 MB en el plan gratis, por ejemplo), queda el de Drive.
    const listos: string[] = [];
    for (const url of (videos as string[]).filter(Boolean)) {
      let fuente = url;
      try {
        fuente = await copiarVideo(url);
      } catch (e) {
        console.log("copia del video falló →", String(e?.message ?? e).slice(0, 300));
      }
      try {
        const normal = await metricool(
          `/actions/normalize/image/url?url=${encodeURIComponent(fuente)}`, blogId);
        const u = typeof normal === "string" ? normal.trim() : JSON.stringify(normal);
        console.log("video normalize →", u.slice(0, 300));
        listos.push(u.startsWith("http") ? u : fuente);
      } catch (e) {
        console.log("video normalize falló →", String(e?.message ?? e).slice(0, 300));
        listos.push(fuente);
      }
    }
    const archivos = [...listos, ...imagenes];

    // --- 4. Se crea la publicación programada ---
    const cuerpo: Record<string, unknown> = {
      text: texto,
      providers: destinos.map((network) => ({ network })),
      publicationDate: { dateTime: fecha, timezone: zona },
      draft: !!borrador,
      autoPublish: !borrador,
      media: archivos,
    };
    if (tipoInstagram && destinos.includes("instagram")) {
      const ig: Record<string, unknown> = { type: tipoInstagram };
      // la música de Instagram va en reels e historias
      if (audioIg?.audioId && (tipoInstagram === "REEL" || tipoInstagram === "STORY")) {
        ig.audioConfiguration = audioIg;
        ig.audioName = audioIg.title;
      }
      cuerpo.instagramData = ig;
    }
    if (musicaTiktok?.musicId && destinos.includes("tiktok")) {
      cuerpo.tiktokData = { privacyOption: "PUBLIC_TO_EVERYONE", music: musicaTiktok };
    }
    if (ubicacion?.id) cuerpo.location = ubicacion;

    // Portada propia del reel: Metricool la toma como miniatura del video. Si no se
    // puede preparar, el reel sale igual con el primer cuadro como portada.
    if (portada && listos.length) {
      try {
        const normal = await metricool(
          `/actions/normalize/image/url?url=${encodeURIComponent(portada)}`, blogId);
        const u = typeof normal === "string" ? normal.trim() : "";
        if (u.startsWith("http")) cuerpo.videoThumbnailUrl = u;
      } catch (e) {
        console.log("portada falló →", String(e?.message ?? e).slice(0, 300));
      }
    }
    if (tipoFacebook && destinos.includes("facebook")) {
      cuerpo.facebookData = { type: tipoFacebook };
    }

    console.log("media enviada →", JSON.stringify(archivos).slice(0, 600));
    console.log("redes enviadas →", JSON.stringify({
      instagramData: cuerpo.instagramData, tiktokData: cuerpo.tiktokData,
      location: cuerpo.location, videoThumbnailUrl: cuerpo.videoThumbnailUrl,
    }).slice(0, 800));
    const creada = await metricool("/v2/scheduler/posts", blogId, {
      method: "POST",
      body: JSON.stringify(cuerpo),
    });
    // lo que Metricool guardó de verdad, para comparar con lo enviado
    const g = creada?.data ?? creada ?? {};
    console.log("redes guardadas →", JSON.stringify({
      instagramData: g.instagramData, tiktokData: g.tiktokData,
      location: g.location, videoThumbnailUrl: g.videoThumbnailUrl,
    }).slice(0, 800));

    return responder({
      ok: true,
      id: creada?.data?.id ?? creada?.id ?? null,
      media: archivos,
      redes: destinos,
      fecha,
      zona,
    });
  } catch (e) {
    return responder({ error: e.message ?? String(e) }, 500);
  }
});
