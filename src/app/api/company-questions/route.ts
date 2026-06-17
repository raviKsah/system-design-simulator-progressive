import { NextRequest, NextResponse } from "next/server";
import type { CompanyQuestionCandidate, CompanyQuestionResponse } from "@/types/companyQuestions";

export const runtime = "nodejs";

interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

const COMMON_FALLBACKS: Record<string, Omit<CompanyQuestionCandidate, "id">[]> = {
  default: [
    {
      title: "News Feed / Timeline",
      prompt: "Design a personalized feed with follow graph fan-out, ranking, media delivery, and celebrity-user handling.",
      difficulty: "Hard",
      frequency: 3,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Feed", "Ranking", "Fan-out"],
    },
    {
      title: "Chat / Messaging",
      prompt: "Design a reliable real-time messaging system with ordering, delivery receipts, presence, and offline delivery.",
      difficulty: "Hard",
      frequency: 2,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Messaging", "WebSocket", "Ordering"],
    },
    {
      title: "URL Shortener",
      prompt: "Design a URL shortener with low-latency redirects, analytics, custom aliases, abuse prevention, and key generation.",
      difficulty: "Medium",
      frequency: 2,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Caching", "Storage", "IDs"],
    },
  ],
  meta: [
    {
      title: "Instagram / Photo Sharing",
      prompt: "Design Instagram with media upload, CDN delivery, follow feeds, notifications, and feed ranking.",
      difficulty: "Hard",
      frequency: 4,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Media", "Feed", "CDN"],
    },
    {
      title: "News Feed",
      prompt: "Design a Facebook-style feed with fan-out, ranking, freshness, and graceful degradation.",
      difficulty: "Hard",
      frequency: 4,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Feed", "Graph", "Ranking"],
    },
    {
      title: "Messenger / WhatsApp",
      prompt: "Design a chat system with persistent connections, ordering, multi-device sync, and offline delivery.",
      difficulty: "Hard",
      frequency: 3,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Chat", "WebSocket", "Delivery"],
    },
  ],
  google: [
    {
      title: "YouTube / Video Streaming",
      prompt: "Design a video platform with upload, transcoding, metadata search, recommendations, and CDN playback.",
      difficulty: "Hard",
      frequency: 4,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Video", "CDN", "Recommendations"],
    },
    {
      title: "Google Docs",
      prompt: "Design collaborative editing with conflict resolution, presence, comments, version history, and low-latency sync.",
      difficulty: "Hard",
      frequency: 3,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Collaboration", "CRDT", "Realtime"],
    },
    {
      title: "Search Autocomplete",
      prompt: "Design search suggestions with prefix indexes, ranking, personalization, abuse controls, and freshness.",
      difficulty: "Medium",
      frequency: 3,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Search", "Ranking", "Trie"],
    },
  ],
  amazon: [
    {
      title: "E-commerce Marketplace",
      prompt: "Design an Amazon-like marketplace with catalog search, cart, checkout, inventory, payments, and order workflow.",
      difficulty: "Hard",
      frequency: 4,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Marketplace", "Inventory", "Orders"],
    },
    {
      title: "Flash Sale / Ticketing",
      prompt: "Design a high-contention sale system with waiting rooms, inventory holds, payment idempotency, and fairness.",
      difficulty: "Hard",
      frequency: 3,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Queue", "Inventory", "Idempotency"],
    },
    {
      title: "Distributed Cache",
      prompt: "Design a Redis-like distributed cache with partitioning, replication, eviction, consistency, and failover.",
      difficulty: "Hard",
      frequency: 2,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Cache", "Replication", "Sharding"],
    },
  ],
  netflix: [
    {
      title: "Video Streaming",
      prompt: "Design Netflix with encoding pipeline, adaptive bitrate playback, CDN strategy, profiles, and watch history.",
      difficulty: "Hard",
      frequency: 5,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Streaming", "CDN", "Encoding"],
    },
    {
      title: "Recommendations",
      prompt: "Design a recommendation system with candidate generation, ranking, online features, feedback loops, and A/B tests.",
      difficulty: "Hard",
      frequency: 4,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["ML", "Ranking", "Experimentation"],
    },
    {
      title: "Observability Platform",
      prompt: "Design a metrics and alerting platform for high-cardinality time-series data across many services.",
      difficulty: "Hard",
      frequency: 2,
      recency: "Evergreen",
      sourceTitles: ["Curated fallback"],
      sourceUrls: [],
      tags: ["Metrics", "Time-series", "Alerting"],
    },
  ],
};

function normalizeCompany(company: string): string {
  return company.trim().replace(/\s+/g, " ").slice(0, 60);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRedirectUrl(url: string): string {
  try {
    const parsed = new URL(url, "https://duckduckgo.com");
    const uddg = parsed.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : parsed.toString();
  } catch {
    return url;
  }
}

function parseDuckDuckGo(html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const resultRegex = /<a[^>]+class="result-link"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]+class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;
  let match: RegExpExecArray | null;

  while ((match = resultRegex.exec(html)) !== null && hits.length < 12) {
    hits.push({
      url: extractRedirectUrl(decodeHtml(match[1])),
      title: decodeHtml(match[2]),
      snippet: decodeHtml(match[3]),
    });
  }

  return hits;
}

