import type {
  DataRecord,
  ProcessWorkbookData,
} from "@/lib/process-data";

export type FlowNodeKind =
  | "start"
  | "end"
  | "gateway"
  | "task"
  | "subprocess"
  | "event";

export type ProcessFlowNode = {
  id: string;
  processId: string;

  name: string;

  bpmnType: string;
  kind: FlowNodeKind;

  referenceOrder: number;

  responsibleArea: string;

  description: string;

  input: string;
  output: string;

  exitCriteria: string;

  handoffTo: string;

  observation: string;
};

export type ProcessFlowEdge = {
  id: string;

  sourceId: string;
  targetId: string;

  flowType: string;

  condition: string;

  probabilityPct: number;

  outputOrder: number;

  observation: string;

  isValid: boolean;
};

export type ProcessFlowModel = {
  nodes: ProcessFlowNode[];
  edges: ProcessFlowEdge[];

  startNodes: ProcessFlowNode[];
  endNodes: ProcessFlowNode[];

  branchingNodes: ProcessFlowNode[];

  orphanNodes: ProcessFlowNode[];

  brokenEdges: ProcessFlowEdge[];

  warnings: string[];
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
): number {
  if (!value) {
    return 0;
  }

  const normalized = value
    .replace("%", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const number =
    Number(normalized);

  return Number.isFinite(number)
    ? number
    : 0;
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
    const value = source[name];

    if (Array.isArray(value)) {
      return value as DataRecord[];
    }
  }

  return [];
}

function getNodeKind(
  rawType: string
): FlowNodeKind {
  const type =
    normalizeText(rawType);

  if (
    [
      "inicio",
      "start",
      "evento inicio",
      "evento_inicio",
      "start event",
    ].includes(type)
  ) {
    return "start";
  }

  if (
    [
      "fim",
      "end",
      "evento fim",
      "evento_fim",
      "end event",
    ].includes(type)
  ) {
    return "end";
  }

  if (
    type.includes("gateway") ||
    type.includes("decis") ||
    type.includes("exclusiv") ||
    type.includes("inclusiv") ||
    type.includes("paralel")
  ) {
    return "gateway";
  }

  if (
    type.includes("subprocess")
  ) {
    return "subprocess";
  }

  if (
    type.includes("evento") ||
    type.includes("event")
  ) {
    return "event";
  }

  return "task";
}

function buildNodes(
  records: DataRecord[]
): ProcessFlowNode[] {
  return records
    .map((record) => {
      const bpmnType =
        readField(
          record,
          ["tipo_bpmn"]
        );

      return {
        id: readField(
          record,
          ["etapa_id"]
        ),

        processId: readField(
          record,
          ["processo_id"]
        ),

        name: readField(
          record,
          ["nome_etapa"]
        ),

        bpmnType,

        kind:
          getNodeKind(
            bpmnType
          ),

        referenceOrder:
          toNumber(
            readField(
              record,
              ["ordem_referencia"]
            )
          ),

        responsibleArea:
          readField(
            record,
            ["area_responsavel"]
          ),

        description:
          readField(
            record,
            ["descricao"]
          ),

        input:
          readField(
            record,
            ["entrada_etapa"]
          ),

        output:
          readField(
            record,
            ["saida_etapa"]
          ),

        exitCriteria:
          readField(
            record,
            ["criterio_saida"]
          ),

        handoffTo:
          readField(
            record,
            ["handoff_para"]
          ),

        observation:
          readField(
            record,
            ["observacao"]
          ),
      };
    })
    .filter(
      (node) =>
        node.id.length > 0
    )
    .sort(
      (a, b) =>
        a.referenceOrder -
        b.referenceOrder
    );
}

function buildEdges(
  records: DataRecord[],
  nodeIds: Set<string>
): ProcessFlowEdge[] {
  return records
    .map((record) => {
      const sourceId =
        readField(
          record,
          ["origem_id"]
        );

      const targetId =
        readField(
          record,
          ["destino_id"]
        );

      return {
        id: readField(
          record,
          ["conexao_id"]
        ),

        sourceId,

        targetId,

        flowType:
          readField(
            record,
            ["tipo_fluxo"]
          ),

        condition:
          readField(
            record,
            ["condicao"]
          ),

        probabilityPct:
          toNumber(
            readField(
              record,
              [
                "probabilidade_pct",
              ]
            )
          ),

        outputOrder:
          toNumber(
            readField(
              record,
              ["ordem_saida"]
            )
          ),

        observation:
          readField(
            record,
            ["observacao"]
          ),

        isValid:
          nodeIds.has(
            sourceId
          ) &&
          nodeIds.has(
            targetId
          ),
      };
    })
    .filter(
      (edge) =>
        edge.id.length > 0
    )
    .sort((a, b) => {
      if (
        a.sourceId ===
        b.sourceId
      ) {
        return (
          a.outputOrder -
          b.outputOrder
        );
      }

      return a.id.localeCompare(
        b.id
      );
    });
}

