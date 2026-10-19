import {
  calculateAutomationPriorities,
  type AutomationPriority,
  type PriorityLevel,
} from "@/lib/automation-priority";

import {
  buildActivityInsights,
  type ActivityInsight,
  type ProcessWorkbookData,
} from "@/lib/process-data";

export type RecommendationDecision =
  | "prioritizePilot"
  | "evaluatePilot"
  | "keepBacklog";

export type AutomationApproach =
  | "deterministicValidation"
  | "systemIntegration"
  | "workflowAutomation"
  | "assistedAutomation"
  | "processRedesign";

export type ExecutiveRecommendation = {
  rank: number;

  activityId: string;
  activityName: string;

  responsible: string;
  responsibleArea: string;
  mainSystem: string;

  priorityScore: number;
  priorityLevel: PriorityLevel;

  automationScore: number;
  impactScore: number;

  monthlyWorkloadHours: number;
  waitingMinutes: number;

  decision: RecommendationDecision;
  decisionLabel: string;

  approach: AutomationApproach;
  approachLabel: string;

  rationale: string[];

  expectedBenefit: string;

  recommendedNextStep: string;

  safeguards: string[];
};

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueValues(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values.filter(
        (value) =>
          value.trim().length > 0
      )
    )
  );
}

function getDecision(
  priorityScore: number
): RecommendationDecision {
  if (priorityScore >= 75) {
    return "prioritizePilot";
  }

  if (priorityScore >= 55) {
    return "evaluatePilot";
  }

  return "keepBacklog";
}

function getDecisionLabel(
  decision: RecommendationDecision
): string {
  if (
    decision ===
    "prioritizePilot"
  ) {
    return "Priorizar piloto";
  }

  if (
    decision ===
    "evaluatePilot"
  ) {
    return "Avaliar piloto";
  }

  return "Manter no backlog";
}

function getAutomationApproach(
  activity: ActivityInsight
): AutomationApproach {
  const rulesBased =
    normalizeText(
      activity.rulesBased
    );

  const structuredData =
    normalizeText(
      activity.structuredData
    );

  const judgmentLevel =
    normalizeText(
      activity.judgmentLevel
    );

  const repetitive =
    normalizeText(
      activity.repetitive
    );

  const executionType =
    normalizeText(
      activity.executionType
    );

  const activityType =
    normalizeText(
      activity.activityType
    );

  /*
   * Evita automatizar desperdício
   * sem antes avaliar o processo.
   */
  if (
    activity.leanCategory ===
      "waste" ||
    activityType ===
      "retrabalho"
  ) {
    return "processRedesign";
  }

  /*
   * Melhor cenário para regras
   * determinísticas.
   */
  if (
    rulesBased === "sim" &&
    structuredData === "sim" &&
    judgmentLevel === "baixo"
  ) {
    return "deterministicValidation";
  }

  /*
   * Processo já parcialmente
   * automatizado ou distribuído
   * entre sistemas.
   */
  if (
    executionType ===
      "semi-automatica" ||
    activity.mainSystem.includes("/")
  ) {
    return "systemIntegration";
  }

  /*
   * Atividade manual,
   * recorrente e previsível.
   */
  if (
    repetitive === "sim" &&
    executionType === "manual"
  ) {
    return "workflowAutomation";
  }

  /*
   * Casos que ainda exigem
   * interpretação humana.
   */
  return "assistedAutomation";
}

function getApproachLabel(
  approach: AutomationApproach
): string {
  if (
    approach ===
    "deterministicValidation"
  ) {
    return "Validação determinística";
  }

  if (
    approach ===
    "systemIntegration"
  ) {
    return "Integração entre sistemas";
  }

  if (
    approach ===
    "workflowAutomation"
  ) {
    return "Automação de workflow";
  }

  if (
    approach ===
    "processRedesign"
  ) {
    return "Redesenho antes da automação";
  }

  return "Automação assistida";
}

function getExpectedBenefit(
  activity: ActivityInsight
): string {
  const workload =
    activity.monthlyWorkloadHours;

  const waiting =
    activity.waitingMinutes;

  if (
    workload >= 50 &&
    waiting >= 60
  ) {
    return (
      `A atividade combina ${workload} h/mês de carga operacional ` +
      `com ${waiting} minutos de espera por ocorrência. ` +
      "A oportunidade pode atuar tanto sobre esforço manual quanto sobre o fluxo."
    );
  }

  if (workload >= 50) {
    return (
      `A atividade concentra ${workload} h/mês de carga operacional associada. ` +
      "A automação pode reduzir execução manual e aumentar a capacidade disponível, " +
      "dependendo do percentual efetivamente automatizável."
    );
  }

  if (waiting >= 120) {
    return (
      `A atividade adiciona ${waiting} minutos de espera ao fluxo. ` +
      "A principal oportunidade está na redução do tempo de atravessamento, " +
      "e não necessariamente na redução de esforço humano."
    );
  }

  if (workload > 0) {
    return (
      `A atividade possui ${workload} h/mês de carga operacional associada. ` +
      "O ganho potencial deve ser validado por meio de um piloto antes de estimar economia."
    );
  }

  return (
    "O principal benefício esperado está na melhoria do fluxo, da consistência " +
    "ou do controle operacional, e não diretamente na redução de carga humana."
  );
}

