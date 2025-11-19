// Cloudflare Pages Function for SSR
// [[path]] is a catch-all route that matches all requests

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Skip SSR for static assets
  if (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/sw.js') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webmanifest|woff2?|ttf|eot|json|xml|txt)$/)
  ) {
    return context.env.ASSETS.fetch(context.request);
  }

  try {
    // Try to load the server-rendered module
    // @ts-ignore - This will be bundled by Vite
    const { render } = await import('../dist/server/entry-server.js');

    const { html, head } = render(pathname);

    // Load the template HTML
    const template = await getTemplate(context.env.ASSETS);

    // Replace placeholders with SSR content
    const finalHtml = template
      .replace('<!--app-html-->', html)
      .replace(/<title>.*?<\/title>/, `<title>${head.title}</title>`)
      .replace(
        /<meta name="title"[^>]*>/,
        `<meta name="title" content="${head.title}" />`
      )
      .replace(
        /<meta name="description"[^>]*>/,
        `<meta name="description" content="${head.description}" />`
      )
      .replace(
        /<meta name="keywords"[^>]*>/,
        `<meta name="keywords" content="${head.keywords}" />`
      )
      .replace(
        /<link rel="canonical"[^>]*>/,
        `<link rel="canonical" href="${head.canonicalUrl}" />`
      )
      .replace(
        /<meta property="og:url"[^>]*>/,
        `<meta property="og:url" content="${head.ogUrl}" />`
      )
      .replace(
        /<meta property="og:title"[^>]*>/,
        `<meta property="og:title" content="${head.title}" />`
      )
      .replace(
        /<meta property="og:description"[^>]*>/,
        `<meta property="og:description" content="${head.description}" />`
      )
      .replace(
        /<meta property="og:image"[^>]*>/,
        `<meta property="og:image" content="${head.ogImage}" />`
      )
      .replace(
        /<meta name="twitter:url"[^>]*>/,
        `<meta name="twitter:url" content="${head.ogUrl}" />`
      )
      .replace(
        /<meta name="twitter:title"[^>]*>/,
        `<meta name="twitter:title" content="${head.title}" />`
      )
      .replace(
        /<meta name="twitter:description"[^>]*>/,
        `<meta name="twitter:description" content="${head.description}" />`
      )
      .replace(
        /<meta name="twitter:image"[^>]*>/,
        `<meta name="twitter:image" content="${head.twitterImage}" />`
      );

    return new Response(finalHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('SSR Error:', error);
    // Fallback to serving the static HTML if SSR fails
    return context.env.ASSETS.fetch(context.request);
  }
};

// Cache the template HTML
let templateCache: string | null = null;

async function getTemplate(assets: Env['ASSETS']): Promise<string> {
  if (templateCache) {
    return templateCache;
  }

  const response = await assets.fetch(new Request('https://placeholder/index.html'));
  const html = await response.text();

  // Modify the template to include SSR placeholder
  templateCache = html.replace(
    '<div id="root"></div>',
    '<div id="root"><!--app-html--></div>'
  );

  return templateCache;
}
