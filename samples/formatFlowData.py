import pandas as pd

sensor_filepath = 'people-flow-sensor.csv'
flowdata_filepath = 'people-flow-2025.csv'

result_filepath = 'flowdata_2025.csv'

# CSVファイルを読み込む
df1 = pd.read_csv(sensor_filepath)
df2 = pd.read_csv(flowdata_filepath)

# identificationを主キーにしてマージ
merged_df = pd.merge(df1, df2, on='identifcation', how='inner')

cols = ['identifcation', 'dateObservedFrom', 'peopleCount','peopleOccupancy','locationName','latitude','longitude']

merged_df = merged_df[cols]

dic = {
    'ハピナ名掛丁商店街': ['jp.sendai.Blesensor.per3600.1', 'jp.sendai.Blesensor.per3600.2'],
    'クリスロード商店街': ['jp.sendai.Blesensor.per3600.3', 'jp.sendai.Blesensor.per3600.4'],
    'マーブルロードおおまち商店街': ['jp.sendai.Blesensor.per3600.5', 'jp.sendai.Blesensor.per3600.6'],
    'サンモール一番町商店街': ['jp.sendai.Blesensor.per3600.7', 'jp.sendai.Blesensor.per3600.8'],
    'ぶらんど～む一番町商店街': ['jp.sendai.Blesensor.per3600.9', 'jp.sendai.Blesensor.per3600.10'],
    '一番町四丁目商店街': ['jp.sendai.Blesensor.per3600.11', 'jp.sendai.Blesensor.per3600.12', 'jp.sendai.Blesensor.per3600.13'],
    '定禅寺通・夏の思い出像':['jp.sendai.Blesensor.per3600.14'],
    '定禅寺通・県民会館前':['jp.sendai.Blesensor.per3600.15'],
    '定禅寺通・春日町交差点西側':['jp.sendai.Blesensor.per3600.16'],
    '定禅寺通・水浴の女像':['jp.sendai.Blesensor.per3600.17'],
    '西公園SL広場':['jp.sendai.Blesensor.per3600.18'],
    '仙台市役所本庁舎敷地': ['jp.sendai.Blesensor.per3600.19', 'jp.sendai.Blesensor.per3600.20'],
    '勾当台公園市民広場':['jp.sendai.Blesensor.per3600.21'],
    '勾当台公園円形広場':['jp.sendai.Blesensor.per3600.22'],
    'つなぎ横丁':['jp.sendai.Blesensor.per3600.23'],
    '勾当台公園いこいのゾーン': ['jp.sendai.Blesensor.per3600.24', 'jp.sendai.Blesensor.per3600.25', 'jp.sendai.Blesensor.per3600.26', 'jp.sendai.Blesensor.per3600.27'],
    '勾当台公園歴史のゾーン・北':['jp.sendai.Blesensor.per3600.28'],
}

for location, ids in dic.items():
    temp_df = merged_df[merged_df['identifcation'].isin(ids)]
    temp_agg = temp_df.groupby('dateObservedFrom').agg({
        'peopleCount': 'sum',
        'peopleOccupancy': 'sum',
    }).reset_index()
    temp_agg['identifcation'] = ids[0]
    temp_agg['locationName'] = location
    temp_agg['latitude'] = temp_df['latitude'].iloc[0]
    temp_agg['longitude'] = temp_df['longitude'].iloc[0]
    
    if 'aggregated' in locals():
        aggregated = pd.concat([aggregated, temp_agg], ignore_index=True)
    else:
        aggregated = temp_agg

print(aggregated.head())

# マージ結果をCSVに出力
aggregated.to_csv(result_filepath, index=False)

print("マージ完了しました")