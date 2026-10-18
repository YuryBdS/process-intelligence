import {
  buildActivityInsights,
  type ActivityInsight,
  type ProcessWorkbookData,
} from "@/lib/process-data";

export type PriorityLevel =
  | "high"
  | "medium"
  | "low";

export type AutomationPriority = {
  activityId: string;
  activityName: string;
  responsible: string;
  responsibleArea: string;
  mainSystem: string;

  automationScore: number;
  automationLevel: string;

  impactScore: number;
  priorityScore: number;
  priorityLevel: PriorityLevel;

  monthlyWorkloadHours: number;
  waitingMinutes: number;

  priorityReasons: string[];
};

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function calculateImpactScore(
  activity: ActivityInsight,
  workloadMedian: number,
  workloadP75: number
): {
  score: number;
  reasons: string[];
} {
  let score = 0;

  const reasons: string[] = [];

  /*
   * Carga operacional
   * Máximo: 4 pontos
   */
  if (
    activity.monthlyWorkloadHours > 0 &&
    activity.monthlyWorkloadHours >= workloadP75
  ) {
    score += 4;

    reasons.push(
      "Carga mensal entre as maiores do processo"
    );
  } else if (
    activity.monthlyWorkloadHours > 0 &&
    activity.monthlyWorkloadHours >= workloadMedian
  ) {
    score += 2;

    reasons.push(
      "Carga mensal relevante"
    );
  } else if (
    activity.monthlyWorkloadHours > 0
  ) {
    score += 1;

    reasons.push(
      "Possui esforço operacional recorrente"
    );
  }

  /*
   * Criticidade
   * Máximo: 2 pontos
   */
  const criticality =
    normalizeText(activity.criticality);

  if (criticality === "critica") {
    score += 2;

    reasons.push(
      "Atividade de criticidade crítica"
    );
  } else if (criticality === "alta") {
    score += 1;

    reasons.push(
      "Atividade de alta criticidade"
    );
  }

  /*
   * Espera / impacto no fluxo
   * Máximo: 2 pontos
   */
  if (activity.waitingMinutes >= 120) {
    score += 2;

    reasons.push(
      "Tempo de espera elevado"
    );
  } else if (activity.waitingMinutes > 0) {
    score += 1;

    reasons.push(
      "Possui tempo de espera no fluxo"
    );
  }

  /*
   * Desperdício ou retrabalho
   * Máximo: 2 pontos
   */
  const activityType =
    normalizeText(activity.activityType);

  if (activity.leanCategory === "waste") {
    score += 1;

    reasons.push(
      "Classificada como desperdício"
    );
  }

  if (activityType === "retrabalho") {
    score += 1;

    reasons.push(
      "Atividade de retrabalho"
    );
  }

  return {
    score: Math.min(score, 10),
    reasons,
  };
}

function calculatePriorityScore(
  automationScore: number,
  impactScore: number
): number {
  /*
   * Viabilidade de automação: 50%
   * Impacto operacional: 50%
   */

  const automationNormalized =
    Math.min(automationScore / 9, 1);

  const impactNormalized =
    Math.min(impactScore / 10, 1);

  return round(
    (
      automationNormalized * 50 +
      impactNormalized * 50
    )
  );
}

function getPriorityLevel(
  priorityScore: number
): PriorityLevel {
  if (priorityScore >= 75) {
    return "high";
  }

  if (priorityScore >= 55) {
    return "medium";
  }

  return "low";
}

export function calculateAutomationPriorities(
  data: ProcessWorkbookData
): AutomationPriority[] {
  const activities =
    buildActivityInsights(data);

  const workloads = activities
    .map(
      (activity) =>
        activity.monthlyWorkloadHours
    )
    .filter(
      (value) => value > 0
    );

  const workloadMedian =
    percentile(workloads, 0.5);

  const workloadP75 =
    percentile(workloads, 0.75);

  const priorities =
    activities.map((activity) => {
      const impact =
        calculateImpactScore(
          activity,
          workloadMedian,
          workloadP75
        );

      const priorityScore =
        calculatePriorityScore(
          activity.automationScore,
          impact.score
        );

      const reasons = [
        ...activity.automationSignals,
        ...impact.reasons,
      ];

      return {
        activityId:
          activity.activityId,

        activityName:
          activity.activityName,

        responsible:
          activity.responsible,

        responsibleArea:
          activity.responsibleArea,

        mainSystem:
          activity.mainSystem,

        automationScore:
          activity.automationScore,

        automationLevel:
          activity.automationLevel,

        impactScore:
          impact.score,

        priorityScore,

        priorityLevel:
          getPriorityLevel(
            priorityScore
          ),

        monthlyWorkloadHours:
          activity.monthlyWorkloadHours,

        waitingMinutes:
          activity.waitingMinutes,

        priorityReasons:
          reasons,
      };
    });

  return priorities
    .filter(
      (activity) =>
        activity.automationScore >= 4
    )
    .sort((a, b) => {
      if (
        b.priorityScore !==
        a.priorityScore
      ) {
        return (
          b.priorityScore -
          a.priorityScore
        );
      }

      return (
        b.monthlyWorkloadHours -
        a.monthlyWorkloadHours
      );
    })
    .slice(0, 5);
}