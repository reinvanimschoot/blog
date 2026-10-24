import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** All published posts (drafts only in dev), newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Other posts in the same series, ordered by part. */
export async function getSeries(series: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts
    .filter((p) => p.data.series === series)
    .sort((a, b) => (a.data.part ?? 0) - (b.data.part ?? 0));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Rough reading time at ~220 words per minute. */
export function readingTime(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}
