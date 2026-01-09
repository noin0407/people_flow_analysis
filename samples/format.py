import json
import csv
from datetime import datetime, timedelta

# 設定
input_json = 'location-history.json'
output_csv = 'timeline_for_arcgis.csv'

def parse_geo(geo_str):
    """'geo:35.426180,140.291992' を数値に変換"""
    if not geo_str or not geo_str.startswith('geo:'):
        return None, None
    try:
        # 'geo:' を消して、カンマで分ける
        coords = geo_str.replace('geo:', '').split(',')
        return float(coords[0]), float(coords[1])
    except:
        return None, None

def convert():
    try:
        with open(input_json, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"エラー: {input_json} が見つかりません。")
        return

    count = 0
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['timestamp', 'latitude', 'longitude', 'type', 'semantic_type'])

        for item in data:
            # 1. visit (滞在地点)
            if 'visit' in item:
                visit = item['visit']
                start_time = item.get('startTime')
                geo_str = visit.get('topCandidate', {}).get('placeLocation', '')
                semantic_type = visit.get('topCandidate', {}).get('semanticType', 'Unknown')
                
                lat, lon = parse_geo(geo_str)
                if lat is not None:
                    writer.writerow([start_time, lat, lon, 'visit', semantic_type])
                    count += 1

            # 2. activity (移動の開始・終了)
            if 'activity' in item:
                activity = item['activity']
                start_time = item.get('startTime')
                end_time = item.get('endTime')
                
                s_lat, s_lon = parse_geo(activity.get('start', ''))
                if s_lat is not None:
                    writer.writerow([start_time, s_lat, s_lon, 'activity_start', ''])
                    count += 1
                
                e_lat, e_lon = parse_geo(activity.get('end', ''))
                if e_lat is not None:
                    writer.writerow([end_time, e_lat, e_lon, 'activity_end', ''])
                    count += 1

            # 3. timelinePath (移動経路のログ)
            if 'timelinePath' in item:
                start_time_str = item.get('startTime')
                try:
                    # ISO 8601形式の時刻を処理
                    base_time_str = start_time_str.split('.')[0].replace('Z', '')
                    if '+' in base_time_str:
                        base_time_str = base_time_str.split('+')[0]
                    base_time = datetime.fromisoformat(base_time_str)
                except:
                    continue

                for path_point in item['timelinePath']:
                    lat, lon = parse_geo(path_point.get('point', ''))
                    offset = int(path_point.get('durationMinutesOffsetFromStartTime', 0))
                    point_time = base_time + timedelta(minutes=offset)
                    
                    if lat is not None:
                        writer.writerow([point_time.isoformat(), lat, lon, 'path_point', ''])
                        count += 1

    print(f"変換が完了しました！")
    print(f"書き込まれたデータ数: {count} 件")
    print(f"出力ファイル: {output_csv}")

if __name__ == '__main__':
    convert()