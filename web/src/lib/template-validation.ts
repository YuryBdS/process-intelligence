import type {
  DataRecord,
  ProcessWorkbookData,
} from "@/lib/process-data";

export type ValidationSeverity =
  | "error"
  | "warning"
  | "info";

export type ValidationCategory =
  | "requiredField"
  | "duplicateId"
  | "reference"
  | "flow"
  | "probability"
  | "bpmn"
  | "structure";

export type TemplateValidationIssue = {
  id: string;

  severity: ValidationSeverity;
  category: ValidationCategory;

  sheet: string;

  recordId: string;

  field?: string;

  message: string;
};

export type TemplateValidationResult = {
  valid: boolean;

  errors: number;
  warnings: number;
  infos: number;

  issues: TemplateValidationIssue[];
};

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

function readField(
  record: DataRecord,
  names: string[]
): string {
  const source =
    record as unknown as Record<
      string,
      unknown
    >;

  for (const name of names) {
    const value = source[name];

    if (
      value !== undefined &&
      value !== null
    ) {
      return String(value).trim();
    }
  }

  return "";
}

function toNumber(
  value: string
): number | null {
  if (!value.trim()) {
    return null;
  }

  const normalized = value
    .replace("%", "")
    .replace(/\s/g, "")
    .replace(",", ".");

  const parsed =
    Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function getCollection(
  data: ProcessWorkbookData,
  names: string[]
): DataRecord[] {
  const source =
    data as unknown as Record<
      string,
      unknown
    >;

  for (const name of names) {
    const value =
      source[name];

    if (Array.isArray(value)) {
      return value as DataRecord[];
    }
  }

  return [];
}

function createIssue(
  index: number,
  issue: Omit<
    TemplateValidationIssue,
    "id"
  >
): TemplateValidationIssue {
  return {
    id: `VAL-${String(
      index
    ).padStart(4, "0")}`,

    ...issue,
  };
}

function findDuplicateIds(
  records: DataRecord[],
  fieldNames: string[],
  sheet: string
): Omit<
  TemplateValidationIssue,
  "id"
>[] {
  const issues: Omit<
    TemplateValidationIssue,
    "id"
  >[] = [];

  const occurrences =
    new Map<string, number>();

  records.forEach(
    (record) => {
      const id =
        readField(
          record,
          fieldNames
        );

      if (!id) {
        return;
      }

      occurrences.set(
        id,
        (
          occurrences.get(id) ??
          0
        ) + 1
      );
    }
  );

  occurrences.forEach(
    (count, id) => {
      if (count <= 1) {
        return;
      }

      issues.push({
        severity: "error",
        category: "duplicateId",
        sheet,
        recordId: id,
        field:
          fieldNames[0],

        message:
          `O identificador ${id} aparece ${count} vezes na aba ${sheet}.`,
      });
    }
  );

  return issues;
}

function validateRequiredField(
  records: DataRecord[],
  sheet: string,
  idFields: string[],
  requiredFields: {
    fields: string[];
    label: string;
  }[]
): Omit<
  TemplateValidationIssue,
  "id"
>[] {
  const issues: Omit<
    TemplateValidationIssue,
    "id"
  >[] = [];

  records.forEach(
    (record, index) => {
      const recordId =
        readField(
          record,
          idFields
        ) ||
        `linha ${index + 2}`;

      requiredFields.forEach(
        ({
          fields,
          label,
        }) => {
          const value =
            readField(
              record,
              fields
            );

          if (value) {
            return;
          }

          issues.push({
            severity: "error",
            category:
              "requiredField",
            sheet,
            recordId,
            field:
              fields[0],

            message:
              `Campo obrigatório "${label}" não informado em ${recordId}.`,
          });
        }
      );
    }
  );

  return issues;
}

function validateStages(
  stages: DataRecord[]
): Omit<
  TemplateValidationIssue,
  "id"
>[] {
  const issues: Omit<
    TemplateValidationIssue,
    "id"
  >[] = [];

  issues.push(
    ...findDuplicateIds(
      stages,
      ["etapa_id"],
      "ETAPAS"
    )
  );

  issues.push(
    ...validateRequiredField(
      stages,
      "ETAPAS",
      ["etapa_id"],
      [
        {
          fields: [
            "etapa_id",
          ],
          label:
            "etapa_id",
        },
        {
          fields: [
            "processo_id",
          ],
          label:
            "processo_id",
        },
        {
          fields: [
            "nome_etapa",
          ],
          label:
            "nome_etapa",
        },
        {
          fields: [
            "tipo_bpmn",
          ],
          label:
            "tipo_bpmn",
        },
      ]
    )
  );

  const allowedBpmnTypes =
    new Set([
      "inicio",
      "fim",
      "tarefa",
      "atividade",
      "etapa",
      "decisao",
      "gateway",
      "gateway exclusivo",
      "gateway inclusivo",
      "gateway paralelo",
      "evento",
      "subprocesso",
      "subprocess",
    ]);

  stages.forEach(
    (stage) => {
      const stageId =
        readField(
          stage,
          ["etapa_id"]
        );

      const rawType =
        readField(
          stage,
          ["tipo_bpmn"]
        );

      if (
        !stageId ||
        !rawType
      ) {
        return;
      }

      const type =
        normalizeText(
          rawType
        );

      const isKnownType =
        allowedBpmnTypes.has(
          type
        ) ||
        type.includes(
          "gateway"
        ) ||
        type.includes(
          "decis"
        ) ||
        type.includes(
          "evento"
        );

      if (!isKnownType) {
        issues.push({
          severity:
            "warning",

          category: "bpmn",

          sheet: "ETAPAS",

          recordId:
            stageId,

          field:
            "tipo_bpmn",

          message:
            `Tipo BPMN "${rawType}" não é reconhecido em ${stageId}. A etapa será tratada como etapa comum.`,
        });
      }
    }
  );

  return issues;
}

function validateActivities(
  activities: DataRecord[],
  stageIds: Set<string>
): Omit<
  TemplateValidationIssue,
  "id"
>[] {
  const issues: Omit<
    TemplateValidationIssue,
    "id"
  >[] = [];

  issues.push(
    ...findDuplicateIds(
      activities,
      ["atividade_id"],
      "ATIVIDADES"
    )
  );

  issues.push(
    ...validateRequiredField(
      activities,
      "ATIVIDADES",
      ["atividade_id"],
      [
        {
          fields: [
            "atividade_id",
          ],
          label:
            "atividade_id",
        },
        {
          fields: [
            "etapa_id",
          ],
          label:
            "etapa_id",
        },
        {
          fields: [
            "atividade",
          ],
          label:
            "atividade",
        },
      ]
    )
  );

  activities.forEach(
    (activity) => {
      const activityId =
        readField(
          activity,
          ["atividade_id"]
        );

      const stageId =
        readField(
          activity,
          ["etapa_id"]
        );

      if (
        !activityId ||
        !stageId
      ) {
        return;
      }

      if (
        !stageIds.has(
          stageId
        )
      ) {
        issues.push({
          severity: "error",

          category:
            "reference",

          sheet:
            "ATIVIDADES",

          recordId:
            activityId,

          field:
            "etapa_id",

          message:
            `A atividade ${activityId} referencia a etapa ${stageId}, que não existe na aba ETAPAS.`,
        });
      }
    }
  );

  return issues;
}

function validateConnections(
  connections: DataRecord[],
  stageIds: Set<string>
): Omit<
  TemplateValidationIssue,
  "id"
>[] {
  const issues: Omit<
    TemplateValidationIssue,
    "id"
  >[] = [];

  issues.push(
    ...findDuplicateIds(
      connections,
      ["conexao_id"],
      "CONEXOES"
    )
  );

  issues.push(
    ...validateRequiredField(
      connections,
      "CONEXOES",
      ["conexao_id"],
      [
        {
          fields: [
            "conexao_id",
          ],
          label:
            "conexao_id",
        },
        {
          fields: [
            "origem_id",
          ],
          label:
            "origem_id",
        },
        {
          fields: [
            "destino_id",
          ],
          label:
            "destino_id",
        },
        {
          fields: [
            "tipo_fluxo",
          ],
          label:
            "tipo_fluxo",
        },
      ]
    )
  );

  connections.forEach(
    (connection) => {
      const connectionId =
        readField(
          connection,
          ["conexao_id"]
        );

      const sourceId =
        readField(
          connection,
          ["origem_id"]
        );

      const targetId =
        readField(
          connection,
          ["destino_id"]
        );

      const probabilityRaw =
        readField(
          connection,
          [
            "probabilidade_pct",
          ]
        );

      if (
        sourceId &&
        !stageIds.has(
          sourceId
        )
      ) {
        issues.push({
          severity: "error",

          category:
            "reference",

          sheet:
            "CONEXOES",

          recordId:
            connectionId,

          field:
            "origem_id",

          message:
            `A conexão ${connectionId} possui origem ${sourceId}, mas essa etapa não existe.`,
        });
      }

      if (
        targetId &&
        !stageIds.has(
          targetId
        )
      ) {
        issues.push({
          severity: "error",

          category:
            "reference",

          sheet:
            "CONEXOES",

          recordId:
            connectionId,

          field:
            "destino_id",

          message:
            `A conexão ${connectionId} possui destino ${targetId}, mas essa etapa não existe.`,
        });
      }

      if (
        sourceId &&
        targetId &&
        sourceId ===
          targetId
      ) {
        issues.push({
          severity:
            "warning",

          category: "flow",

          sheet:
            "CONEXOES",

          recordId:
            connectionId,

          message:
            `A conexão ${connectionId} possui a mesma etapa como origem e destino (${sourceId}).`,
        });
      }

      if (probabilityRaw) {
        const probability =
          toNumber(
            probabilityRaw
          );

        if (
          probability === null
        ) {
          issues.push({
            severity:
              "error",

            category:
              "probability",

            sheet:
              "CONEXOES",

            recordId:
              connectionId,

            field:
              "probabilidade_pct",

            message:
              `A probabilidade informada em ${connectionId} não é numérica.`,
          });
        } else if (
          probability < 0 ||
          probability > 100
        ) {
          issues.push({
            severity:
              "error",

            category:
              "probability",

            sheet:
              "CONEXOES",

            recordId:
              connectionId,

            field:
              "probabilidade_pct",

            message:
              `A probabilidade de ${connectionId} deve estar entre 0% e 100%. Valor encontrado: ${probabilityRaw}.`,
          });
        }
      }
    }
  );

  return issues;
}

function validateFlowStructure(
  stages: DataRecord[],
  connections: DataRecord[]
): Omit<
  TemplateValidationIssue,
  "id"
>[] {
  const issues: Omit<
    TemplateValidationIssue,
    "id"
  >[] = [];

  const startStages =
    stages.filter(
      (stage) =>
        normalizeText(
          readField(
            stage,
            ["tipo_bpmn"]
          )
        ) === "inicio"
    );

  const endStages =
    stages.filter(
      (stage) =>
        normalizeText(
          readField(
            stage,
            ["tipo_bpmn"]
          )
        ) === "fim"
    );

  if (
    startStages.length === 0
  ) {
    issues.push({
      severity: "error",

      category:
        "structure",

      sheet:
        "ETAPAS",

      recordId: "-",

      message:
        "Nenhuma etapa de início foi encontrada no processo.",
    });
  }

  if (
    startStages.length > 1
  ) {
    issues.push({
      severity:
        "warning",

      category:
        "structure",

      sheet:
        "ETAPAS",

      recordId: "-",

      message:
        `Foram encontradas ${startStages.length} etapas de início.`,
    });
  }

  if (
    endStages.length === 0
  ) {
    issues.push({
      severity: "error",

      category:
        "structure",

      sheet:
        "ETAPAS",

      recordId: "-",

      message:
        "Nenhuma etapa de fim foi encontrada no processo.",
    });
  }

  const outgoingBySource =
    new Map<
      string,
      DataRecord[]
    >();

  connections.forEach(
    (connection) => {
      const sourceId =
        readField(
          connection,
          ["origem_id"]
        );

      if (!sourceId) {
        return;
      }

      const current =
        outgoingBySource.get(
          sourceId
        ) ?? [];

      current.push(
        connection
      );

      outgoingBySource.set(
        sourceId,
        current
      );
    }
  );

  outgoingBySource.forEach(
    (
      outgoingConnections,
      sourceId
    ) => {
      if (
        outgoingConnections.length <=
        1
      ) {
        return;
      }

      const probabilities =
        outgoingConnections
          .map(
            (connection) =>
              toNumber(
                readField(
                  connection,
                  [
                    "probabilidade_pct",
                  ]
                )
              )
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      if (
        probabilities.length !==
        outgoingConnections.length
      ) {
        issues.push({
          severity:
            "warning",

          category:
            "probability",

          sheet:
            "CONEXOES",

          recordId:
            sourceId,

          message:
            `A etapa ${sourceId} possui ${outgoingConnections.length} saídas, mas nem todas possuem probabilidade informada.`,
        });

        return;
      }

      const total =
        probabilities.reduce(
          (
            sum,
            probability
          ) =>
            sum +
            probability,
          0
        );

      if (
        Math.abs(
          total - 100
        ) > 0.01
      ) {
        issues.push({
          severity:
            "warning",

          category:
            "probability",

          sheet:
            "CONEXOES",

          recordId:
            sourceId,

          message:
            `As probabilidades das saídas de ${sourceId} totalizam ${Math.round(
              total * 100
            ) / 100}%, e não 100%.`,
        });
      }
    }
  );

  return issues;
}

export function validateProcessTemplate(
  data: ProcessWorkbookData
): TemplateValidationResult {
  const stages =
    getCollection(
      data,
      [
        "etapas",
        "ETAPAS",
      ]
    );

  const activities =
    getCollection(
      data,
      [
        "atividades",
        "ATIVIDADES",
      ]
    );

  const connections =
    getCollection(
      data,
      [
        "conexoes",
        "CONEXOES",
      ]
    );

  const stageIds =
    new Set(
      stages
        .map(
          (stage) =>
            readField(
              stage,
              ["etapa_id"]
            )
        )
        .filter(Boolean)
    );

  const rawIssues = [
    ...validateStages(
      stages
    ),

    ...validateActivities(
      activities,
      stageIds
    ),

    ...validateConnections(
      connections,
      stageIds
    ),

    ...validateFlowStructure(
      stages,
      connections
    ),
  ];

  const issues =
    rawIssues.map(
      (issue, index) =>
        createIssue(
          index + 1,
          issue
        )
    );

  const errors =
    issues.filter(
      (issue) =>
        issue.severity ===
        "error"
    ).length;

  const warnings =
    issues.filter(
      (issue) =>
        issue.severity ===
        "warning"
    ).length;

  const infos =
    issues.filter(
      (issue) =>
        issue.severity ===
        "info"
    ).length;

  return {
    valid:
      errors === 0,

    errors,
    warnings,
    infos,

    issues,
  };
}