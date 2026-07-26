import { Helmet } from "react-helmet-async";

const SITE_URL = "https://katodevv.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

/* Per-page <title>/meta/OG/Twitter tags, rendered client-side over the
   static fallback already baked into public/index.html. Google renders
   JS fine, but social-share crawlers (Telegram/FB/LinkedIn) don't — so
   the index.html fallback is what they'll actually see; this is mainly
   for Google/Bing indexing distinct per-route titles & descriptions. */
function Seo({ title, description, path = "/", image = DEFAULT_IMAGE }) {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Kato Devv" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}

export default Seo;
