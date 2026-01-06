import { CrowdData } from "@/types";

export const generateMockCsvData = () => {
  const data:CrowdData[] = [];
  const dates = ["2025-01-01", "2025-01-02"];
  const areas = [
    { id: 'jp.sendai.sample.1', name: 'ハピナ名掛丁商店街', lat: 38.261976, lng: 140.880226 },
    { id: 'jp.sendai.sample.2', name: '勾当台公園歴史のゾーン・北', lat: 38.268649, lng: 140.870504 },
  ];
  
  dates.forEach(dateStr => {
    areas.forEach(area => {
      for (let h = 0; h < 24; h++) {
        const hourStr = String(h).padStart(2, '0');
        const count = (Math.random() * 500 + 100);
        data.push({
          dateObservedFrom: `${dateStr}T${hourStr}:00:00+09:00`,
          peopleCount: parseFloat(count.toFixed(2)),
          peopleOccupancy: parseFloat((count / 20).toFixed(4)), // occupancyのスケールを実データに合わせる
          identifcation: area.id,
          locationName: area.name,
          latitude: area.lat,
          longitude: area.lng
        });
      }
    });
  });
  return data;
};