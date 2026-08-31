import { requireFanAppApiBase } from "./fanAppApiBase";
export type DocAndGloStatus = "draft" | "published";
export type DocAndGloSource = "shopify" | "manual";

export type DocAndGloProduct = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  currency: string;
  thumbnail: string;
  shopUrl: string;
  shopifyProductId: string;
  productType: string;
  status: DocAndGloStatus;
  enabled: boolean;
  featured: boolean;
  order: number;
  publishedAt: string;
  source: DocAndGloSource;
};

export type DocAndGloFeed = {
  version: number;
  updatedAt: string;
  items: DocAndGloProduct[];
};

export type DocAndGloCatalogProduct = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  currency: string;
  thumbnail: string;
  shopUrl: string;
  productType: string;
  available: boolean;
  tags: string[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

async function feedRequest(init?: RequestInit) {
  const secret = getAdminSecret();
  const headers = new Headers(init?.headers);
  if (secret) headers.set("x-admin-secret", secret);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBase()}/api/admin/analytics?view=doc-and-glo`, {
    ...init,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Doc & Glo request failed (${response.status})`);
  }
  return data;
}

export async function fetchDocAndGloFeed(): Promise<DocAndGloFeed> {
  const data = (await feedRequest()) as { feed: DocAndGloFeed };
  return data.feed;
}

export async function publishDocAndGloFeed(feed: DocAndGloFeed): Promise<DocAndGloFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to publish Doc & Glo");
  const data = (await feedRequest({
    method: "POST",
    body: JSON.stringify({ action: "publish", feed }),
  })) as { feed: DocAndGloFeed };
  return data.feed;
}

export async function upsertDocAndGloProduct(item: DocAndGloProduct): Promise<DocAndGloFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to save Doc & Glo");
  const data = (await feedRequest({
    method: "POST",
    body: JSON.stringify({ action: "upsert", item }),
  })) as { feed: DocAndGloFeed };
  return data.feed;
}

export async function deleteDocAndGloProduct(id: string): Promise<DocAndGloFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to delete Doc & Glo");
  const data = (await feedRequest({
    method: "POST",
    body: JSON.stringify({ action: "delete", id }),
  })) as { feed: DocAndGloFeed };
  return data.feed;
}

export type DocAndGloCatalogResult = {
  products: DocAndGloCatalogProduct[];
  source: "shopify";
  count: number;
};

export async function syncDocAndGloCatalog(): Promise<{ feed: DocAndGloFeed; synced: number }> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to sync Doc & Glo");
  const data = (await feedRequest({
    method: "POST",
    body: JSON.stringify({ action: "sync-catalog" }),
  })) as { feed: DocAndGloFeed; synced?: number };
  return { feed: data.feed, synced: data.synced ?? data.feed.items.length };
}

export async function fetchDocAndGloCatalog(refresh = false): Promise<DocAndGloCatalogResult> {
  const url = `${getApiBase()}/api/admin/analytics?view=doc-and-glo-catalog${refresh ? "&refresh=1" : ""}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  const products = Array.isArray((data as { products?: DocAndGloCatalogProduct[] }).products)
    ? (data as { products: DocAndGloCatalogProduct[] }).products
    : [];

  if (!response.ok && !products.length) {
    throw new Error((data as { error?: string }).error || `Doc & Glo catalog failed (${response.status})`);
  }

  return {
    products,
    source: "shopify",
    count: products.length || Number((data as { count?: number }).count) || 0,
  };
}

export function createEmptyDocAndGloProduct(): DocAndGloProduct {
  const now = new Date();
  return {
    id: `docglo-${now.getTime().toString(36)}`,
    title: "",
    subtitle: "",
    description: "",
    price: "",
    currency: "USD",
    thumbnail: "",
    shopUrl: "",
    shopifyProductId: "",
    productType: "",
    status: "draft",
    enabled: true,
    featured: false,
    order: 0,
    publishedAt: now.toISOString(),
    source: "manual",
  };
}

export function productFromCatalog(
  product: DocAndGloCatalogProduct,
  existing?: DocAndGloProduct | null,
): DocAndGloProduct {
  const now = new Date().toISOString();
  return {
    id: existing?.id || product.id,
    title: existing?.title || product.title,
    subtitle: existing?.subtitle || product.subtitle,
    description: existing?.description || product.description,
    price: existing?.price || product.price,
    currency: existing?.currency || product.currency || "USD",
    thumbnail: existing?.thumbnail || product.thumbnail,
    shopUrl: existing?.shopUrl || product.shopUrl,
    shopifyProductId: product.id,
    productType: existing?.productType || product.productType,
    status: existing?.status || "published",
    enabled: existing ? existing.enabled : true,
    featured: existing?.featured || false,
    order: existing?.order ?? 0,
    publishedAt: existing?.publishedAt || now,
    source: "shopify",
  };
}

export function resolveDocAndGloAssetUrl(src: string) {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${getApiBase()}${src.startsWith("/") ? "" : "/"}${src}`;
}

export function formatDocAndGloPrice(price: string, currency = "USD") {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return price || "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}
