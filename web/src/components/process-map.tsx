"use client";

import type {
  FlowNodeKind,
  ProcessFlowEdge,
  ProcessFlowModel,
  ProcessFlowNode,
} from "@/lib/process-flow";

type ProcessMapProps = {
  model: ProcessFlowModel;
};

type PositionedNode = {
  node: ProcessFlowNode;
  x: number;
  y: number;
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 104;

const COLUMN_GAP = 90;
const LANE_HEIGHT = 180;

const LEFT_PADDING = 190;
const TOP_PADDING = 55;
const BOTTOM_PADDING = 55;

function getNodeLabel(
  kind: FlowNodeKind
): string {
  if (kind === "start") {
    return "Início";
  }

  if (kind === "end") {
    return "Fim";
  }

  if (kind === "gateway") {
    return "Decisão";
  }

  if (kind === "subprocess") {
    return "Subprocesso";
  }

  if (kind === "event") {
    return "Evento";
  }

  return "Etapa";
}

function getNodeClass(
  kind: FlowNodeKind
): string {
  if (kind === "start") {
    return (
      "border-emerald-700 " +
      "bg-emerald-950/40"
    );
  }

  if (kind === "end") {
    return (
      "border-red-800 " +
      "bg-red-950/30"
    );
  }

  if (kind === "gateway") {
    return (
      "border-amber-700 " +
      "bg-amber-950/30"
    );
  }

  if (kind === "subprocess") {
    return (
      "border-violet-700 " +
      "bg-violet-950/30"
    );
  }

  if (kind === "event") {
    return (
      "border-cyan-700 " +
      "bg-cyan-950/30"
    );
  }

  return (
    "border-slate-700 " +
    "bg-slate-900"
  );
}

function getNodeLabelClass(
  kind: FlowNodeKind
): string {
  if (kind === "start") {
    return "text-emerald-400";
  }

  if (kind === "end") {
    return "text-red-400";
  }

  if (kind === "gateway") {
    return "text-amber-400";
  }

  if (kind === "subprocess") {
    return "text-violet-400";
  }

  if (kind === "event") {
    return "text-cyan-400";
  }

  return "text-slate-400";
}

function getAreaName(
  node: ProcessFlowNode
): string {
  return (
    node.responsibleArea ||
    "Área não informada"
  );
}

function getOrderedAreas(
  nodes: ProcessFlowNode[]
): string[] {
  const areaOrder =
    new Map<
      string,
      number
    >();

  nodes.forEach(
    (node, index) => {
      const area =
        getAreaName(node);

      const reference =
        node.referenceOrder > 0
          ? node.referenceOrder
          : index + 1;

      const current =
        areaOrder.get(area);

      if (
        current === undefined ||
        reference < current
      ) {
        areaOrder.set(
          area,
          reference
        );
      }
    }
  );

  return Array.from(
    areaOrder.entries()
  )
    .sort(
      (a, b) =>
        a[1] - b[1]
    )
    .map(
      ([area]) => area
    );
}

function buildPositions(
  nodes: ProcessFlowNode[],
  areas: string[]
): PositionedNode[] {
  return nodes.map(
    (node, index) => {
      const area =
        getAreaName(node);

      const laneIndex =
        Math.max(
          areas.indexOf(area),
          0
        );

      const order =
        node.referenceOrder > 0
          ? node.referenceOrder
          : index + 1;

      return {
        node,

        x:
          LEFT_PADDING +
          (order - 1) *
            (
              NODE_WIDTH +
              COLUMN_GAP
            ),

        y:
          TOP_PADDING +
          laneIndex *
            LANE_HEIGHT +
          36,
      };
    }
  );
}

function buildConnectionPath(
  source: PositionedNode,
  target: PositionedNode
): string {
  const sourceX =
    source.x +
    NODE_WIDTH;

  const sourceY =
    source.y +
    NODE_HEIGHT / 2;

  const targetX =
    target.x;

  const targetY =
    target.y +
    NODE_HEIGHT / 2;

  /*
   * Fluxo para frente:
   * curva horizontal simples.
   */
  if (targetX >= sourceX) {
    const middleX =
      sourceX +
      (
        targetX -
        sourceX
      ) /
        2;

    return [
      `M ${sourceX} ${sourceY}`,
      `C ${middleX} ${sourceY}`,
      `${middleX} ${targetY}`,
      `${targetX} ${targetY}`,
    ].join(" ");
  }

  /*
   * Fluxo de retorno:
   * cria uma curva externa.
   */
  const returnX =
    Math.max(
      sourceX,
      targetX
    ) + 75;

  return [
    `M ${sourceX} ${sourceY}`,
    `C ${returnX} ${sourceY}`,
    `${returnX} ${targetY}`,
    `${targetX} ${targetY}`,
  ].join(" ");
}

function shouldShowEdgeLabel(
  edge: ProcessFlowEdge
): boolean {
  if (edge.condition) {
    return true;
  }

  if (
    edge.flowType &&
    edge.flowType
      .toLowerCase() !==
      "sequencia"
  ) {
    return true;
  }

  if (
    edge.probabilityPct > 0 &&
    edge.probabilityPct < 100
  ) {
    return true;
  }

  return false;
}

function getEdgeLabel(
  edge: ProcessFlowEdge
): string {
  const parts: string[] = [];

  if (edge.condition) {
    parts.push(
      edge.condition
    );
  }

  if (
    edge.probabilityPct > 0 &&
    edge.probabilityPct < 100
  ) {
    parts.push(
      `${edge.probabilityPct}%`
    );
  }

  if (
    parts.length === 0
  ) {
    return edge.flowType;
  }

  return parts.join(" · ");
}

export default function ProcessMap({
  model,
}: ProcessMapProps) {
  if (
    model.nodes.length === 0
  ) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">
        Não há etapas suficientes
        para montar o mapa do
        processo.
      </div>
    );
  }

  const areas =
    getOrderedAreas(
      model.nodes
    );

  const positionedNodes =
    buildPositions(
      model.nodes,
      areas
    );

  const positionedNodeMap =
    new Map<
      string,
      PositionedNode
    >();

  positionedNodes.forEach(
    (item) => {
      positionedNodeMap.set(
        item.node.id,
        item
      );
    }
  );

  const maxReferenceOrder =
    Math.max(
      1,
      ...model.nodes.map(
        (node, index) =>
          node.referenceOrder > 0
            ? node.referenceOrder
            : index + 1
      )
    );

  const mapWidth =
    LEFT_PADDING +
    maxReferenceOrder *
      (
        NODE_WIDTH +
        COLUMN_GAP
      ) +
    120;

  const mapHeight =
    TOP_PADDING +
    areas.length *
      LANE_HEIGHT +
    BOTTOM_PADDING;

  const validEdges =
    model.edges.filter(
      (edge) =>
        edge.isValid
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <SummaryBadge
          label="Etapas"
          value={
            model.nodes.length
          }
        />

        <SummaryBadge
          label="Conexões"
          value={
            validEdges.length
          }
        />

        <SummaryBadge
          label="Ramificações"
          value={
            model.branchingNodes
              .length
          }
        />

        <SummaryBadge
          label="Áreas"
          value={
            areas.length
          }
        />
      </div>

      {model.warnings.length >
        0 && (
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
            Validação do fluxo
          </p>

          <ul className="mt-3 space-y-2">
            {model.warnings.map(
              (
                warning,
                index
              ) => (
                <li
                  key={`${warning}-${index}`}
                  className="flex gap-2 text-sm text-amber-200/80"
                >
                  <span>•</span>

                  <span>
                    {warning}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
        <div
          className="relative"
          style={{
            width:
              mapWidth,
            height:
              mapHeight,
          }}
        >
          {areas.map(
            (
              area,
              laneIndex
            ) => {
              const top =
                TOP_PADDING +
                laneIndex *
                  LANE_HEIGHT;

              return (
                <div
                  key={area}
                  className="absolute left-0 border-y border-slate-800/70 bg-slate-950/40"
                  style={{
                    top,
                    width:
                      mapWidth,
                    height:
                      LANE_HEIGHT,
                  }}
                >
                  <div
                    className="absolute left-0 top-0 flex h-full items-center border-r border-slate-800 bg-slate-900/80 px-5"
                    style={{
                      width:
                        LEFT_PADDING -
                        20,
                    }}
                  >
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Área
                      </p>

                      <p className="mt-1 max-w-32 text-sm font-semibold text-slate-300">
                        {area}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
          )}

          <svg
            className="absolute inset-0 z-10"
            width={mapWidth}
            height={mapHeight}
          >
            <defs>
              <marker
                id="process-arrow"
                markerWidth="9"
                markerHeight="9"
                refX="8"
                refY="4.5"
                orient="auto"
              >
                <path
                  d="M 0 0 L 9 4.5 L 0 9 z"
                  className="fill-slate-500"
                />
              </marker>
            </defs>

            {validEdges.map(
              (edge) => {
                const source =
                  positionedNodeMap.get(
                    edge.sourceId
                  );

                const target =
                  positionedNodeMap.get(
                    edge.targetId
                  );

                if (
                  !source ||
                  !target
                ) {
                  return null;
                }

                const sourceCenterX =
                  source.x +
                  NODE_WIDTH;

                const sourceCenterY =
                  source.y +
                  NODE_HEIGHT /
                    2;

                const targetCenterX =
                  target.x;

                const targetCenterY =
                  target.y +
                  NODE_HEIGHT /
                    2;

                const labelX =
                  (
                    sourceCenterX +
                    targetCenterX
                  ) /
                  2;

                const labelY =
                  (
                    sourceCenterY +
                    targetCenterY
                  ) /
                    2 -
                  9;

                return (
                  <g
                    key={
                      edge.id
                    }
                  >
                    <path
                      d={buildConnectionPath(
                        source,
                        target
                      )}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      markerEnd="url(#process-arrow)"
                      className="text-slate-600"
                    />

                    {shouldShowEdgeLabel(
                      edge
                    ) && (
                      <>
                        <rect
                          x={
                            labelX -
                            70
                          }
                          y={
                            labelY -
                            12
                          }
                          width="140"
                          height="24"
                          rx="7"
                          className="fill-slate-900 stroke-slate-700"
                        />

                        <text
                          x={
                            labelX
                          }
                          y={
                            labelY +
                            4
                          }
                          textAnchor="middle"
                          className="fill-slate-300 text-[10px]"
                        >
                          {getEdgeLabel(
                            edge
                          )}
                        </text>
                      </>
                    )}
                  </g>
                );
              }
            )}
          </svg>

          {positionedNodes.map(
            ({ node, x, y }) => (
              <div
                key={
                  node.id
                }
                className={`absolute z-20 rounded-xl border p-4 shadow-xl ${getNodeClass(
                  node.kind
                )}`}
                style={{
                  left: x,
                  top: y,
                  width:
                    NODE_WIDTH,
                  minHeight:
                    NODE_HEIGHT,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-wide ${getNodeLabelClass(
                        node.kind
                      )}`}
                    >
                      {getNodeLabel(
                        node.kind
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {node.id}
                    </p>
                  </div>

                  {node.referenceOrder >
                    0 && (
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-500">
                      {
                        node.referenceOrder
                      }
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm font-semibold leading-5 text-slate-100">
                  {node.name ||
                    "Etapa sem nome"}
                </p>

                {node.handoffTo && (
                  <p className="mt-2 truncate text-[10px] text-slate-500">
                    Handoff →{" "}
                    {
                      node.handoffTo
                    }
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
        <LegendItem
          label="Início"
          className="border-emerald-700 bg-emerald-950/40"
        />

        <LegendItem
          label="Etapa"
          className="border-slate-700 bg-slate-900"
        />

        <LegendItem
          label="Decisão"
          className="border-amber-700 bg-amber-950/30"
        />

        <LegendItem
          label="Fim"
          className="border-red-800 bg-red-950/30"
        />
      </div>

      <p className="text-xs leading-5 text-slate-500">
        O mapa representa o fluxo
        entre etapas e áreas com base
        nos dados estruturados das abas
        ETAPAS e CONEXOES. A
        representação BPMN formal será
        tratada em uma evolução
        posterior.
      </p>
    </div>
  );
}

function SummaryBadge({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="ml-2 font-semibold text-slate-200">
        {value}
      </span>
    </div>
  );
}

function LegendItem({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-3 w-3 rounded border ${className}`}
      />

      <span>
        {label}
      </span>
    </div>
  );
}