function getRecommendedNextStep(
  approach: AutomationApproach
): string {
  if (
    approach ===
    "deterministicValidation"
  ) {
    return (
      "Mapear as regras de decisão, entradas, saídas e exceções da atividade " +
      "e construir um piloto de validação automática antes da execução humana."
    );
  }

  if (
    approach ===
    "systemIntegration"
  ) {
    return (
      "Mapear os sistemas envolvidos, identificar APIs ou mecanismos de integração " +
      "e validar quais transferências de informação podem ocorrer sem intervenção manual."
    );
  }

  if (
    approach ===
    "workflowAutomation"
  ) {
    return (
      "Mapear os gatilhos, decisões e tarefas repetitivas do fluxo e construir " +
      "um piloto de automação com tratamento explícito das exceções."
    );
  }

  if (
    approach ===
    "processRedesign"
  ) {
    return (
      "Revisar a causa do desperdício ou retrabalho antes de automatizar. " +
      "Eliminar ou simplificar a atividade deve ser considerado antes de reproduzi-la em tecnologia."
    );
  }

  return (
    "Separar as decisões determinísticas das decisões que exigem julgamento humano " +
    "e avaliar uma solução de apoio ao analista com supervisão humana."
  );
}

function getSafeguards(
  activity: ActivityInsight
): string[] {
  const safeguards: string[] = [];

  const criticality =
    normalizeText(
      activity.criticality
    );

  const judgmentLevel =
    normalizeText(
      activity.judgmentLevel
    );

  if (
    criticality === "critica" ||
    criticality === "alta"
  ) {
    safeguards.push(
      "Validar as regras com o responsável pelo processo e manter rastreabilidade das decisões."
    );
  }

  if (
    judgmentLevel === "alto" ||
    judgmentLevel === "medio"
  ) {
    safeguards.push(
      "Manter revisão humana para decisões que dependem de julgamento ou contexto."
    );
  }

  if (
    activity.mainException
  ) {
    safeguards.push(
      `Testar explicitamente o cenário de exceção: ${activity.mainException}.`
    );
  }

  if (
    activity.existingControl
  ) {
    safeguards.push(
      `Preservar ou substituir de forma controlada o mecanismo atual: ${activity.existingControl}.`
    );
  }

  safeguards.push(
    "Medir o desempenho antes e depois do piloto para validar o benefício real."
  );

  return uniqueValues(
    safeguards
  );
}

function buildRationale(
  priority: AutomationPriority,
  activity: ActivityInsight
): string[] {
  const rationale = [
    ...priority.priorityReasons,
  ];

  if (
    priority.priorityLevel ===
    "high"
  ) {
    rationale.push(
      "Combinação relevante de viabilidade técnica e impacto operacional"
    );
  }

  if (
    activity.monthlyWorkloadHours >=
    40
  ) {
    rationale.push(
      "Carga operacional significativa para avaliação de benefício"
    );
  }

  return uniqueValues(
    rationale
  ).slice(0, 7);
}

export function buildExecutiveRecommendations(
  data: ProcessWorkbookData,
  limit = 3
): ExecutiveRecommendation[] {
  const priorities =
    calculateAutomationPriorities(
      data
    );

  const activities =
    buildActivityInsights(
      data
    );

  const activityMap =
    new Map<string, ActivityInsight>();

  activities.forEach(
    (activity) => {
      activityMap.set(
        activity.activityId,
        activity
      );
    }
  );

  const recommendations:
    ExecutiveRecommendation[] = [];

  priorities
    .slice(0, limit)
    .forEach(
      (priority, index) => {
        const activity =
          activityMap.get(
            priority.activityId
          );

        if (!activity) {
          return;
        }

        const decision =
          getDecision(
            priority.priorityScore
          );

        const approach =
          getAutomationApproach(
            activity
          );

        recommendations.push({
          rank: index + 1,

          activityId:
            priority.activityId,

          activityName:
            priority.activityName,

          responsible:
            priority.responsible,

          responsibleArea:
            priority.responsibleArea,

          mainSystem:
            priority.mainSystem,

          priorityScore:
            priority.priorityScore,

          priorityLevel:
            priority.priorityLevel,

          automationScore:
            priority.automationScore,

          impactScore:
            priority.impactScore,

          monthlyWorkloadHours:
            priority.monthlyWorkloadHours,

          waitingMinutes:
            priority.waitingMinutes,

          decision,

          decisionLabel:
            getDecisionLabel(
              decision
            ),

          approach,

          approachLabel:
            getApproachLabel(
              approach
            ),

          rationale:
            buildRationale(
              priority,
              activity
            ),

          expectedBenefit:
            getExpectedBenefit(
              activity
            ),

          recommendedNextStep:
            getRecommendedNextStep(
              approach
            ),

          safeguards:
            getSafeguards(
              activity
            ),
        });
      }
    );

  return recommendations;
}