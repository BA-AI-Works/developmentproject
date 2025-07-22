import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Environment variables kontrolü
    const envCheck = {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      environment: process.env.NODE_ENV || 'unknown',
      netlifyDeploy: !!process.env.NETLIFY,
      buildId: process.env.BUILD_ID || 'unknown',
      deployContext: process.env.CONTEXT || 'unknown',
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Debug endpoint - environment check',
        environment: envCheck,
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Debug error',
        message: error.message
      }),
    };
  }
};

export { handler }; 