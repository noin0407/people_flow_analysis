import pandas as pd
import os

print("--- 処理を開始します ---")

# 1. ファイルの読み込み
# ※CSVファイルがこの .py ファイルと同じフォルダにあることを確認してください
file_location = 'sensor_loation_________.csv'
file_flow = 'people-flow-2025.csv'

try:
    print(f"読み込み中: {file_location}")
    df_loc = pd.read_csv(file_location)
    
    print(f"読み込み中: {file_flow}")
    df_flow = pd.read_csv(file_flow)

    # 2. データの結合（マージ）
    print("データを結合しています...")
    # 日付を読み取り可能な形式に変換
    df_flow['dateObservedFrom'] = pd.to_datetime(df_flow['dateObservedFrom'])
    # IDを基準に合体
    merged = pd.merge(df_flow, df_loc, on='identifcation', how='left')

    # 3. ArcGIS用に形式を整える
    print("ArcGIS用に整形しています...")
    # 時刻を YYYY-MM-DD HH:MM:SS の形式にする
    merged['Timestamp'] = merged['dateObservedFrom'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    # 必要な列だけを抽出して名前を分かりやすくする
    output = merged[[
        'identifcation', '開催場所', '緯度', '経度', 'Timestamp', 'peopleCount'
    ]]
    output.columns = ['SensorID', 'LocationName', 'Latitude', 'Longitude', 'Timestamp', 'PeopleCount']

    # 4. 保存
    output_name = 'sendai_for_arcgis.csv'
    output.to_csv(output_name, index=False, encoding='utf-8-sig')
    
    print("------------------------------------------")
    print(f"成功しました！ '{output_name}' が作成されました。")
    print("このファイルを ArcGIS Pro にドラッグ＆ドロップしてください。")
    print("------------------------------------------")

except Exception as e:
    print(f"エラーが発生しました: {e}")
    print("CSVファイルの名前が正しいか、同じフォルダにあるか確認してください。")