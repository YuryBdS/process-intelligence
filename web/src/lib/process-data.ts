export type ExcelCell = string | number | boolean | Date | null;

export type ExcelRow = ExcelCell[];

export type DataRecord = Record<string, ExcelCell>;

export type ProcessWorkbookData = {
  processo: DataRecord[];
  etapas: DataRecord[];
  atividades: DataRecord[];
  conexoes: DataRecord[];
  regras: DataRecord[];
};

export type ProcessSummary = {
  processName: string;
  processArea: string;
  processOwner: string;
  version: string;
  stages: number;
  activities: number;
  connections: number;
  businessRules: number;
  totalExecutionMinutes: number;
  totalWaitingMinutes: number;
  monthlyWorkloadHours: number;
};

function normalizeHeader(value: ExcelCell): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeText(value: ExcelCell): string {
  return String(value ?? "").trim();
}

function toNumber(value: ExcelCell): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const normalized = String(value)
    .trim()
    .replace("%", "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function rowsToRecords(rows: ExcelRow[]): DataRecord[] {
  if (!rows || rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);

  return rows.slice(1).map((row) => {
    const record: DataRecord = {};

    headers.forEach((header, index) => {
      if (!header) {
        return;
      }

      record[header] = row[index] ?? null;
    });

    return record;
  });
}

export function buildProcessWorkbookData(input: {
  PROCESSO: ExcelRow[];
  ETAPAS: ExcelRow[];
  ATIVIDADES: ExcelRow[];
  CONEXOES: ExcelRow[];
  REGRAS: ExcelRow[];
}): ProcessWorkbookData {
  return {
    processo: rowsToRecords(input.PROCESSO),
    etapas: rowsToRecords(input.ETAPAS),
    atividades: rowsToRecords(input.ATIVIDADES),
    conexoes: rowsToRecords(input.CONEXOES),
    regras: rowsToRecords(input.REGRAS),
  };
}

function getField(
  record: DataRecord | undefined,
  possibleNames: string[]
): ExcelCell {
  if (!record) {
    return null;
  }

  for (const name of possibleNames) {
    const normalizedName = normalizeHeader(name);

    if (
      Object.prototype.hasOwnProperty.call(record, normalizedName) &&
      record[normalizedName] !== null &&
      record[normalizedName] !== ""
    ) {
      return record[normalizedName];
    }
  }

  return null;
}

export function calculateProcessSummary(
  data: ProcessWorkbookData
): ProcessSummary {
  const process = data.processo[0];

  let totalExecutionMinutes = 0;
  let totalWaitingMinutes = 0;
  let monthlyWorkloadHours = 0;

  data.atividades.forEach((activity) => {
    const executionTime = toNumber(
      getField(activity, [
        "tempo_execucao_min",
        "tempo de execução min",
        "tempo_execucao",
      ])
    );

    const waitingTime = toNumber(
      getField(activity, [
        "tempo_espera_min",
        "tempo de espera min",
        "tempo_espera",
      ])
    );

    const people = Math.max(
      toNumber(
        getField(activity, [
          "quantidade_pessoas",
          "pessoas",
          "qtd_pessoas",
        ])
      ),
      1
    );

    const monthlyVolume = toNumber(
      getField(activity, [
        "volume_medio_mes",
        "volume médio mês",
        "volume_mes",
      ])
    );

    let occurrenceRate = toNumber(
      getField(activity, [
        "taxa_ocorrencia_pct",
        "taxa de ocorrência pct",
        "taxa_ocorrencia",
      ])
    );

    if (occurrenceRate === 0) {
      occurrenceRate = 100;
    }

    totalExecutionMinutes += executionTime;
    totalWaitingMinutes += waitingTime;

    monthlyWorkloadHours +=
      (executionTime *
        people *
        monthlyVolume *
        (occurrenceRate / 100)) /
      60;
  });

  return {
    processName: normalizeText(
      getField(process, ["nome_processo", "nome do processo"])
    ),

    processArea: normalizeText(
      getField(process, ["area_dona", "área dona", "area"])
    ),

    processOwner: normalizeText(
      getField(process, [
        "dono_processo",
        "dono do processo",
        "process_owner",
      ])
    ),

    version: normalizeText(
      getField(process, ["versao", "versão"])
    ),

    stages: data.etapas.length,
    activities: data.atividades.length,
    connections: data.conexoes.length,
    businessRules: data.regras.length,

    totalExecutionMinutes: Math.round(totalExecutionMinutes * 10) / 10,
    totalWaitingMinutes: Math.round(totalWaitingMinutes * 10) / 10,
    monthlyWorkloadHours: Math.round(monthlyWorkloadHours * 10) / 10,
  };
}