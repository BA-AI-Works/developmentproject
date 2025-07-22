import { Handler } from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';

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
    const { message, context: dataContext } = JSON.parse(event.body || '{}');

    // 🔍 CRITICAL DEBUG - Gelen veri kontrolü
    console.log('🔥 BACKEND DEBUG - Gelen Request Analizi:');
    console.log('📝 Message:', message?.substring(0, 50) + '...');
    console.log('📊 Context mevcut mu?', !!dataContext);
    console.log('📈 FullDataset var mı?', !!dataContext?.fullDataset);
    console.log('🔢 FullDataset boyutu:', dataContext?.fullDataset?.length || 'YOK');
    console.log('🎯 TotalJobs:', dataContext?.totalJobs || 'YOK');
    
    if (dataContext?.fullDataset && dataContext.fullDataset.length > 0) {
      console.log('📋 İlk kayıt örneği:', dataContext.fullDataset[0]);
      console.log('🏷️ Kayıt anahtarları:', Object.keys(dataContext.fullDataset[0] || {}));
    }

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // Akıllı veri stratejisi - soru tipine göre veri miktarını belirle
    const getDataStrategy = (question: string, fullDataset: any[]) => {
      const lowerQuestion = question.toLowerCase();
      
      // Analiz gerektiren kelimeler
      const analysisKeywords = ['analysis', 'compare', 'comparison', 'trend', 'distribution', 'range', 'percentile', 'median', 'average', 'statistics', 'breakdown'];
      const isAnalysisQuery = analysisKeywords.some(keyword => lowerQuestion.includes(keyword));
      
      // Spesifik pozisyon sorguları (dar kapsamlı, az veri yeterli)
      if (lowerQuestion.includes('it') && lowerQuestion.includes('manager') && !isAnalysisQuery) {
        const filtered = fullDataset.filter(job => {
          const family = (job['FAMILY'] || job['Family'] || '').toLowerCase();
          const level = (job['Level'] || job['PC'] || '').toLowerCase();
          return (family.includes('it') || family.includes('information') || family.includes('technology')) 
                 && level.includes('manager');
        });
        return { data: filtered, reason: 'Specific IT Manager query', type: 'filtered' };
      }
      
      // Analiz gerektiren sorular (geniş kapsamlı, çok veri gerekli)
      if (isAnalysisQuery || lowerQuestion.includes('all') || lowerQuestion.includes('overview')) {
        return { data: fullDataset, reason: 'Analysis requires full dataset', type: 'full' };
      }
      
      // Karşılaştırma sorguları (tüm kategoriler gerekli)
      if (lowerQuestion.includes('compare') || lowerQuestion.includes('vs') || lowerQuestion.includes('versus')) {
        return { data: fullDataset, reason: 'Comparison requires full dataset', type: 'full' };
      }
      
      // Seviye bazlı sorular (o seviyenin tüm verileri)
      if (lowerQuestion.includes('manager') && !lowerQuestion.includes('director')) {
        const filtered = fullDataset.filter(job => {
          const level = (job['Level'] || job['PC'] || '').toLowerCase();
          return level.includes('manager');
        });
        return { data: filtered, reason: 'Manager level specific query', type: 'level_filtered' };
      }
      
      if (lowerQuestion.includes('director')) {
        const filtered = fullDataset.filter(job => {
          const level = (job['Level'] || job['PC'] || '').toLowerCase();
          return level.includes('director');
        });
        return { data: filtered, reason: 'Director level specific query', type: 'level_filtered' };
      }
      
      // İstatistiksel sorular (güvenilir istatistik için minimum 100 kayıt)
      if (lowerQuestion.includes('average') || lowerQuestion.includes('median') || lowerQuestion.includes('percentile')) {
        return { data: fullDataset, reason: 'Statistical analysis requires large sample', type: 'full' };
      }
      
      // Aile/departman sorguları (tüm aileler için karşılaştırma)
      if (lowerQuestion.includes('family') || lowerQuestion.includes('department') || lowerQuestion.includes('sector')) {
        return { data: fullDataset, reason: 'Family analysis requires full dataset', type: 'full' };
      }
      
      // Basit bilgi sorguları için sample
      return { data: fullDataset.slice(0, 30), reason: 'Simple query, sample sufficient', type: 'sample' };
    };

    // Debug: Log the received context data
    console.log('Received data context:', JSON.stringify(dataContext));
    
    // Akıllı veri seçimi
    const dataStrategy = dataContext?.fullDataset ? 
      getDataStrategy(message, dataContext.fullDataset) : { data: [], reason: 'No dataset', type: 'empty' };
    
    const relevantData = dataStrategy.data;
    
    console.log('Data strategy selected:', {
      originalSize: dataContext?.fullDataset?.length || 0,
      selectedSize: relevantData.length,
      reason: dataStrategy.reason,
      type: dataStrategy.type,
      question: message.substring(0, 50)
    });

    // Check if context data is valid
    const hasValidData = dataContext && 
                         dataContext.totalJobs > 0 && 
                         relevantData.length > 0;
    
    console.log('Data validation result:', {
      hasValidData,
      contextExists: !!dataContext,
      totalJobsCheck: dataContext?.totalJobs > 0,
      fullDatasetCheck: dataContext?.fullDataset && dataContext.fullDataset.length > 0,
      levelAnalysisCheck: !!dataContext?.levelAnalysis,
      familyAnalysisCheck: !!dataContext?.familyAnalysis
    });
    
    if (!hasValidData) {
      console.log('Warning: Invalid or missing data context');
      console.log('Fallback context will be used');
    }

    // Prepare concise system prompt
    const systemPrompt = `You are a job compensation data analyst. ${hasValidData ? 'Analyze the provided dataset only.' : 'Data unavailable - provide general guidance.'}

${hasValidData ? `DATASET: ${dataContext?.totalJobs || 0} job positions
LEVELS: ${dataContext?.allLevels?.slice(0, 3)?.join(', ') || 'N/A'}
FAMILIES: ${dataContext?.allFamilies?.slice(0, 3)?.join(', ') || 'N/A'}
COUNTRIES: ${dataContext?.allCountries?.slice(0, 3)?.join(', ') || 'N/A'}

KEY COLUMNS: "Base Salary-Average", "Total Guaranteed Compensation-Average", "Actual Total Compensation-Average", "Job", "Family", "Level", "country"

DATA SAMPLE:
${JSON.stringify(relevantData.slice(0, 2) || [])}
${relevantData.length > 2 ? `...${relevantData.length - 2} more records` : ''}` : 'No dataset available'}

RULES:
1. Use ONLY provided data
2. Never use placeholder values
3. State "data not available" if missing
4. Respond in English
5. Show real numerical values only`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    console.log('Environment check:', {
      hasApiKey: !!geminiApiKey,
      apiKeyLength: geminiApiKey ? geminiApiKey.length : 0,
      apiKeyStart: geminiApiKey ? geminiApiKey.substring(0, 10) + '...' : 'none'
    });
    
    if (!geminiApiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          response: 'Debug: GEMINI_API_KEY environment variable is missing. Please check Netlify settings.' 
        }),
      };
    }

    // If no valid data context is provided, still proceed but with limited functionality
    if (!hasValidData) {
      console.log('Proceeding without valid data context - AI will provide general guidance');
    }

    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + geminiApiKey, {
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
          temperature: 0.0,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: aiResponse }),
    };
  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      geminiApiKey: process.env.GEMINI_API_KEY ? 'Present' : 'Missing'
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        response: `Debug: ${error.message}. Please check Netlify function logs.` 
      }),
    };
  }
};

export { handler }; 