export const STORY_GENRES = [
  { slug: "fantasi", label: "Fantasi" },
  { slug: "romansa", label: "Romansa" },
  { slug: "petualangan", label: "Petualangan" },
  { slug: "drama", label: "Drama" },
  { slug: "misteri", label: "Misteri" },
  { slug: "horor", label: "Horor" },
  { slug: "fiksi-ilmiah", label: "Fiksi Ilmiah" },
  { slug: "slice-of-life", label: "Slice of Life" },
  { slug: "aksi", label: "Aksi" },
  { slug: "komedi", label: "Komedi" },
] as const;

const genreLabels = new Map<string, string>(STORY_GENRES.map(genre => [genre.slug, genre.label]));

export function storyGenreLabel(slug: string) { return genreLabels.get(slug) ?? slug; }
export function knownStoryGenre(slug: string) { return genreLabels.has(slug); }

export function catalogHref({ format, genre, tag }: { format?: string | null; genre?: string | null; tag?: string | null }) {
  const query = new URLSearchParams();
  if (format) query.set("format", format);
  if (genre) query.set("genre", genre);
  if (tag) query.set("tag", tag);
  return `/${query.size ? `?${query.toString()}` : ""}#cerita`;
}

export function parseStoryTaxonomy(form: FormData) {
  const genres = [...new Set(form.getAll("genres").map(value => String(value)))];
  if (genres.length > 3 || genres.some(genre => !knownStoryGenre(genre))) throw new Error("Pilih maksimal 3 genre yang tersedia.");
  const tags = [...new Set(String(form.get("tags") ?? "").split(",").map(tag => tag.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID")).filter(Boolean))];
  if (tags.length > 12 || tags.some(tag => tag.length > 32 || !/^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u.test(tag))) throw new Error("Isi maksimal 12 tag, masing-masing 1–32 karakter (huruf, angka, spasi, titik, apostrof, atau tanda hubung).");
  return { genres, tags };
}
