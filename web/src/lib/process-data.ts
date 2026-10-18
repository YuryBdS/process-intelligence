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

export type AttentionLevel =
  | "low"
  | "medium"
  | "high";

export type AutomationLevel =
  | "low"
  | "medium"
  | "high";

export type ActivityInsight = {
  activityId: string;
  stageId: string;

  activityName: string;
  description: string;

  responsible: string;
  responsibleArea: string;
  mainSystem: string;

  executionType: string;
  activityType: string;

  executionMinutes: number;
  waitingMinutes: number;
  totalMinutes: number;

  people: number;
  monthlyVolume: number;
  occurrenceRate: number;

  monthlyWorkloadHours: number;

  leanCategory: LeanCategory;

  criticality: string;

  activitySla: string;
  slaMinutes: number | null;

  input: string;
  output: string;

  mainException: string;
  existingControl: string;

  repetitive: string;
  rulesBased: string;
  structuredData: string;
  judgmentLevel: string;

  observation: string;

  bottleneckScore: number;
  bottleneckLevel: AttentionLevel;
  bottleneckSignals: string[];

  automationScore: number;
  automationLevel: AutomationLevel;
  automationSignals: string[];
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

  bottleneckCandidates: ActivityInsight[];

  automationCandidates: ActivityInsight[];
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
    return Number.isFinite(value)
      ? value
      : 0;
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const normalized = String(value)
    .trim()
    .replace("%", "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function percentile(
  values: number[],
  percentileValue: number
): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const index = Math.max(
    0,
    Math.ceil(
      percentileValue * sorted.length
    ) - 1
  );

  return sorted[index];
}

export function rowsToRecords(
  rows: ExcelRow[]
): DataRecord[] {
  if (!rows || rows.length < 2) {
    return [];
  }

  const headers =
    rows[0].map(normalizeHeader);

  return rows.slice(1).map((row) => {
    const record: DataRecord = {};

    headers.forEach(
      (header, index) => {
        if (!header) {
          return;
        }

        record[header] =
          row[index] ?? null;
      }
    );

    return record;
  });
}

