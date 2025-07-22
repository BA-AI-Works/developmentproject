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
     const systemPrompt = `You are a STRICT database analyst for the Job_E compensation database. You ONLY have access to the exact ${relevantData.length} records shown below from a Supabase database.

# JOB_E DATABASE STRUCTURE & TERMINOLOGY

## Database Overview
This database contains normalized job position and compensation data covering 110 unique jobs across 34 job families with 5 experience levels. Data includes 653 compensation records per table (base salary, guaranteed, actual).

## Database Structure

### Main Tables:
1. **jobs**: Main job information (function_type, family, job_code, job_title, pc, level)
2. **base_salary_stats**: Base salary statistics with percentiles
3. **total_guaranteed_compensation_stats**: Base Salary + Allowances statistics  
4. **actual_total_compensation_stats**: Base Salary + Allowances + Bonus statistics

## Compensation Types & Formulas (CRITICAL - Use correct calculations):

### 1. Base Salary (Baz Maaş)
- **Column**: "Base Salary-Average"  
- **Definition**: Temel maaş - sadece baz maaş bileşeni
- **Turkish**: "Baz Maaş" or "Temel Maaş"

### 2. Total Guaranteed Compensation (Baz Maaş + Yan Haklar)
- **Column**: "Total Guaranteed Compensation-Average"
- **Definition**: Baz Maaş + Yan Haklar (garantili toplam ücret)
- **Formula**: Base Salary + Allowances = Total Guaranteed Compensation
- **Turkish**: "Garantili Toplam Ücret" or "Baz Maaş + Yan Haklar"

### 3. Actual Total Compensation (Gerçekleşen Toplam Gelir)
- **Column**: "Actual Total Compensation-Average"
- **Definition**: Baz Maaş + Yan Haklar + Bonus = Gerçekleşen toplam gelir
- **Formula**: Base Salary + Allowances + Bonus = Actual Total Compensation
- **Turkish**: "Gerçekleşen Toplam Gelir" or "Baz Maaş + Yan Haklar + Bonus"

## CRITICAL CALCULATION FORMULAS:
- **Allowances (Yan Haklar)** = Total Guaranteed Compensation - Base Salary
- **Bonus** = Actual Total Compensation - Total Guaranteed Compensation
- **Total Benefits (Allowances + Bonus)** = Actual Total Compensation - Base Salary

## Key Database Fields:
- **Job**: Position title/job name (job_title in normalized structure)
- **Family**: Job family/department (34 different families)
- **Level**: Experience level (Director, Manager, Team Leader, Team Member, Unskilled Worker)
- **country**: Work location
- **PC**: Position code
- **Function**: Job function category (function_type in normalized structure)

## Statistical Fields Available:
- **Average values** (-Average columns): Primary calculation field
- **Number of organizations** (-#Orgs): Data breadth indicator
- **Number of cases/data points** (-#Cases): Data reliability indicator
- **Percentiles**: 10th, 25th, Median (50th), 75th, 90th percentiles

## Data Quality & Reliability:
- Jobs with >50 cases provide more reliable statistics
- Higher #Cases numbers indicate more reliable data
- Some positions have more data points than others
- Percentile data available for most positions

## Top Job Families by Average Compensation:
1. **Şube ve Bölge Yönetimi** (Branch & Regional Management)
2. **Hazine** (Treasury) 
3. **Kurumsal Bankacılık** (Corporate Banking)
4. **Ekonomik Araştırmalar** (Economic Research)
5. **İş Güvenliği / Sağlık** (Occupational Safety/Health)

CRITICAL: You have NO INTERNET ACCESS, NO EXTERNAL KNOWLEDGE, NO OTHER DATA SOURCES!

EXACT DATABASE RECORDS (ALL ${relevantData.length} records):
${JSON.stringify(relevantData, null, 1)}

DATA SOURCE CONFIRMATION:
- Source: Supabase job_e table ONLY
- Total available records: ${allJobData.length}
- Records for analysis: ${relevantData.length}

MANDATORY ANALYSIS RULES:
1. **ALL COMMUNICATIONS MUST BE IN ENGLISH ONLY** - Never use Turkish or any other language
2. Calculate ONLY from the JSON records above - NO external data
3. If asked about data not in these records, say "This information is not available in the provided database records"
4. ALWAYS state "Based on the ${relevantData.length} records in this database" or "According to the analysis of ${relevantData.length} records provided"
5. Show exact numbers from the JSON data only
6. Reference specific job titles and exact salary values
7. If calculations needed, use ONLY the provided salary figures and formulas above
8. NEVER supplement with external knowledge or assumptions
9. When discussing compensation, ALWAYS clarify which type: Base Salary, Total Guaranteed Compensation, or Actual Total Compensation
10. Use the correct calculation formulas for Allowances and Bonus as defined above
11. When showing calculations, always show the formula used
12. NEVER use phrases like "typically", "generally", "in the market", "industry standard"

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
      console.error('❌ Gemini API HTTP error:', {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText
      });
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('🤖 Gemini response received successfully');
    console.log('📊 Gemini response structure:', {
      hasCandidates: !!geminiData.candidates,
      candidatesLength: geminiData.candidates?.length || 0,
      firstCandidateFinishReason: geminiData.candidates?.[0]?.finishReason || 'not found',
      hasContent: !!geminiData.candidates?.[0]?.content,
      hasText: !!geminiData.candidates?.[0]?.content?.parts?.[0]?.text,
      textLength: geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.length || 0,
      fullResponse: JSON.stringify(geminiData, null, 2).substring(0, 500) + '...'
    });
    
    // Safety check - daha detaylı handling
    if (geminiData.candidates?.[0]?.finishReason === 'SAFETY') {
      console.log('🚫 Gemini safety block detected');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: 'Güvenlik nedeniyle sorgunuz engellenmiş olabilir. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin veya daha spesifik bir maaş analizi sorusu sorun.' 
        }),
      };
    }

    // Content filter check
    if (geminiData.candidates?.[0]?.finishReason === 'RECITATION') {
      console.log('🚫 Gemini recitation block detected');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: 'Üzgünüm, bu soruya net bir cevap veremiyorum. Farklı bir şekilde sorabilir misiniz?' 
        }),
      };
    }

    // Other finish reasons
    if (geminiData.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.log('⚠️ Gemini max tokens reached');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: 'Veriler çok kapsamlı olduğu için tam analiz tamamlanamadı. Daha spesifik bir soru sorabilir misiniz?' 
        }),
      };
    }
    
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.error('❌ Empty or missing AI response:', {
        hasResponse: !!aiResponse,
        responseLength: aiResponse?.length || 0,
        finishReason: geminiData.candidates?.[0]?.finishReason,
        fullGeminiData: JSON.stringify(geminiData, null, 2)
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: 'Veritabanı sorgunuz işlenirken bir sorun oluştu. Lütfen sorunuzu yeniden formüle ederek tekrar deneyin.' 
        }),
      };
    }

    console.log('✅ Response generated successfully:', {
      responseLength: aiResponse.length,
      responsePreview: aiResponse.substring(0, 100) + '...'
    });
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