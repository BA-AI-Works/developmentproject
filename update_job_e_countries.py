import sqlite3
import pandas as pd

# CSV dosyasını oku
df = pd.read_csv('job_e_rows_with_countries.csv')

# SQLite veritabanına bağlan
conn = sqlite3.connect('job_e.db')
cursor = conn.cursor()

# Önce jobs tablosunda country sütunu olup olmadığını kontrol et
cursor.execute("PRAGMA table_info(jobs)")
columns = cursor.fetchall()
country_exists = any(col[1] == 'country' for col in columns)

# Eğer country sütunu yoksa ekle
if not country_exists:
    cursor.execute("ALTER TABLE jobs ADD COLUMN country TEXT")
    print("'country' sütunu jobs tablosuna eklendi.")

# Her bir satır için güncelleme yap
updated_count = 0
try:
    for index, row in df.iterrows():
        record_id = row['Record ID']
        country = row['country']
        
        cursor.execute("""
            UPDATE jobs 
            SET country = ? 
            WHERE id = ?
        """, (country, record_id))
        
        if cursor.rowcount > 0:
            updated_count += 1

    # Değişiklikleri kaydet
    conn.commit()
    print(f"Toplam {updated_count} satır güncellendi.")

except Exception as e:
    print(f"Hata oluştu: {e}")
    conn.rollback()

finally:
    # Bağlantıyı kapat
    conn.close()

print("İşlem tamamlandı.") 