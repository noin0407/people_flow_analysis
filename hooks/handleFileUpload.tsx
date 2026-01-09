"use client";

import { CrowdData } from "@/types";
import { parseCSVLine } from "./parseCSVLine";

interface UploadArgs {
  event: React.ChangeEvent<HTMLInputElement>;
  setFileName: (name: string) => void;
  setRawData: (data: CrowdData[]) => void;
  setSelectedDate: (date: string) => void;
  setSelectedLocation: (loc: string) => void;
  // leafletMap は外部（MapView）にあるため、必要ならコールバックを渡す
  onSuccess?: (firstData: CrowdData) => void;
}

export const handleFileUpload = ({
  event,
  setFileName,
  setRawData,
  setSelectedDate,
  setSelectedLocation,
  onSuccess,
}: UploadArgs) => {
  const file = event.target.files?.[0];
  if (!file) return;
  setFileName(file.name);

  const reader = new FileReader();
  reader.onload = (e) => {
    if (!e.target) return;
    const text = e.target.result as string;

    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (lines.length < 2) return;

    const rows = lines.slice(1);

    const parsed: CrowdData[] = rows
      .map((row) => {
        const cols = parseCSVLine(row);

        // 期待される列順 (最新ファイル):
        // [0]dateObservedFrom, [1]peopleCount, [2]peopleOccupancy, [3]identifcation, [4]locationName, [5]latitude, [6]longitude
        if (cols.length < 7) return null;

        return {
          dateObservedFrom: cols[0],
          peopleCount: parseFloat(cols[1]) || 0,
          peopleOccupancy: parseFloat(cols[2]) || 0,
          identifcation: cols[3],
          locationName: cols[4],
          latitude: parseFloat(cols[5]),
          longitude: parseFloat(cols[6]),
        };
      })
      .filter(
        (r): r is CrowdData =>
          r !== null && !isNaN(r.latitude) && !isNaN(r.longitude)
      );

    if (parsed.length > 0) {
      setRawData(parsed);
      const dates = Array.from(
        new Set(parsed.map((d) => d.dateObservedFrom?.split("T")[0]))
      )
        .filter(Boolean)
        .sort();
      if (dates.length > 0) setSelectedDate(dates[0]);
      if (parsed[0]) {
        setSelectedLocation(parsed[0].locationName);
        onSuccess?.(parsed[0]);
        // if (leafletMap.current)
        //   leafletMap.current.flyTo(
        //     [parsed[0].latitude, parsed[0].longitude],
        //     14
        //   );
      }
    }
  };
  reader.readAsText(file);

  const inputElement = event.target as HTMLInputElement;
  if (inputElement) {
    event.target.value = "";
  }
};
