import pandas as pd
import numpy as np
import random

# Ülkelerin metrik değerlerini içeren dosyayı oku
country_metrics = pd.read_csv('country_metrics.csv')

# Metrik değerlerini ülkelere göre sözlüklere dönüştür
poland_values = dict(zip(country_metrics['Metric'], country_metrics['Poland']))
germany_values = dict(zip(country_metrics['Metric'], country_metrics['Germany']))
switzerland_values = dict(zip(country_metrics['Metric'], country_metrics['Switzerland']))

# job_e_rows.csv dosyasını oku
try:
    job_data = pd.read_csv('job_e_rows.csv')
    print(f"Orijinal veri setinde {len(job_data)} satır var.")
except Exception as e:
    print(f"Dosya okuma hatası: {e}")
    exit(1)

# Ülkeleri ve değerleri eşleştiren sözlük
country_value_map = {
    'Poland': poland_values,
    'Germany': germany_values,
    'Switzerland': switzerland_values
}

# Her bir satır için rastgele bir ülke ata
countries = ['Poland', 'Germany', 'Switzerland']
job_data['country'] = [random.choice(countries) for _ in range(len(job_data))]

# Metrik sütunları ve bunların değerlerini güncelle
metric_columns = [
    'Base Salary-Average', 'Base Salary-#Orgs', 'Base Salary-#Cases',
    'Base Salary-10th', 'Base Salary-25th', 'Base Salary-Median',
    'Base Salary-75th', 'Base Salary-90th',
    'Total Guaranteed Compensation-Average', 'Total Guaranteed Compensation-#Orgs',
    'Total Guaranteed Compensation-#Cases', 'Total Guaranteed Compensation-10th',
    'Total Guaranteed Compensation-25th', 'Total Guaranteed Compensation-Median',
    'Total Guaranteed Compensation-75th', 'Total Guaranteed Compensation-90th',
    'Actual Total Compensation-Average', 'Actual Total Compensation-#Orgs',
    'Actual Total Compensation-#Cases', 'Actual Total Compensation-10th',
    'Actual Total Compensation-25th', 'Actual Total Compensation-Median',
    'Actual Total Compensation-75th', 'Actual Total Compensation-90th'
]

# Her satır için atanan ülkeye göre değerleri güncelle
for index, row in job_data.iterrows():
    country = row['country']
    for metric in metric_columns:
        if metric in country_value_map[country]:
            job_data.at[index, metric] = country_value_map[country][metric]

# Sonuçları yeni bir CSV dosyasına kaydet
job_data.to_csv('job_e_rows_with_countries.csv', index=False)
print("Yeni veri seti 'job_e_rows_with_countries.csv' dosyasına kaydedildi.")

# Her ülke için kaç satır olduğunu göster
country_counts = job_data['country'].value_counts()
print("\nÜlkelere göre satır sayıları:")
for country, count in country_counts.items():
    print(f"{country}: {count} satır") 