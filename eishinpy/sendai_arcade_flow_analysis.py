import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# ※ データは前回の文脈を引き継ぎ、変数がある前提で処理します
# もし変数が消えている場合は再定義が必要ですが、ロジックを示します

# 1. ゾーン定義の辞書を作成
zone_mapping = {
    'jp.sendai.Blesensor.per3600.1': 'Zone A: 駅前(ハピナ)',
    'jp.sendai.Blesensor.per3600.2': 'Zone A: 駅前(ハピナ)',
    'jp.sendai.Blesensor.per3600.3': 'Zone B: 中央(クリス)',
    'jp.sendai.Blesensor.per3600.4': 'Zone B: 中央(クリス)',
    'jp.sendai.Blesensor.per3600.5': 'Zone C: 藤崎(マーブル)',
    'jp.sendai.Blesensor.per3600.6': 'Zone C: 藤崎(マーブル)'
}

# 2. データのゾーン集計
# センサーごとの位置情報をゾーンごとに平均して「代表地点」を作る
sensor_loc_df['Zone'] = sensor_loc_df['identifcation'].map(zone_mapping)
zone_loc = sensor_loc_df.groupby('Zone')[['緯度', '経度']].mean().reset_index()

# 人流データをゾーンごとに平均する
people_flow_df['Zone'] = people_flow_df['identifcation'].map(zone_mapping)
people_flow_df['dateObservedFrom'] = pd.to_datetime(people_flow_df['dateObservedFrom'])

# 時間 x ゾーン ごとの平均人数
zone_flow = people_flow_df.groupby(['dateObservedFrom', 'Zone'])['peopleCount'].mean().reset_index()
zone_pivot = zone_flow.pivot(index='dateObservedFrom', columns='Zone', values='peopleCount')

# 3. ターゲットとする「駅前(A) ⇔ 藤崎(C)」間のポテンシャル計算
# ゾーン間の距離計算 (Haversine)
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2)**2
    return 2 * R * np.arctan2(np.sqrt(a), np.sqrt(1-a))

loc_a = zone_loc[zone_loc['Zone'] == 'Zone A: 駅前(ハピナ)'].iloc[0]
loc_c = zone_loc[zone_loc['Zone'] == 'Zone C: 藤崎(マーブル)'].iloc[0]
dist_ac = haversine(loc_a['緯度'], loc_a['経度'], loc_c['緯度'], loc_c['経度'])

print(f"Zone A(駅前) - Zone C(藤崎) 間の代表距離: {dist_ac:.1f} m")

# ポテンシャル計算
# モデル1: 距離抵抗あり (Mass * Mass / Distance) ※2乗ではなく1乗に緩和
potential_linear = (zone_pivot['Zone A: 駅前(ハピナ)'] * zone_pivot['Zone C: 藤崎(マーブル)']) / dist_ac

# モデル2: 距離抵抗なし (Mass * Mass) ※純粋な「需要の総量」
potential_mass = (zone_pivot['Zone A: 駅前(ハピナ)'] * zone_pivot['Zone C: 藤崎(マーブル)'])

# 4. 可視化 (2025-01-11の土曜日を例に)
plot_data = pd.DataFrame({
    'Model 1 (Linear Decay)': potential_linear,
    'Model 2 (No Decay)': potential_mass / 1000 # スケール調整
})
subset = plot_data['2025-01-11']

plt.figure(figsize=(12, 6))
sns.lineplot(data=subset)
plt.title('Potential Analysis: Station Zone vs Fujisaki Zone (2025-01-11)')
plt.ylabel('Interaction Score')
plt.xlabel('Time')
plt.grid(True)
plt.show()