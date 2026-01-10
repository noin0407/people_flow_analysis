import pandas as pd
import numpy as np

# 1. データの読み込み
df = pd.read_csv('base data.csv')

# 2. データの前処理
# '商店街'を含む場所のみを抽出
arcade_df = df[df['LocationName'].str.contains('商店街')].copy()
arcade_df['Timestamp'] = pd.to_datetime(arcade_df['Timestamp'])

# 時間ごとの各地点の人数を列に持つピボットテーブルを作成
df_pivot = arcade_df.pivot_table(index='Timestamp', columns='LocationName', values='PeopleCount')

# 各地点の緯度経度を取得（平均値を使用）
locations = arcade_df.groupby('LocationName').agg({'Latitude': 'mean', 'Longitude': 'mean'}).reset_index()

# 3. 距離計算関数の定義（ハバーサイン公式）
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # 地球の半径 (メートル)
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return R * c

# 4. 計算対象とする隣接ペア（エッジ）の定義
edges = [
    # ハピナ名掛丁
    ('ハピナ名掛丁商店街・東', 'ハピナ名掛丁商店街・西'),
    # 接続：ハピナ - クリスロード
    ('ハピナ名掛丁商店街・西', 'クリスロード商店街・中央'),
    # クリスロード
    ('クリスロード商店街・中央', 'クリスロード商店街・西'),
    # 接続：クリスロード - マーブルロード
    ('クリスロード商店街・西', 'マーブルロードおおまち商店街・東'),
    # マーブルロード
    ('マーブルロードおおまち商店街・東', 'マーブルロードおおまち商店街・西'),
    
    # --- 指定のT字路（ぶらんど～む一番町商店街・南）周辺 ---
    ('マーブルロードおおまち商店街・西', 'ぶらんど～む一番町商店街・南'),
    ('ぶらんど～む一番町商店街・南', 'サンモール一番町商店街・中央'),
    ('ぶらんど～む一番町商店街・南', 'ぶらんど～む一番町商店街・北'),
    # ---------------------------------------------------

    # サンモール一番町
    ('サンモール一番町商店街・中央', 'サンモール一番町商店街・南'),
    # 接続：ぶらんど～む - 一番町四丁目
    ('ぶらんど～む一番町商店街・北', '一番町四丁目商店街・南'),
    # 一番町四丁目
    ('一番町四丁目商店街・南', '一番町四丁目商店街・中央'),
    ('一番町四丁目商店街・中央', '一番町四丁目商店街・北')
]

# 5. 重力モデルによる交通量予測計算
# まず各エッジ間の距離を計算
edge_dists = {}
for u, v in edges:
    if u in locations['LocationName'].values and v in locations['LocationName'].values:
        c1 = locations[locations['LocationName'] == u].iloc[0]
        c2 = locations[locations['LocationName'] == v].iloc[0]
        dist = haversine_distance(c1['Latitude'], c1['Longitude'], c2['Latitude'], c2['Longitude'])
        edge_dists[(u,v)] = dist
    else:
        print(f"Skipping edge {u}-{v}, location missing.")

# 計算実行: (Pi * Pj) / dist^1
edge_flow_df = pd.DataFrame(index=df_pivot.index)

for (u, v), dist in edge_dists.items():
    if dist > 0:
        # 重力モデル式
        flow = (df_pivot[u] * df_pivot[v]) / dist
        
        # カラム名を "地点A - 地点B" として保存
        edge_name = f"{u} - {v}"
        edge_flow_df[edge_name] = flow

# 6. CSVファイルとして出力
edge_flow_df.to_csv('arcade_gravity_flow.csv')
print("Saved to arcade_gravity_flow.csv")