export function GET() {
  const body = [
    "Contact: https://github.com/sentientsprite/autoagent/security/advisories/new",
    "Preferred-Languages: en",
    "Canonical: https://nemo-app-v-1.vercel.app/.well-known/security.txt",
    "Expires: 2027-09-28T06:00:00.000Z",
    "",
  ].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
