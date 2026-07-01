const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Rewrite the URL to point to the Supabase Management API
    const targetUrl = new URL(url.pathname + url.search, 'https://api.supabase.com');

    // Create a new request based on the original, but pointing to the target URL
    const proxyRequest = new Request(targetUrl, request);

    try {
      const response = await fetch(proxyRequest);

      // Create a new response so we can modify the headers
      const proxyResponse = new Response(response.body, response);

      // Add CORS headers to the response
      Object.keys(corsHeaders).forEach((key) => {
        proxyResponse.headers.set(key, corsHeaders[key]);
      });

      return proxyResponse;
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