function getBranchingNodes(
  nodes: ProcessFlowNode[],
  edges: ProcessFlowEdge[]
): ProcessFlowNode[] {
  const outgoingCount =
    new Map<string, number>();

  edges
    .filter(
      (edge) =>
        edge.isValid
    )
    .forEach((edge) => {
      outgoingCount.set(
        edge.sourceId,
        (
          outgoingCount.get(
            edge.sourceId
          ) ?? 0
        ) + 1
      );
    });

  return nodes.filter(
    (node) =>
      (
        outgoingCount.get(
          node.id
        ) ?? 0
      ) > 1
  );
}

function getOrphanNodes(
  nodes: ProcessFlowNode[],
  edges: ProcessFlowEdge[]
): ProcessFlowNode[] {
  const connectedNodeIds =
    new Set<string>();

  edges
    .filter(
      (edge) =>
        edge.isValid
    )
    .forEach((edge) => {
      connectedNodeIds.add(
        edge.sourceId
      );

      connectedNodeIds.add(
        edge.targetId
      );
    });

  return nodes.filter(
    (node) =>
      !connectedNodeIds.has(
        node.id
      )
  );
}

function buildWarnings(
  nodes: ProcessFlowNode[],
  edges: ProcessFlowEdge[],
  startNodes: ProcessFlowNode[],
  endNodes: ProcessFlowNode[],
  orphanNodes: ProcessFlowNode[],
  brokenEdges: ProcessFlowEdge[]
): string[] {
  const warnings: string[] = [];

  if (
    nodes.length === 0
  ) {
    warnings.push(
      "Nenhuma etapa válida foi encontrada."
    );
  }

  if (
    edges.length === 0
  ) {
    warnings.push(
      "Nenhuma conexão válida foi encontrada."
    );
  }

  if (
    startNodes.length === 0
  ) {
    warnings.push(
      "O processo não possui uma etapa classificada como início."
    );
  }

  if (
    startNodes.length > 1
  ) {
    warnings.push(
      `Foram identificados ${startNodes.length} pontos de início.`
    );
  }

  if (
    endNodes.length === 0
  ) {
    warnings.push(
      "O processo não possui uma etapa classificada como fim."
    );
  }

  if (
    brokenEdges.length > 0
  ) {
    warnings.push(
      `${brokenEdges.length} conexão(ões) apontam para etapas inexistentes.`
    );
  }

  if (
    orphanNodes.length > 0
  ) {
    warnings.push(
      `${orphanNodes.length} etapa(s) estão isoladas do fluxo.`
    );
  }

  return warnings;
}

export function buildProcessFlowModel(
  data: ProcessWorkbookData
): ProcessFlowModel {
  const stageRecords =
    getCollection(
      data,
      [
        "etapas",
        "ETAPAS",
      ]
    );

  const connectionRecords =
    getCollection(
      data,
      [
        "conexoes",
        "CONEXOES",
      ]
    );

  const nodes =
    buildNodes(
      stageRecords
    );

  const nodeIds =
    new Set(
      nodes.map(
        (node) => node.id
      )
    );

  const edges =
    buildEdges(
      connectionRecords,
      nodeIds
    );

  const startNodes =
    nodes.filter(
      (node) =>
        node.kind === "start"
    );

  const endNodes =
    nodes.filter(
      (node) =>
        node.kind === "end"
    );

  const branchingNodes =
    getBranchingNodes(
      nodes,
      edges
    );

  const orphanNodes =
    getOrphanNodes(
      nodes,
      edges
    );

  const brokenEdges =
    edges.filter(
      (edge) =>
        !edge.isValid
    );

  const warnings =
    buildWarnings(
      nodes,
      edges,
      startNodes,
      endNodes,
      orphanNodes,
      brokenEdges
    );

  return {
    nodes,
    edges,

    startNodes,
    endNodes,

    branchingNodes,
    orphanNodes,

    brokenEdges,

    warnings,
  };
}