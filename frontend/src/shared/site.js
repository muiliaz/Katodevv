// The site's canonical origin, in one place.
//
// config-hygiene found it written out in five files with no way to notice a
// half-finished domain change:
//
//   "Поиск `katodevv.com` показывает один источник либо явно документированный
//    список синхронизируемых мест."
//
// Seo.jsx imports it. The other four cannot: index.html, sitemap.xml and
// robots.txt are static files served before any JavaScript exists, and
// netlify/functions/contact.js keeps its own literal on purpose — requiring a
// file from outside netlify/functions would make the deployed function depend
// on Netlify's bundler reaching into src/, and that is the enquiry path.
//
// contracts.test.js checks all five agree, which is the documented-list half of
// what the audit asked for.
export const SITE_URL = 'https://katodevv.com';
