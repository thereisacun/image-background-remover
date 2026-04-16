/**
 * Cloudflare Worker: Remove Background API Proxy
 * Receives image upload → forwards to Remove.bg API → returns result
 */

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (new URL(request.url).pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ detail: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ detail: 'No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return new Response(
          JSON.stringify({ detail: 'Unsupported file type. Use PNG, JPEG, or WebP.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ detail: 'File exceeds 10 MB limit.' }),
          { status: 413, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const rbFormData = new FormData();
      rbFormData.append('image_file', file);
      rbFormData.append('size', 'auto');
      rbFormData.append('format', 'png');

      const apiResponse = await fetch(REMOVE_BG_API_URL, {
        method: 'POST',
        headers: {
          'X-Api-Key': env.REMOVE_BG_API_KEY,
        },
        body: rbFormData,
      });

      if (!apiResponse.ok) {
        let errorDetail = `Remove.bg API error: ${apiResponse.status}`;
        try {
          const errBody = await apiResponse.json();
          if (errBody.errors?.[0]?.title) {
            errorDetail = errBody.errors[0].title;
          }
        } catch (_) {}
        return new Response(
          JSON.stringify({ detail: errorDetail }),
          { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const resultBuffer = await apiResponse.arrayBuffer();

      return new Response(resultBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="removed-bg.png"',
          'Content-Length': resultBuffer.byteLength.toString(),
          ...corsHeaders,
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ detail: 'Processing failed. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  },
};
