import pandas as pd
import numpy as np

# Ülke verileri içeren dosyayı oku
try:
    job_data = pd.read_csv('job_e_rows_with_countries.csv')
    print(f"Veri setinde toplam {len(job_data)} satır var.")
except Exception as e:
    print(f"Dosya okuma hatası: {e}")
    exit(1)

# Metrik sütunları
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

# Her ülke için özet istatistikler
countries = job_data['country'].unique()
print("\nÜlkelere göre özet istatistikler:")
print("=" * 80)

for country in sorted(countries):
    country_data = job_data[job_data['country'] == country]
    print(f"\n{country} (Toplam {len(country_data)} satır):")
    print("-" * 40)
    
    for metric in metric_columns:
        unique_value = country_data[metric].iloc[0]
        print(f"{metric}: {unique_value}")
    
    print("-" * 40)

# Ülkeler arası karşılaştırma
print("\nÜlkeler arası metrik karşılaştırması:")
print("=" * 80)

comparison_df = pd.DataFrame(columns=['Metric'] + sorted(countries))
for metric in metric_columns:
    row = {'Metric': metric}
    for country in sorted(countries):
        country_data = job_data[job_data['country'] == country]
        row[country] = country_data[metric].iloc[0]
    comparison_df = pd.concat([comparison_df, pd.DataFrame([row])], ignore_index=True)

# Karşılaştırma tablosunu göster
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 120)
print(comparison_df)

# Karşılaştırma tablosunu CSV olarak kaydet
comparison_df.to_csv('country_comparison.csv', index=False)
print("\nÜlke karşılaştırması 'country_comparison.csv' dosyasına kaydedildi.") 