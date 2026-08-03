const DEFAULT_SITE = 'https://oaklinefurniture.example';

// Named so the allow-list stays readable; every one of these is a crawler that
// feeds an AI assistant's index or its live browsing.
const AI_CRAWLERS = [
  ['OpenAI (ChatGPT & Search)', ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User']],
  ['Anthropic (Claude)', ['ClaudeBot', 'Claude-Web', 'Claude-SearchBot', 'anthropic-ai']],
  ['Perplexity', ['PerplexityBot', 'Perplexity-User']],
  ['Google AI & Gemini', ['Google-Extended', 'GoogleOther']],
  ['Apple Intelligence', ['Applebot', 'Applebot-Extended']],
  ['Microsoft Copilot & Bing', ['bingbot', 'BingPreview', 'msnbot']],
  ['Meta & open-source LLM scrapers', ['Meta-ExternalAgent', 'Meta-ExternalFetcher', 'FacebookBot']],
  ['Common Crawl (feeds many training sets)', ['CCBot']],
  ['Amazon & others', ['Amazonbot', 'YouBot', 'Bytespider', 'Diffbot']]
];

export async function GET(context) {
  const site = (context.site?.origin ?? DEFAULT_SITE).replace(/\/$/, '');

  const blocks = AI_CRAWLERS.map(
    ([label, agents]) =>
      `# ${label}\n${agents.map(a => `User-agent: ${a}`).join('\n')}\nAllow: /`
  );

  const body = `# Standard search engines and AI web scrapers
User-agent: *
Allow: /
Allow: /llms.txt
Allow: /products.json
Disallow: /admin
Disallow: /api/

${blocks.join('\n\n')}

# Sitemap Pointer
Sitemap: ${site}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