export function buildProcessWorkbookData(
  input: {
    PROCESSO: ExcelRow[];
    ETAPAS: ExcelRow[];
    ATIVIDADES: ExcelRow[];
    CONEXOES: ExcelRow[];
    REGRAS: ExcelRow[];
  }
): ProcessWorkbookData {
  return {
    processo:
      rowsToRecords(input.PROCESSO),

    etapas:
      rowsToRecords(input.ETAPAS),

    atividades:
      rowsToRecords(input.ATIVIDADES),

    conexoes:
      rowsToRecords(input.CONEXOES),

    regras:
      rowsToRecords(input.REGRAS),
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
    const normalizedName =
      normalizeHeader(name);

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

  if (
    typeof value === "number" &&
    value > 0 &&
    value <= 1
  ) {
    return value * 100;
  }

  return Math.min(
    Math.max(toNumber(value), 0),
    100
  );
}

function getLeanCategory(
  activity: DataRecord
): LeanCategory {
  const rawValue = getField(
    activity,
    [
      "classificacao_lean",
      "classificação lean",
      "lean",
    ]
  );

  const value =
    normalizeCategory(rawValue);

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

function parseDurationMinutes(
  value: ExcelCell
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const text =
    normalizeCategory(value);

  const match = text.match(
    /(\d+(?:[.,]\d+)?)/
  );

  if (!match) {
    return null;
  }

  const amount = Number(
    match[1].replace(",", ".")
  );

  if (!Number.isFinite(amount)) {
    return null;
  }

  if (
    text.includes("min")
  ) {
    return amount;
  }

  if (
    text.includes("hora") ||
    text.match(/\bh\b/)
  ) {
    return amount * 60;
  }

  return null;
}

function getCriticalityScore(
  value: string
): number {
  const normalized =
    normalizeCategory(value);

  if (normalized === "critica") {
    return 2;
  }

  if (normalized === "alta") {
    return 1;
  }

  return 0;
}

function getQualitativeScore(
  value: string,
  yesScore: number,
  partialScore: number
): number {
  const normalized =
    normalizeCategory(value);

  if (normalized === "sim") {
    return yesScore;
  }

  if (normalized === "parcial") {
    return partialScore;
  }

  return 0;
}

function buildBaseActivityInsights(
  data: ProcessWorkbookData
): ActivityInsight[] {
  return data.atividades.map(
    (activity) => {
      const executionMinutes =
        toNumber(
          getField(activity, [
            "tempo_execucao_min",
          ])
        );

      const waitingMinutes =
        toNumber(
          getField(activity, [
            "tempo_espera_min",
          ])
        );

      const peopleValue =
        getField(activity, [
          "pessoas",
        ]);

      const people =
        peopleValue === null
          ? 1
          : Math.max(
              toNumber(peopleValue),
              1
            );

      const monthlyVolume =
        toNumber(
          getField(activity, [
            "volume_medio_mes",
          ])
        );

      const occurrenceRate =
        getOccurrenceRate(activity);

      const calculatedTotalMinutes =
        executionMinutes +
        waitingMinutes;

      const totalMinutesField =
        getField(activity, [
          "tempo_total_min",
        ]);

      const totalMinutes =
        totalMinutesField === null
          ? calculatedTotalMinutes
          : toNumber(
              totalMinutesField
            );

      const workload =
        (
          executionMinutes *
          people *
          monthlyVolume *
          (occurrenceRate / 100)
        ) / 60;

      const activitySla =
        normalizeText(
          getField(activity, [
            "sla_atividade",
          ])
        );

      const slaMinutes =
        parseDurationMinutes(
          activitySla
        );

      return {
        activityId:
          normalizeText(
            getField(activity, [
              "atividade_id",
            ])
          ),

        stageId:
          normalizeText(
            getField(activity, [
              "etapa_id",
            ])
          ),

        activityName:
          normalizeText(
            getField(activity, [
              "atividade",
            ])
          ),

        description:
          normalizeText(
            getField(activity, [
              "descricao",
            ])
          ),

        responsible:
          normalizeText(
            getField(activity, [
              "papel_responsavel",
            ])
          ),

        responsibleArea:
          normalizeText(
            getField(activity, [
              "area_responsavel",
            ])
          ),

        mainSystem:
          normalizeText(
            getField(activity, [
              "sistema_principal",
            ])
          ),

        executionType:
          normalizeText(
            getField(activity, [
              "tipo_execucao",
            ])
          ),

        activityType:
          normalizeText(
            getField(activity, [
              "tipo_atividade",
            ])
          ),

        executionMinutes,

        waitingMinutes,

        totalMinutes,

        people,

        monthlyVolume,

        occurrenceRate,

        monthlyWorkloadHours:
          round(workload),

        leanCategory:
          getLeanCategory(activity),

        criticality:
          normalizeText(
            getField(activity, [
              "criticidade",
            ])
          ),

        activitySla,

        slaMinutes,

        input:
          normalizeText(
            getField(activity, [
              "entrada",
            ])
          ),

        output:
          normalizeText(
            getField(activity, [
              "saida",
            ])
          ),

        mainException:
          normalizeText(
            getField(activity, [
              "excecao_principal",
            ])
          ),

        existingControl:
          normalizeText(
            getField(activity, [
              "controle_existente",
            ])
          ),

        repetitive:
          normalizeText(
            getField(activity, [
              "repetitiva",
            ])
          ),

        rulesBased:
          normalizeText(
            getField(activity, [
              "baseada_regras",
            ])
          ),

        structuredData:
          normalizeText(
            getField(activity, [
              "dados_estruturados",
            ])
          ),

        judgmentLevel:
          normalizeText(
            getField(activity, [
              "nivel_julgamento",
            ])
          ),

        observation:
          normalizeText(
            getField(activity, [
              "observacao",
            ])
          ),

        bottleneckScore: 0,

        bottleneckLevel: "low",

        bottleneckSignals: [],

        automationScore: 0,

        automationLevel: "low",

        automationSignals: [],
      };
    }
  );
}

function addBottleneckAnalysis(
  activities: ActivityInsight[]
): ActivityInsight[] {
  const workloads =
    activities
      .map(
        (activity) =>
          activity.monthlyWorkloadHours
      )
      .filter(
        (value) => value > 0
      );

  const waitingTimes =
    activities
      .map(
        (activity) =>
          activity.waitingMinutes
      )
      .filter(
        (value) => value > 0
      );

  const workloadP50 =
    percentile(
      workloads,
      0.5
    );

  const workloadP75 =
    percentile(
      workloads,
      0.75
    );

  const waitingP75 =
    percentile(
      waitingTimes,
      0.75
    );

  return activities.map(
    (activity) => {
      let score = 0;

      const signals: string[] = [];

      if (
        activity.monthlyWorkloadHours >
          0 &&
        activity.monthlyWorkloadHours >=
          workloadP75
      ) {
        score += 3;

        signals.push(
          "Carga mensal entre as maiores do processo"
        );
      }

      if (
        activity.waitingMinutes > 0 &&
        activity.waitingMinutes >=
          waitingP75
      ) {
        score += 3;

        signals.push(
          "Tempo de espera elevado"
        );
      }

      const criticalityScore =
        getCriticalityScore(
          activity.criticality
        );

      if (
        criticalityScore === 2
      ) {
        score += 2;

        signals.push(
          "Criticidade crítica"
        );
      }

      if (
        criticalityScore === 1
      ) {
        score += 1;

        signals.push(
          "Criticidade alta"
        );
      }

      if (
        activity.slaMinutes !== null &&
        activity.slaMinutes > 0
      ) {
        const slaRatio =
          activity.totalMinutes /
          activity.slaMinutes;

        if (slaRatio >= 1) {
          score += 2;

          signals.push(
            "Tempo total no limite ou acima do SLA"
          );
        } else if (
          slaRatio >= 0.8
        ) {
          score += 1;

          signals.push(
            "Tempo total próximo do SLA"
          );
        }
      }

      if (
        normalizeCategory(
          activity.activityType
        ) === "retrabalho"
      ) {
        score += 1;

        signals.push(
          "Atividade de retrabalho"
        );
      }

      if (
        activity.leanCategory ===
        "waste"
      ) {
        score += 1;

        signals.push(
          "Classificada como desperdício"
        );
      }

      if (
        normalizeCategory(
          activity.executionType
        ) === "manual" &&
        activity.monthlyWorkloadHours >=
          workloadP50 &&
        activity.monthlyWorkloadHours > 0
      ) {
        score += 1;

        signals.push(
          "Execução manual com carga relevante"
        );
      }

      let level: AttentionLevel =
        "low";

      if (score >= 5) {
        level = "high";
      } else if (
        score >= 3
      ) {
        level = "medium";
      }

      return {
        ...activity,

        bottleneckScore:
          score,

        bottleneckLevel:
          level,

        bottleneckSignals:
          signals,
      };
    }
  );
}

function addAutomationAnalysis(
  activities: ActivityInsight[]
): ActivityInsight[] {
  return activities.map(
    (activity) => {
      let score = 0;

      const signals: string[] = [];

      const repetitiveScore =
        getQualitativeScore(
          activity.repetitive,
          2,
          1
        );

      if (repetitiveScore > 0) {
        score += repetitiveScore;

        signals.push(
          activity.repetitive ===
            "Parcial"
            ? "Parcialmente repetitiva"
            : "Atividade repetitiva"
        );
      }

      const rulesScore =
        getQualitativeScore(
          activity.rulesBased,
          2,
          1
        );

      if (rulesScore > 0) {
        score += rulesScore;

        signals.push(
          activity.rulesBased ===
            "Parcial"
            ? "Parcialmente baseada em regras"
            : "Baseada em regras"
        );
      }

      const structuredScore =
        getQualitativeScore(
          activity.structuredData,
          2,
          1
        );

      if (
        structuredScore > 0
      ) {
        score += structuredScore;

        signals.push(
          activity.structuredData ===
            "Parcial"
            ? "Dados parcialmente estruturados"
            : "Dados estruturados"
        );
      }

      const judgment =
        normalizeCategory(
          activity.judgmentLevel
        );

      if (
        judgment === "baixo"
      ) {
        score += 2;

        signals.push(
          "Baixo nível de julgamento humano"
        );
      } else if (
        judgment === "medio"
      ) {
        score += 1;

        signals.push(
          "Julgamento humano moderado"
        );
      }

      if (
        normalizeCategory(
          activity.executionType
        ) === "manual"
      ) {
        score += 1;

        signals.push(
          "Execução manual"
        );
      }

      let level: AutomationLevel =
        "low";

      if (score >= 7) {
        level = "high";
      } else if (
        score >= 4
      ) {
        level = "medium";
      }

      return {
        ...activity,

        automationScore:
          score,

        automationLevel:
          level,

        automationSignals:
          signals,
      };
    }
  );
}

export function buildActivityInsights(
  data: ProcessWorkbookData
): ActivityInsight[] {
  const base =
    buildBaseActivityInsights(
      data
    );

  const withBottleneck =
    addBottleneckAnalysis(
      base
    );

  return addAutomationAnalysis(
    withBottleneck
  );
}

function calculateLeanBreakdown(
  activities: ActivityInsight[]
): LeanBreakdown {
  let valueAddedHours = 0;
  let necessaryHours = 0;
  let wasteHours = 0;
  let unclassifiedHours = 0;

  activities.forEach(
    (activity) => {
      if (
        activity.leanCategory ===
        "valueAdded"
      ) {
        valueAddedHours +=
          activity.monthlyWorkloadHours;
      }

      if (
        activity.leanCategory ===
        "necessary"
      ) {
        necessaryHours +=
          activity.monthlyWorkloadHours;
      }

      if (
        activity.leanCategory ===
        "waste"
      ) {
        wasteHours +=
          activity.monthlyWorkloadHours;
      }

      if (
        activity.leanCategory ===
        "unclassified"
      ) {
        unclassifiedHours +=
          activity.monthlyWorkloadHours;
      }
    }
  );

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
      percentage(
        valueAddedHours
      ),

    necessaryPct:
      percentage(
        necessaryHours
      ),

    wastePct:
      percentage(
        wasteHours
      ),

    unclassifiedPct:
      percentage(
        unclassifiedHours
      ),
  };
}

export function calculateProcessSummary(
  data: ProcessWorkbookData
): ProcessSummary {
  const process =
    data.processo[0];

  const activityInsights =
    buildActivityInsights(data);

  const totalExecutionMinutes =
    activityInsights.reduce(
      (total, activity) =>
        total +
        activity.executionMinutes,
      0
    );

  const totalWaitingMinutes =
    activityInsights.reduce(
      (total, activity) =>
        total +
        activity.waitingMinutes,
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

  const bottleneckCandidates = [
    ...activityInsights,
  ]
    .filter(
      (activity) =>
        activity.bottleneckScore > 0
    )
    .sort((a, b) => {
      if (
        b.bottleneckScore !==
        a.bottleneckScore
      ) {
        return (
          b.bottleneckScore -
          a.bottleneckScore
        );
      }

      return (
        b.monthlyWorkloadHours -
        a.monthlyWorkloadHours
      );
    })
    .slice(0, 5);

  const automationCandidates = [
    ...activityInsights,
  ]
    .filter(
      (activity) =>
        activity.automationScore > 0
    )
    .sort((a, b) => {
      if (
        b.automationScore !==
        a.automationScore
      ) {
        return (
          b.automationScore -
          a.automationScore
        );
      }

      return (
        b.monthlyWorkloadHours -
        a.monthlyWorkloadHours
      );
    })
    .slice(0, 5);

  return {
    processName:
      normalizeText(
        getField(process, [
          "nome_processo",
        ])
      ),

    processArea:
      normalizeText(
        getField(process, [
          "area_dona",
        ])
      ),

    processOwner:
      normalizeText(
        getField(process, [
          "dono_processo",
        ])
      ),

    version:
      normalizeText(
        getField(process, [
          "versao",
        ])
      ),

    stages:
      data.etapas.length,

    activities:
      data.atividades.length,

    connections:
      data.conexoes.length,

    businessRules:
      data.regras.length,

    totalExecutionMinutes:
      round(
        totalExecutionMinutes
      ),

    totalWaitingMinutes:
      round(
        totalWaitingMinutes
      ),

    monthlyWorkloadHours:
      round(
        monthlyWorkloadHours
      ),

    lean,

    topActivities,

    bottleneckCandidates,

    automationCandidates,
  };
}