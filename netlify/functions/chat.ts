import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const handler: Handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { message } = JSON.parse(event.body || '{}');

    console.log('🔥 BACKEND DEBUG - Direct Supabase Query:');
    console.log('📝 User message:', message?.substring(0, 100));

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // Supabase bağlantısı - Environment variables'dan al
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('🔌 Supabase Environment Check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0,
      urlStart: supabaseUrl?.substring(0, 20) || 'missing'
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials missing from environment');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          response: 'Database connection error: Supabase credentials not found in environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY settings.' 
        }),
      };
    }

    // Supabase client oluştur
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('📡 Supabase client created successfully');

    // Doğrudan Supabase'den TÜM verileri çek - SIRALAMASİZ
    console.log('🔍 Fetching ALL data from Supabase job_e table...');
    const { data: allJobData, error: dbError } = await supabase
      .from('job_e')
      .select('*');

    if (dbError) {
      console.error('❌ Supabase query error:', dbError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          response: `Database query failed: ${dbError.message}. Please check Supabase table permissions.` 
        }),
      };
    }

    console.log('✅ Supabase data loaded successfully:', {
      totalRecords: allJobData?.length || 0,
      sampleRecord: allJobData?.[0] ? Object.keys(allJobData[0]) : 'No data',
      firstRecordActualComp: allJobData?.[0]?.['Actual Total Compensation-Average'] || 'N/A',
      firstRecordBaseSalary: allJobData?.[0]?.['Base Salary-Average'] || 'N/A',
      maxActualComp: allJobData ? Math.max(...allJobData.map(j => j['Actual Total Compensation-Average'] || 0)) : 'N/A',
      maxBaseSalary: allJobData ? Math.max(...allJobData.map(j => j['Base Salary-Average'] || 0)) : 'N/A'
    });

    if (!allJobData || allJobData.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: 'No data found in the Supabase database. Please check if the job_e table contains data.' 
        }),
      };
    }

             // HER ZAMAN TÜM VERİYİ KULLAN - Filtreleme YOK
    console.log('📊 NO FILTERING - Using COMPLETE dataset for all queries');
    const relevantData = allJobData;
    
         console.log('📋 Using COMPLETE dataset for analysis:', {
       totalRecords: allJobData.length,
       recordsForAnalysis: relevantData.length,
       maxBaseSalary: allJobData ? Math.max(...allJobData.map(j => j['Base Salary-Average'] || 0)) : 'N/A',
       maxActualComp: allJobData ? Math.max(...allJobData.map(j => j['Actual Total Compensation-Average'] || 0)) : 'N/A',
       maxTotalGuaranteed: allJobData ? Math.max(...allJobData.map(j => j['Total Guaranteed Compensation-Average'] || 0)) : 'N/A'
     });

         // Supabase verileri için AI prompt
     const systemPrompt = `You are a STRICT database analyst. You ONLY have access to the exact ${relevantData.length} records shown below from a Supabase database.

CRITICAL: You have NO INTERNET ACCESS, NO EXTERNAL KNOWLEDGE, NO OTHER DATA SOURCES!

EXACT DATABASE RECORDS (ALL ${relevantData.length} records):
${JSON.stringify(relevantData, null, 1)}

DATA SOURCE CONFIRMATION:
- Source: Supabase job_e table ONLY
- Total available records: ${allJobData.length}
- Records for analysis: ${relevantData.length}

MANDATORY ANALYSIS RULES:
1. Calculate ONLY from the JSON records above - NO external data
2. If asked about data not in these records, say "This information is not available in the provided database records"
3. NEVER use phrases like "typically", "generally", "in the market", "industry standard"
4. ALWAYS state "based on the ${relevantData.length} records in this database"
5. Show exact numbers from the JSON data only
6. Reference specific job titles and exact salary values
7. If calculations needed, use ONLY the provided salary figures
8. NEVER supplement with external knowledge or assumptions

AVAILABLE FIELDS:
- Job: Position title
- Family: Department/job family
- Level: Job level
- country: Work location
- "Base Salary-Average": Base salary amount
- "Total Guaranteed Compensation-Average": Guaranteed compensation
- "Actual Total Compensation-Average": Actual total compensation

REMEMBER: You are analyzing a closed dataset. No external information exists for you.`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          response: 'AI service configuration missing. Please check GEMINI_API_KEY environment variable.' 
        }),
      };
    }

    // Gemini API call
    console.log('🤖 Sending query to Gemini...');
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt + '\n\nUser question: ' + message
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('🤖 Gemini response received successfully');
    
    // Safety check
    if (geminiData.candidates?.[0]?.finishReason === 'SAFETY') {
      console.log('🚫 Gemini safety block detected');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: 'I can help analyze your Supabase database. Please rephrase your question about the job compensation data.' 
        }),
      };
    }
    
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'I could not process your Supabase database query. Please try rephrasing your question.';

    console.log('✅ Response generated successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: aiResponse }),
    };

  } catch (error) {
    console.error('❌ Critical error in chat function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        response: `Server error: ${error.message}. Please check the server logs for details.` 
      }),
    };
  }
};

export { handler }; 