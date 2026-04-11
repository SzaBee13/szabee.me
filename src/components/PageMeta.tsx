import { useEffect } from 'react';

type PageMetaProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
};

const siteName = 'SzaBee13';
const defaultImage = 'https://szabee.me/szabee13.jpg';

function resolveUrl(path: string): string {
  const origin = typeof window === 'undefined' ? 'https://szabee.me' : window.location.origin;
  return new URL(path, origin).toString();
}

function upsertMeta(name: string, value: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  const existed = element !== null;

  if (!element) {
    element = document.createElement('meta');
    if (property) {
      element.setAttribute('property', name);
    } else {
      element.setAttribute('name', name);
    }
    document.head.appendChild(element);
  }

  const previousContent = element.getAttribute('content');
  element.setAttribute('content', value);

  return () => {
    if (existed) {
      if (previousContent === null) {
        element!.removeAttribute('content');
      } else {
        element!.setAttribute('content', previousContent);
      }
      return;
    }

    element?.remove();
  };
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  const existed = element !== null;

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }

  const previousHref = element.getAttribute('href');
  element.setAttribute('href', href);

  return () => {
    if (existed) {
      if (previousHref === null) {
        element!.removeAttribute('href');
      } else {
        element!.setAttribute('href', previousHref);
      }
      return;
    }

    element?.remove();
  };
}

export function PageMeta({
  title,
  description,
  path,
  image = defaultImage,
  type = 'website',
  noIndex = false,
}: PageMetaProps) {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const cleanupTasks: Array<() => void> = [];
    const fullUrl = resolveUrl(path);

    const previousTitle = document.title;
    document.title = title;

    cleanupTasks.push(() => {
      document.title = previousTitle;
    });

    cleanupTasks.push(upsertMeta('description', description));
    cleanupTasks.push(upsertMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow'));
    cleanupTasks.push(upsertCanonical(fullUrl));

    cleanupTasks.push(upsertMeta('og:title', title, true));
    cleanupTasks.push(upsertMeta('og:description', description, true));
    cleanupTasks.push(upsertMeta('og:url', fullUrl, true));
    cleanupTasks.push(upsertMeta('og:type', type, true));
    cleanupTasks.push(upsertMeta('og:site_name', siteName, true));
    cleanupTasks.push(upsertMeta('og:image', image, true));
    cleanupTasks.push(upsertMeta('og:image:type', 'image/jpeg', true));
    cleanupTasks.push(upsertMeta('og:image:width', '400', true));
    cleanupTasks.push(upsertMeta('og:image:height', '400', true));

    cleanupTasks.push(upsertMeta('twitter:card', 'summary_large_image'));
    cleanupTasks.push(upsertMeta('twitter:title', title));
    cleanupTasks.push(upsertMeta('twitter:description', description));
    cleanupTasks.push(upsertMeta('twitter:image', image));

    return () => {
      cleanupTasks.reverse().forEach((cleanup) => cleanup());
    };
  }, [description, image, noIndex, path, title, type]);

  return null;
}