function guessQuestion(hit: SearchHit, company: string): string | null {
  const haystack = `${hit.title}. ${hit.snippet}`;
  const patterns = [
    /design(?:ing)?\s+(?:a|an|the)?\s*([a-z0-9][a-z0-9\s/&+-]{8,80}?)(?:\?|\.|,|\||-| interview| system| hld)/i,
    /system design(?: interview)?(?: question)?:?\s*([a-z0-9][a-z0-9\s/&+-]{8,80}?)(?:\?|\.|,|\||-)/i,
    /(news feed|timeline|chat|messaging|url shortener|rate limiter|video streaming|ride sharing|notification system|distributed cache|search autocomplete|payment system|ticket booking|file storage|instagram|youtube|twitter|whatsapp|dropbox|google docs)/i,
  ];

  for (const pattern of patterns) {
    const match = haystack.match(pattern);
    if (match?.[1]) {
      const title = match[1]
        .replace(new RegExp(company, "ig"), "")
        .replace(/\b(system|design|interview|question|questions|hld)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      if (title.length >= 5) return title;
    }
  }

  return null;
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((part) => part.length <= 3 && part === part.toUpperCase() ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function tagsFor(title: string): string[] {
  const text = title.toLowerCase();
  const tags = new Set<string>();
  if (/feed|timeline|instagram|twitter/.test(text)) tags.add("Feed");
  if (/chat|messag|whatsapp/.test(text)) tags.add("Messaging");
  if (/video|youtube|netflix|stream/.test(text)) tags.add("Streaming");
  if (/search|autocomplete/.test(text)) tags.add("Search");
  if (/payment|wallet|checkout/.test(text)) tags.add("Payments");
  if (/cache|redis/.test(text)) tags.add("Caching");
  if (/ride|uber|location/.test(text)) tags.add("Geo");
  if (/rate limit/.test(text)) tags.add("Rate limiting");
  if (tags.size === 0) tags.add("HLD");
  return Array.from(tags).slice(0, 4);
}

function recencyFor(hit: SearchHit): CompanyQuestionCandidate["recency"] {
  const text = `${hit.title} ${hit.snippet}`;
  if (/\b(2026|2025|recent|latest|new grad|asked)\b/i.test(text)) return "Fresh";
  if (/\b(2024|2023|last year)\b/i.test(text)) return "Recent";
  return "Evergreen";
}

function buildCandidates(hits: SearchHit[], company: string): CompanyQuestionCandidate[] {
  const grouped = new Map<string, CompanyQuestionCandidate>();

  for (const hit of hits) {
    const guessed = guessQuestion(hit, company);
    if (!guessed) continue;

    const title = toTitleCase(guessed).slice(0, 70);
    const key = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const existing = grouped.get(key);

    if (existing) {
      existing.frequency += 1;
      existing.sourceTitles.push(hit.title);
      existing.sourceUrls.push(hit.url);
      if (recencyFor(hit) === "Fresh") existing.recency = "Fresh";
      else if (recencyFor(hit) === "Recent" && existing.recency === "Evergreen") existing.recency = "Recent";
      continue;
    }

    grouped.set(key, {
      id: `web-${key.replace(/\s+/g, "-").slice(0, 48)}`,
      title,
      prompt: `Design ${title} for ${company}. Cover APIs, data model, scaling bottlenecks, failure modes, and operational trade-offs.`,
      difficulty: /shortener|autocomplete|rate limit/i.test(title) ? "Medium" : "Hard",
      frequency: 1,
      recency: recencyFor(hit),
      sourceTitles: [hit.title],
      sourceUrls: [hit.url],
      tags: tagsFor(title),
    });
  }

  return Array.from(grouped.values())
    .sort((a, b) => {
      const recencyWeight = { Fresh: 3, Recent: 2, Evergreen: 1 };
      return b.frequency * 10 + recencyWeight[b.recency] - (a.frequency * 10 + recencyWeight[a.recency]);
    })
    .slice(0, 3);
}

function fallback(company: string): CompanyQuestionCandidate[] {
  const key = company.toLowerCase().split(/\s+/)[0];
  const items = COMMON_FALLBACKS[key] ?? COMMON_FALLBACKS.default;
  return items.map((item, index) => ({
    ...item,
    id: `fallback-${key}-${index}`,
    prompt: item.prompt.replace(/\bDesign\b/, `Design for ${company}:`),
  }));
}

export async function GET(request: NextRequest) {
  const company = normalizeCompany(request.nextUrl.searchParams.get("company") ?? "");
  if (!company) {
    return NextResponse.json({ error: "Missing company" }, { status: 400 });
  }

  const query = `${company} system design interview HLD questions recent`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "accept": "text/html",
        "user-agent": "Mozilla/5.0 HLD Ladder practice coach",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`Search failed: ${response.status}`);

    const hits = parseDuckDuckGo(await response.text());
    const candidates = buildCandidates(hits, company);

    if (candidates.length > 0) {
      const payload: CompanyQuestionResponse = {
        company,
        generatedAt: new Date().toISOString(),
        query,
        source: "web",
        candidates,
      };
      return NextResponse.json(payload);
    }
  } catch {
    // Fall through to curated prompts. The UI labels this as a fallback.
  }

  const payload: CompanyQuestionResponse = {
    company,
    generatedAt: new Date().toISOString(),
    query,
    source: "fallback",
    candidates: fallback(company),
    note: "Live web search was unavailable or returned too few parseable results, so these are curated common HLD prompts.",
  };

  return NextResponse.json(payload);
}
