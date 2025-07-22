import { createClient } from '@supabase/supabase-js';

// Supabase URL ve API anahtarını environment variables'dan al
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase bağlantı bilgileri:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  keyStart: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'none',
  isProduction: !import.meta.env.DEV,
  environment: import.meta.env.MODE
});

// Environment variables kontrolü
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables eksik:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlValue: supabaseUrl,
    mode: import.meta.env.MODE
  });
}

// Supabase istemcisini oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tüm tabloları listeleme fonksiyonu
export async function listAllTables() {
  console.log('Tüm tablolar listeleniyor...');
  
  try {
    const { data, error } = await supabase
      .from('job_e')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Tablo listesi alınamadı:', error);
      return ['job_e'];
    }
    
    return ['job_e'];
  } catch (err) {
    console.error('Tablo listesi alınamadı (exception):', err);
    return ['job_e'];
  }
}

// JOB_E tablosundan veri çekme fonksiyonu - TÜM VERİLERİ ALMAK İÇİN
export async function fetchJobEData() {
  console.log('job_e tablosundan tüm veriler çekiliyor...');
  console.log('Supabase client durumu:', {
    clientExists: !!supabase,
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  
  try {
    // Önce toplam kayıt sayısını öğren
    const { count } = await supabase
      .from('job_e')
      .select('*', { count: 'exact', head: true });
    
    console.log('Toplam kayıt sayısı:', count);
    
    // Eğer 1000'den fazla kayıt varsa batch'ler halinde çek
    if (count && count > 1000) {
      console.log('1000+ kayıt tespit edildi, batch işlem başlatılıyor...');
      const allData = [];
      const batchSize = 1000;
      
      for (let i = 0; i < count; i += batchSize) {
        const { data: batchData, error } = await supabase
          .from('job_e')
          .select('*')
          .range(i, i + batchSize - 1);
        
        if (error) {
          console.error(`Batch ${i}-${i + batchSize - 1} veri çekme hatası:`, error);
          throw error;
        }
        
        if (batchData) {
          allData.push(...batchData);
          console.log(`Batch ${i}-${i + batchSize - 1} tamamlandı: ${batchData.length} kayıt`);
        }
      }
      
      console.log('Tüm batch işlemleri tamamlandı. Toplam kayıt:', allData.length);
      return allData;
    } else {
      // 1000 veya daha az kayıt varsa normal şekilde çek
      const { data, error } = await supabase
        .from('job_e')
        .select('*');
      
      if (error) {
        console.error('job_e tablosu veri çekme hatası:', error);
        console.error('Hata detayları:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return [];
      }
      
      console.log('job_e tablosu verileri:', data?.length, 'kayıt bulundu');
      if (data && data.length > 0) {
        console.log('İlk kayıt örneği:', data[0]);
        console.log('Tablo sütunları:', Object.keys(data[0]));
      }
      
      return data || [];
    }
  } catch (err) {
    console.error('job_e tablosu veri çekme hatası (exception):', err);
    console.error('Exception detayları:', {
      name: err?.name,
      message: err?.message,
      stack: err?.stack
    });
    return [];
  }
}

// Tip-güvenli veri getirme fonksiyonları
export async function fetchFamilyData() {
  const { data, error } = await supabase
    .from('family_distribution')
    .select('*');
  
  if (error) {
    console.error('Veri çekme hatası:', error);
    return [];
  }
  
  return data;
}

export async function fetchSalaryData() {
  const { data, error } = await supabase
    .from('salary_positions')
    .select('*')
    .order('salary', { ascending: false });
  
  if (error) {
    console.error('Veri çekme hatası:', error);
    return [];
  }
  
  return data;
} 