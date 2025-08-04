import type { Handler } from '@netlify/functions';

const BUNNY_API_KEY = 'd988f865-68a1-42fd-8d725838fc1d-37ea-436f';
const BUNNY_LIBRARY_ID = '256964';

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === 'POST') {
      const { fileName, fileType } = JSON.parse(event.body || '{}');
      if (!fileName || !fileType) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'fileName e fileType são obrigatórios.' }),
        };
      }
      // 1. Cria vídeo
      const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: fileName }),
      });
      const createText = await createRes.text();
      let createData;
      try { createData = JSON.parse(createText); } catch { createData = createText; }
      if (!createRes.ok) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Erro ao criar vídeo na Bunny.net', bunny: createData }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ guid: createData.guid }),
      };
    }
    if (event.httpMethod === 'PUT') {
      const videoId = event.queryStringParameters?.guid;
      if (!videoId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'GUID do vídeo é obrigatório.' }),
        };
      }
      const uploadRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': event.headers['content-type'] || 'application/octet-stream',
        },
        body: event.body ? Buffer.from(event.body, 'base64') : undefined,
      });
      const uploadText = await uploadRes.text();
      if (!uploadRes.ok) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Erro ao enviar vídeo para Bunny.net', bunny: uploadText }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true }),
      };
    }
    if (event.httpMethod === 'GET') {
      const videoId = event.queryStringParameters?.guid;
      if (!videoId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'GUID do vídeo é obrigatório.' }),
        };
      }
      const statusRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
        headers: { 'AccessKey': BUNNY_API_KEY },
      });
      const statusText = await statusRes.text();
      let statusData;
      try { statusData = JSON.parse(statusText); } catch { statusData = statusText; }
      if (!statusRes.ok) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Erro ao consultar status do vídeo.', bunny: statusData }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(statusData),
      };
    }
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro inesperado', details: err instanceof Error ? err.message : err }),
    };
  }
};
