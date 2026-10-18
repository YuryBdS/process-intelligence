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

export type LeanCategory =
  | "valueAdded"
  | "necessary"
  | "waste"
  | "unclassified";

export type ActivityInsight = {
  activityId: string;
  activityName: string;
  responsible: string;
  leanCategory: LeanCategory;

  executionMinutes: number;
  waitingMinutes: number;

  people: number;
  monthlyVolume: number;
  occurrenceRate: number;

  monthlyWorkloadHours: number;
};

export type LeanBreakdown = {
  valueAddedHours: number;
  necessaryHours: number;
  wasteHours: number;
  unclassifiedHours: number;

  totalHours: number;

  valueAddedPct: number;
  necessaryPct: number;
  wastePct: number;
  unclassifiedPct: number;
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

  lean: LeanBreakdown;

  topActivities: ActivityInsight[];
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

function normalizeCategory(value: ExcelCell): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function rowsToRecords(
  rows: ExcelRow[]
): DataRecord[] {
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
      Object.prototype.hasOwnProperty.call(
        record,
        normalizedName
      ) &&
      record[normalizedName] !== null &&
      record[normalizedName] !== ""
    ) {
      return record[normalizedName];
    }
  }

  return null;
}

function getOccurrenceRate(
  activity: DataRecord
): number {
  const value = getField(activity, [
    "taxa_ocorrencia_pct",
    "taxa de ocorrência pct",
    "taxa_ocorrencia",
  ]);

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 100;
  }

  return Math.min(
    Math.max(toNumber(value), 0),
    100
  );
}

function getLeanCategory(
  activity: DataRecord
): LeanCategory {
  const rawValue = getField(activity, [
    "classificacao_lean",
    "classificação lean",
    "lean",
  ]);

  const value = normalizeCategory(rawValue);

  if (
    value === "agrega valor" ||
    value === "valor agregado" ||
    value === "value added"
  ) {
    return "valueAdded";
  }

  if (
    value === "necessario" ||
    value === "necessary"
  ) {
    return "necessary";
  }

  if (
    value === "desperdicio" ||
    value === "waste"
  ) {
    return "waste";
  }

  return "unclassified";
}

export function buildActivityInsights(
  data: ProcessWorkbookData
): ActivityInsight[] {
  return data.atividades.map((activity) => {
    const executionMinutes = toNumber(
      getField(activity, [
        "tempo_execucao_min",
        "tempo de execução min",
        "tempo_execucao",
      ])
    );

    const waitingMinutes = toNumber(
      getField(activity, [
        "tempo_espera_min",
        "tempo de espera min",
        "tempo_espera",
      ])
    );

    const peopleValue = getField(activity, [
      "pessoas",
      "quantidade_pessoas",
      "qtd_pessoas",
    ]);

    const people =
      peopleValue === null
        ? 1
        : Math.max(toNumber(peopleValue), 1);

    const monthlyVolume = toNumber(
      getField(activity, [
        "volume_medio_mes",
        "volume médio mês",
        "volume_mes",
      ])
    );

    const occurrenceRate =
      getOccurrenceRate(activity);

    const monthlyWorkloadHours =
      (executionMinutes *
        people *
        monthlyVolume *
        (occurrenceRate / 100)) /
      60;

    return {
      activityId: normalizeText(
        getField(activity, [
          "atividade_id",
          "id_atividade",
        ])
      ),

      activityName: normalizeText(
        getField(activity, [
          "atividade",
          "nome_atividade",
          "nome da atividade",
        ])
      ),

      responsible: normalizeText(
        getField(activity, [
          "papel_responsavel",
          "papel responsável",
          "responsavel",
          "responsável",
          "papel",
        ])
      ),

      leanCategory:
        getLeanCategory(activity),

      executionMinutes,
      waitingMinutes,
      people,
      monthlyVolume,
      occurrenceRate,

      monthlyWorkloadHours:
        round(monthlyWorkloadHours),
    };
  });
}

function calculateLeanBreakdown(
  activities: ActivityInsight[]
): LeanBreakdown {
  let valueAddedHours = 0;
  let necessaryHours = 0;
  let wasteHours = 0;
  let unclassifiedHours = 0;

  activities.forEach((activity) => {
    if (
      activity.leanCategory === "valueAdded"
    ) {
      valueAddedHours +=
        activity.monthlyWorkloadHours;
    }

    if (
      activity.leanCategory === "necessary"
    ) {
      necessaryHours +=
        activity.monthlyWorkloadHours;
    }

    if (
      activity.leanCategory === "waste"
    ) {
      wasteHours +=
        activity.monthlyWorkloadHours;
    }

    if (
      activity.leanCategory === "unclassified"
    ) {
      unclassifiedHours +=
        activity.monthlyWorkloadHours;
    }
  });

  const totalHours =
    valueAddedHours +
    necessaryHours +
    wasteHours +
    unclassifiedHours;

  function percentage(
    value: number
  ): number {
    if (totalHours === 0) {
      return 0;
    }

    return round(
      (value / totalHours) * 100
    );
  }

  return {
    valueAddedHours:
      round(valueAddedHours),

    necessaryHours:
      round(necessaryHours),

    wasteHours:
      round(wasteHours),

    unclassifiedHours:
      round(unclassifiedHours),

    totalHours:
      round(totalHours),

    valueAddedPct:
      percentage(valueAddedHours),

    necessaryPct:
      percentage(necessaryHours),

    wastePct:
      percentage(wasteHours),

    unclassifiedPct:
      percentage(unclassifiedHours),
  };
}

export function calculateProcessSummary(
  data: ProcessWorkbookData
): ProcessSummary {
  const process = data.processo[0];

  const activityInsights =
    buildActivityInsights(data);

  const totalExecutionMinutes =
    activityInsights.reduce(
      (total, activity) =>
        total + activity.executionMinutes,
      0
    );

  const totalWaitingMinutes =
    activityInsights.reduce(
      (total, activity) =>
        total + activity.waitingMinutes,
      0
    );

  const monthlyWorkloadHours =
    activityInsights.reduce(
      (total, activity) =>
        total +
        activity.monthlyWorkloadHours,
      0
    );

  const lean =
    calculateLeanBreakdown(
      activityInsights
    );

  const topActivities = [
    ...activityInsights,
  ]
    .sort(
      (a, b) =>
        b.monthlyWorkloadHours -
        a.monthlyWorkloadHours
    )
    .slice(0, 5);

  return {
    processName: normalizeText(
      getField(process, [
        "nome_processo",
        "nome do processo",
      ])
    ),

    processArea: normalizeText(
      getField(process, [
        "area_dona",
        "área dona",
        "area",
      ])
    ),

    processOwner: normalizeText(
      getField(process, [
        "dono_processo",
        "dono do processo",
        "process_owner",
      ])
    ),

    version: normalizeText(
      getField(process, [
        "versao",
        "versão",
      ])
    ),

    stages: data.etapas.length,
    activities: data.atividades.length,
    connections: data.conexoes.length,
    businessRules: data.regras.length,

    totalExecutionMinutes:
      round(totalExecutionMinutes),

    totalWaitingMinutes:
      round(totalWaitingMinutes),

    monthlyWorkloadHours:
      round(monthlyWorkloadHours),

    lean,

    topActivities,
  };
}