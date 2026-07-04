export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/_vercel') || url.pathname.startsWith('/assets')) return fetch(request);
  const USER = process.env.BASIC_AUTH_USER;
  const PASS = process.env.BASIC_AUTH_PASSWORD;
  if (!USER || !PASS) return new Response('NEXORA OS: BASIC_AUTH_USER / BASIC_AUTH_PASSWORD is not set.', { status: 500 });
  const auth = request.headers.get('authorization');
  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const index = decoded.indexOf(':');
      if (decoded.slice(0, index) === USER && decoded.slice(index + 1) === PASS) return fetch(request);
    }
  }
  return new Response('Authentication required.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="NEXORA AI OS"' } });
}
