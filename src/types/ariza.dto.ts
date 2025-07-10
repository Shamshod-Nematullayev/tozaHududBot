export interface CreateArizaDto {
  licshet: string;
  ikkilamchi_licshet?: string;
  document_type: "dvaynik" | "viza" | "odam_soni" | "death" | "gps";
  akt_summasi?: { total: number };
  current_prescribed_cnt?: number;
  next_prescribed_cnt?: number;
  comment?: string;
  photos?: string[];
  recalculationPeriods?: any[];
  muzlatiladi?: boolean;
}
