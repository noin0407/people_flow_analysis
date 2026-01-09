import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

# 日本語フォントの設定（文字化け対策）
# Windowsなら 'Meiryo' や 'MS Gothic' を指定
plt.rcParams['font.family'] = 'Meiryo' 

print("--- 分析を開始します ---")

# 1. ファイルの読み込み
file_loc = 'sensor_loation_________.csv'
file_flow = 'people-flow-2025.csv'

# ファイルが存在するか確認
if not os.path.exists(file_loc) or not os.path.exists(file_flow):
    print("エラー: CSVファイルが見つかりません。同じフォルダに置いてください。")
    exit()

print("データを読み込んでいます...")
sensor_loc_df = pd.read_csv(file_loc)
people_flow_df = pd.read_csv(file_flow)

# 2. ゾーン定義の辞書を作成
zone_mapping = {
    'jp.sendai.Blesensor.per3600.1': 'Zone A: 駅前(ハピナ)',
    'jp.sendai.Blesensor.per3600.2': 'Zone A: 駅前(ハピナ)',
    'jp.sendai.Blesensor.per3600.3': 'Zone B: 中央(クリス)',
    'jp.sendai.Blesensor.per3600.4': 'Zone B: 中央(クリス)',
    'jp.sendai.Blesensor.per3600.5': 'Zone C: 藤崎(マーブル)',
    'jp.sendai.Blesensor.per3600.6': 'Zone C: 藤崎(マーブル)'
}

# 3. データのゾーン集計
print("データをゾーン別に集計しています...")
# センサーごとの位置情報をゾーンごとに平均して「代表地点」を作る
sensor_loc_df['Zone'] = sensor_loc_df['identifcation'].map(zone_mapping)
zone_loc = sensor_loc_df.groupby('Zone')[['緯度', '経度']].mean().reset_index()

# 人流データをゾーンごとに平均する
people_flow_df['Zone'] = people_flow_df['identifcation'].map(zone_mapping)
people_flow_df['dateObservedFrom'] = pd.to_datetime(people_flow_df['dateObservedFrom'])

# 時間 x ゾーン ごとの平均人数を集計
zone_flow = people_flow_df.groupby(['dateObservedFrom', 'Zone'])['peopleCount'].mean().reset_index()
zone_pivot = zone_flow.pivot(index='dateObservedFrom', columns='Zone', values='peopleCount')

# 4. ポテンシャル計算
# 距離計算の関数 (Haversine formula)
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000 # 地球の半径 (メートル)
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2)**2
    return 2 * R * np.arctan2(np.sqrt(a), np.sqrt(1-a))

# 駅前(A)と藤崎(C)の距離を計算
loc_a = zone_loc[zone_loc['Zone'] == 'Zone A: 駅前(ハピナ)'].iloc[0]
loc_c = zone_loc[zone_loc['Zone'] == 'Zone C: 藤崎(マーブル)'].iloc[0]
dist_ac = haversine(loc_a['緯度'], loc_a['経度'], loc_c['緯度'], loc_c['経度'])

print(f"Zone A(駅前) - Zone C(藤崎) 間の代表距離: {dist_ac:.1f} m")

# ポテンシャル計算
# Model 1: 距離抵抗あり (距離の1乗で割る = 線形減衰)
potential_linear = (zone_pivot['Zone A: 駅前(ハピナ)'] * zone_pivot['Zone C: 藤崎(マーブル)']) / dist_ac

# Model 2: 距離抵抗なし (純粋な需要の総量)
potential_mass = (zone_pivot['Zone A: 駅前(ハピナ)'] * zone_pivot['Zone C: 藤崎(マーブル)'])

# 5. グラフの作成
print("グラフを作成しています...")
# データをまとめる
plot_data = pd.DataFrame({
    'Model 1: 現状 (距離抵抗あり)': potential_linear,
    'Model 2: モビリティ導入後 (距離抵抗ゼロ)': potential_mass / 1000 # グラフで見やすくするため桁を調整
})

# 特定の日付（例：データの最初の3日間）を抽出して表示
subset = plot_data.iloc[:72] # 最初の72時間分

plt.figure(figsize=(12, 6))
sns.lineplot(data=subset)
plt.title('Station Zone vs Fujisaki Zone: Potential Interaction Analysis')
plt.ylabel('Interaction Score')
plt.xlabel('Time')
plt.grid(True)
plt.legend()
plt.tight_layout()

# 画像として保存
plt.savefig('potential_analysis.png')
print("完了しました！ 'potential_analysis.png' が作成されました。")

# 画面に表示（VS Codeの設定によっては出ない場合があります）
plt.show()

