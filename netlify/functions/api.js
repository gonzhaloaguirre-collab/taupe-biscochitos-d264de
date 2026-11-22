import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const store = getStore("gcw-site-data");
const DEFAULT_AVAILABILITY = {
  organizations: [
    { id: "edu", name: "Educación", status: "available", description: "Refuerzo y actividades educativas" },
    { id: "salud", name: "Salud", status: "soon", description: "Próximamente" },
    { id: "comunidad", name: "Comunidad", status: "soon", description: "Próximamente" }
  ],
  partners: [
    { id: "escuelas", name: "Educación", status: "available", description: "Actividades y refuerzo educativo" },
    { id: "mujeres", name: "Espacios para mujeres", status: "available", description: "Acompañamiento y apoyo comunitario" },
    { id: "mayores", name: "Casa de reposo", status: "available", description: "Encuentros y actividades compartidas" }
  ],
  districts: [
    { id: "jesus-maria", name: "Jesús María", status: "available", description: "Distrito en actividad. Líneas previstas: educación, acompañamiento comunitario y colaboración con instituciones educativas, espacios de apoyo y centros para personas mayores." },
    { id: "brena", name: "Breña", status: "available", description: "Distrito en actividad. Líneas previstas: educación, acompañamiento comunitario y colaboración con instituciones educativas, espacios de apoyo y centros para personas mayores." },
    { id: "san-miguel", name: "San Miguel", status: "soon", description: "Próxima zona de expansión. Se evaluarán necesidades locales y posibles alianzas." },
    { id: "pueblo-libre", name: "Pueblo Libre", status: "soon", description: "Próxima zona de expansión. Se evaluarán necesidades locales y posibles alianzas." },
    { id: "cercado-lima", name: "Cercado de Lima", status: "soon", description: "Próxima zona de expansión. Se evaluarán necesidades locales y posibles alianzas." },
    { id: "callao", name: "Callao", status: "soon", description: "Próxima zona de expansión. Se evaluarán necesidades locales y posibles alianzas." }
  ]
};
const DEFAULT_PALETTE = {
  "--purple":"#5b16a8", "--deep":"#26004d", "--lav":"#eadbff", "--yellow":"#ffd400",
  "--cream":"#fff9e8", "--ink":"#292333", "--muted":"#756f7d", "--white":"#fff"
};
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
});
const secret = () => process.env.SESSION_SECRET || "";
function sign(value) { return crypto.createHmac("sha256", secret()).update(value).digest("base64url"); }
function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}
function validSession(request) {
  if (!secret()) return false;
  const token = cookieValue(request, "gcw_admin_session");
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return false;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString()); return data.exp > Date.now(); }
  catch { return false; }
}
function sessionCookie(request) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  return `gcw_admin_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
function sanitizeMarkup(input) {
  return String(input ?? "").replace(/<\s*(script|style|iframe|object|svg)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<\/?([a-z0-9-]+)(?:\s[^>]*)?>/gi, (tag, name) => {
      const n = name.toLowerCase();
      if (!["br", "em", "strong", "b", "i", "u"].includes(n)) return "";
      return tag.startsWith("</") ? `</${n}>` : (n === "br" ? "<br>" : `<${n}>`);
    }).slice(0, 12000);
}
async function readJSON(key, fallback) { return await store.get(key, { type: "json" }) ?? fallback; }

export default async (request) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || url.pathname.split("/").filter(Boolean).at(-1) || "";
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": url.origin, "access-control-allow-methods": "GET,POST", "access-control-allow-headers": "content-type" } });

  if (request.method === "GET" && action === "public") {
    const [content, palette, availability] = await Promise.all([
      readJSON("site/content", {}), readJSON("site/palette", DEFAULT_PALETTE), readJSON("site/availability", DEFAULT_AVAILABILITY)
    ]);
    return json({ content, palette, availability });
  }

  if (request.method !== "POST" || !sameOrigin(request)) return json({ error: "Solicitud no permitida." }, 405);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Formato inválido." }, 400); }

  if (action === "login") {
    const password = process.env.ADMIN_PASSWORD || "";
    if (!password || !secret()) return json({ error: "Falta configurar ADMIN_PASSWORD y SESSION_SECRET en Netlify." }, 503);
    if (!safeEqual(body.password || "", password)) return json({ error: "Contraseña incorrecta." }, 401);
    return json({ ok: true }, 200, { "set-cookie": sessionCookie(request) });
  }
  if (action === "volunteer") {
    if (body.website) return json({ ok: true }); // honeypot anti-spam
    const required = ["name", "age", "district", "email", "organization"];
    if (required.some(k => !String(body[k] || "").trim())) return json({ error: "Completa todos los campos obligatorios." }, 400);
    if (!/^\S+@\S+\.\S+$/.test(String(body.email)) || Number(body.age) < 15 || Number(body.age) > 99) return json({ error: "Revisa el correo y la edad ingresados." }, 400);
    if (body.consent !== "yes") return json({ error: "Se requiere aceptar el aviso de privacidad." }, 400);
    const id = `${Date.now()}-${crypto.randomUUID()}`;
    const record = { ...body, id, submittedAt: new Date().toISOString() };
    delete record.website;
    await store.setJSON(`applications/${id}.json`, record);
    return json({ ok: true });
  }

  if (action === "logout") {
    return json({ ok: true }, 200, { "set-cookie": "gcw_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0" });
  }
  if (!validSession(request)) return json({ error: "Tu sesión expiró. Vuelve a ingresar." }, 401);

  if (action === "admin-data" && request.method === "POST") {
    const [content, palette, availability] = await Promise.all([
      readJSON("site/content", {}), readJSON("site/palette", DEFAULT_PALETTE), readJSON("site/availability", DEFAULT_AVAILABILITY)
    ]);
    const keys = await store.list({ prefix: "applications/" });
    const applications = await Promise.all((keys.blobs || []).map(async item => store.get(item.key, { type: "json" })));
    applications.sort((a, b) => String(b?.submittedAt || "").localeCompare(String(a?.submittedAt || "")));
    return json({ content, palette, availability, applications });
  }
  if (action === "save-content") {
    const current = await readJSON("site/content", {});
    const updates = body.content || {};
    for (const [key, value] of Object.entries(updates)) {
      if (/^[a-zA-Z0-9_-]{1,80}$/.test(key)) current[key] = sanitizeMarkup(value);
    }
    await store.setJSON("site/content", current);
    return json({ ok: true, content: current });
  }
  if (action === "save-palette") {
    const palette = {};
    for (const key of Object.keys(DEFAULT_PALETTE)) {
      const value = String((body.palette || {})[key] || "");
      if (/^#[0-9a-fA-F]{6}$/.test(value)) palette[key] = value;
    }
    await store.setJSON("site/palette", { ...DEFAULT_PALETTE, ...palette });
    return json({ ok: true });
  }
  if (action === "save-availability") {
    const incoming = body.availability || {};
    const current = await readJSON("site/availability", DEFAULT_AVAILABILITY);
    const mergeGroup = (key) => DEFAULT_AVAILABILITY[key].map(base => {
      const previous = (current[key] || []).find(x => x.id === base.id || x.name === base.name) || base;
      const found = (incoming[key] || []).find(x => x.id === base.id || x.name === base.name) || {};
      const status = ["available", "unavailable", "soon"].includes(found.status) ? found.status : previous.status;
      return { ...base, ...previous, ...found, id: base.id, status,
        name: String(found.name ?? previous.name ?? base.name).trim().slice(0,100),
        description: String(found.description ?? previous.description ?? base.description ?? "").slice(0,1500) };
    });
    const availability = { districts: mergeGroup("districts"), organizations: mergeGroup("organizations"), partners: mergeGroup("partners") };
    await store.setJSON("site/availability", availability);
    return json({ ok: true, availability });
  }
  return json({ error: "Acción desconocida." }, 404);
};
