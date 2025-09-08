export function makeSeed(seedStr: string){
  let h = 2166136261 ^ seedStr.length;
  for (let i=0;i<seedStr.length;i++){
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function rand(){
    h += h<<13; h ^= h>>>7; h += h<<3; h ^= h>>>17; h += h<<5;
    return (h>>>0) / 4294967295;
  };
}

export type TF = 'DTD'|'WTD'|'MTD'|'QTD'|'YTD';
export const tfScale = (tf:TF) => ({
  DTD:0.18, WTD:0.45, MTD:1.0, QTD:2.2, YTD:4.1
}[tf]);

export function seasonalityFactor(month0to11:number, seasonality:number[]) {
  return seasonality[month0to11] ?? 1;
}
