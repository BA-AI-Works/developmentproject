import pandas as pd
from supabase import create_client
import os
from dotenv import load_dotenv

# .env.local dosyasından Supabase kimlik bilgilerini yükle
load_dotenv('.env.local')
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    print("Hata: NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local dosyasında tanımlanmalıdır.")
    exit(1)

# Supabase istemcisini oluştur
supabase = create_client(supabase_url, supabase_key)

try:
    # CSV dosyasını oku
    df = pd.read_csv('job_e_rows_with_countries.csv')
    print(f"CSV dosyasından {len(df)} satır okundu.")

    # Her satır için güncelleme yap
    update_count = 0
    error_count = 0

    for index, row in df.iterrows():
        try:
            # Job Code ve country değerlerini al
            job_code = row['Job Code']
            country = row['country']

            # SQL sorgusu ile güncelleme yap
            sql = f'''
            UPDATE job_e 
            SET country = '{country}'
            WHERE "Job Code" = '{job_code}';
            '''
            
            result = supabase.rpc('execute_sql', {'query': sql}).execute()

            update_count += 1
            if update_count % 50 == 0:
                print(f"{update_count} satır güncellendi...")

        except Exception as e:
            print(f"Hata (Job Code: {job_code}): {str(e)}")
            error_count += 1

    print("\nGüncelleme tamamlandı!")
    print(f"Toplam güncellenen satır: {update_count}")
    print(f"Hata oluşan satır: {error_count}")

except Exception as e:
    print(f"Genel hata: {str(e)}") 