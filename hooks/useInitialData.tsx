import { useEffect, Dispatch, SetStateAction } from "react";
import { CrowdData } from "@/types";
import { generateMockCsvData } from "./generateMockCsvData";

interface useInitialDataProps{
  setRawData: Dispatch<SetStateAction<CrowdData[]>>;
  setSelectedDate: Dispatch<SetStateAction<string>>;
  setSelectedLocation: Dispatch<SetStateAction<string>>;
  setFileName: Dispatch<SetStateAction<string>>;
}

export const useInitialData = ({
  setRawData,
  setSelectedDate, 
  setSelectedLocation, 
  setFileName
}:useInitialDataProps):void  =>{
  useEffect(()=> {
    const initialData = generateMockCsvData();

    setRawData(initialData);
    setSelectedDate('2025-01-01');
    setSelectedLocation('ハピナ名掛丁商店街');
    setFileName('initial_sample.csv');
  },[setRawData, setSelectedDate, setSelectedLocation, setFileName]);
};