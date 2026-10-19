"use client";

import {
  useRef,
  useState,
} from "react";

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
  width: number;
  height: number;
};

const TASK_WIDTH = 220;
const TASK_HEIGHT = 104;

const EVENT_SIZE = 72;
const GATEWAY_SIZE = 86;

const COLUMN_GAP = 90;
const LANE_HEIGHT = 210;

const LEFT_PADDING = 190;
const TOP_PADDING = 55;
const BOTTOM_PADDING = 70;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;

function clampZoom(
  value: number
): number {
  return Math.min(
    MAX_ZOOM,
    Math.max(
      MIN_ZOOM,
      value
    )
  );
}

function getNodeDimensions(
  kind: FlowNodeKind
): {
  width: number;
  height: number;
} {
  if (
    kind === "start" ||
    kind === "end" ||
    kind === "event"
  ) {
    return {
      width: EVENT_SIZE,
      height: EVENT_SIZE,
    };
  }

  if (kind === "gateway") {
    return {
      width: GATEWAY_SIZE,
      height: GATEWAY_SIZE,
    };
  }

  return {
    width: TASK_WIDTH,
    height: TASK_HEIGHT,
  };
}

function getNodeLabel(
  kind: FlowNodeKind
): string {
  if (kind === "start") {
    return "Evento de início";
  }

  if (kind === "end") {
    return "Evento de fim";
  }

  if (kind === "gateway") {
    return "Gateway";
  }

  if (kind === "subprocess") {
    return "Subprocesso";
  }

  if (kind === "event") {
    return "Evento";
  }

  return "Tarefa";
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
    new Map<string, number>();

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

      const dimensions =
        getNodeDimensions(
          node.kind
        );

      const slotX =
        LEFT_PADDING +
        (order - 1) *
          (
            TASK_WIDTH +
            COLUMN_GAP
          );

      const laneTop =
        TOP_PADDING +
        laneIndex *
          LANE_HEIGHT;

      return {
        node,

        width:
          dimensions.width,

        height:
          dimensions.height,

        x:
          slotX +
          (
            TASK_WIDTH -
            dimensions.width
          ) /
            2,

        y:
          laneTop +
          (
            LANE_HEIGHT -
            dimensions.height
          ) /
            2,
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
    source.width;

  const sourceY =
    source.y +
    source.height / 2;

  const targetX =
    target.x;

  const targetY =
    target.y +
    target.height / 2;

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

  const returnX =
    Math.max(
      sourceX,
      targetX
    ) + 80;

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
  const scrollContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [zoom, setZoom] =
    useState(1);

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
        TASK_WIDTH +
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

  function handleZoomIn() {
    setZoom(
      (current) =>
        clampZoom(
          current +
            ZOOM_STEP
        )
    );
  }

  function handleZoomOut() {
    setZoom(
      (current) =>
        clampZoom(
          current -
            ZOOM_STEP
        )
    );
  }

  function handleResetZoom() {
    setZoom(1);

    const container =
      scrollContainerRef.current;

    if (container) {
      container.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function handleFitToWidth() {
    const container =
      scrollContainerRef.current;

    if (!container) {
      return;
    }

    const availableWidth =
      Math.max(
        container.clientWidth -
          32,
        200
      );

    const fitZoom =
      availableWidth /
      mapWidth;

    setZoom(
      clampZoom(
        fitZoom
      )
    );

    container.scrollTo({
      left: 0,
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
            label="Gateways"
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

        <div className="flex flex-wrap items-center gap-2">
          <MapControlButton
            label="−"
            title="Diminuir zoom"
            onClick={
              handleZoomOut
            }
            disabled={
              zoom <= MIN_ZOOM
            }
          />

          <div className="min-w-16 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-center text-xs font-medium text-slate-300">
            {Math.round(
              zoom * 100
            )}
            %
          </div>

          <MapControlButton
            label="+"
            title="Aumentar zoom"
            onClick={
              handleZoomIn
            }
            disabled={
              zoom >= MAX_ZOOM
            }
          />

          <MapControlButton
            label="Ajustar à tela"
            title="Ajustar mapa à largura disponível"
            onClick={
              handleFitToWidth
            }
          />

          <MapControlButton
            label="Resetar"
            title="Voltar ao zoom original"
            onClick={
              handleResetZoom
            }
          />
        </div>
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

      <div
        ref={
          scrollContainerRef
        }
        className="overflow-auto rounded-2xl border border-slate-800 bg-slate-950"
      >
        <div
          className="relative overflow-hidden"
          style={{
            width:
              mapWidth *
              zoom,

            height:
              mapHeight *
              zoom,
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width:
                mapWidth,

              height:
                mapHeight,

              transform:
                `scale(${zoom})`,
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
                          Swimlane
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
                    source.width;

                  const sourceCenterY =
                    source.y +
                    source.height /
                      2;

                  const targetCenterX =
                    target.x;

                  const targetCenterY =
                    target.y +
                    target.height /
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
                    10;

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
              (
                positionedNode
              ) => (
                <BpmnNode
                  key={
                    positionedNode
                      .node.id
                  }
                  item={
                    positionedNode
                  }
                />
              )
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
        <LegendItem
          kind="start"
          label="Evento de início"
        />

        <LegendItem
          kind="task"
          label="Tarefa"
        />

        <LegendItem
          kind="gateway"
          label="Gateway"
        />

        <LegendItem
          kind="end"
          label="Evento de fim"
        />
      </div>

      <div className="rounded-xl border border-cyan-950 bg-cyan-950/10 p-4">
        <p className="text-xs leading-5 text-slate-400">
          O mapa utiliza convenções
          visuais inspiradas em BPMN
          para representar eventos,
          tarefas, gateways,
          sequências e swimlanes.
          A geração é baseada nos
          dados estruturados das abas
          ETAPAS e CONEXOES.
        </p>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Esta visualização é uma
        representação BPMN
        simplificada para análise de
        processos. Ela ainda não deve
        ser considerada um modelo
        BPMN 2.0 formal ou arquivo
        interoperável com ferramentas
        BPMN especializadas.
      </p>
    </div>
  );
}

function BpmnNode({
  item,
}: {
  item: PositionedNode;
}) {
  const {
    node,
    x,
    y,
    width,
    height,
  } = item;

  if (node.kind === "start") {
    return (
      <div
        className="absolute z-20"
        style={{
          left: x,
          top: y,
          width,
          height,
        }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-950/30">
          <span className="text-xs font-semibold text-emerald-300">
            {node.id}
          </span>
        </div>

        <NodeExternalLabel
          label={
            node.name ||
            "Início"
          }
          typeLabel="Evento de início"
        />
      </div>
    );
  }

  if (node.kind === "end") {
    return (
      <div
        className="absolute z-20"
        style={{
          left: x,
          top: y,
          width,
          height,
        }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-red-500 bg-red-950/30 shadow-lg shadow-red-950/30">
          <span className="text-xs font-semibold text-red-300">
            {node.id}
          </span>
        </div>

        <NodeExternalLabel
          label={
            node.name ||
            "Fim"
          }
          typeLabel="Evento de fim"
        />
      </div>
    );
  }

  if (node.kind === "gateway") {
    return (
      <div
        className="absolute z-20"
        style={{
          left: x,
          top: y,
          width,
          height,
        }}
      >
        <div className="absolute inset-[10px] rotate-45 rounded-sm border-2 border-amber-500 bg-amber-950/40 shadow-lg shadow-amber-950/30" />

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-light text-amber-300">
            ×
          </span>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-6">
          <span className="text-[9px] font-semibold text-amber-300">
            {node.id}
          </span>
        </div>

        <NodeExternalLabel
          label={
            node.name ||
            "Decisão"
          }
          typeLabel="Gateway exclusivo"
        />
      </div>
    );
  }

  if (node.kind === "event") {
    return (
      <div
        className="absolute z-20"
        style={{
          left: x,
          top: y,
          width,
          height,
        }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-cyan-500 bg-cyan-950/30 shadow-lg shadow-cyan-950/30">
          <span className="text-xs font-semibold text-cyan-300">
            {node.id}
          </span>
        </div>

        <NodeExternalLabel
          label={
            node.name ||
            "Evento"
          }
          typeLabel="Evento"
        />
      </div>
    );
  }

  if (
    node.kind ===
    "subprocess"
  ) {
    return (
      <div
        className="absolute z-20 rounded-xl border-2 border-violet-600 bg-violet-950/30 p-4 shadow-xl"
        style={{
          left: x,
          top: y,
          width,
          minHeight:
            height,
        }}
      >
        <div className="absolute inset-[4px] rounded-lg border border-violet-800/60 pointer-events-none" />

        <TaskContent
          node={node}
          label="Subprocesso"
          labelClass="text-violet-400"
        />
      </div>
    );
  }

  return (
    <div
      className="absolute z-20 rounded-xl border-2 border-slate-600 bg-slate-900 p-4 shadow-xl"
      style={{
        left: x,
        top: y,
        width,
        minHeight:
          height,
      }}
    >
      <TaskContent
        node={node}
        label="Tarefa"
        labelClass="text-cyan-400"
      />
    </div>
  );
}

function TaskContent({
  node,
  label,
  labelClass,
}: {
  node: ProcessFlowNode;
  label: string;
  labelClass: string;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-wide ${labelClass}`}
          >
            {label}
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
          "Atividade sem nome"}
      </p>

      {node.handoffTo && (
        <p className="mt-2 truncate text-[10px] text-slate-500">
          Handoff →{" "}
          {
            node.handoffTo
          }
        </p>
      )}
    </>
  );
}

function NodeExternalLabel({
  label,
  typeLabel,
}: {
  label: string;
  typeLabel: string;
}) {
  return (
    <div className="absolute left-1/2 top-full mt-3 w-48 -translate-x-1/2 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
        {typeLabel}
      </p>

      <p className="mt-1 text-xs font-medium leading-4 text-slate-300">
        {label}
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

function MapControlButton({
  label,
  title,
  onClick,
  disabled = false,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
        disabled
          ? "cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600"
          : "border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-700 hover:text-cyan-300"
      }`}
    >
      {label}
    </button>
  );
}

function LegendItem({
  kind,
  label,
}: {
  kind:
    | "start"
    | "task"
    | "gateway"
    | "end";
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <LegendShape
        kind={kind}
      />

      <span>
        {label}
      </span>
    </div>
  );
}

function LegendShape({
  kind,
}: {
  kind:
    | "start"
    | "task"
    | "gateway"
    | "end";
}) {
  if (kind === "start") {
    return (
      <span className="h-4 w-4 rounded-full border-2 border-emerald-500 bg-emerald-950/30" />
    );
  }

  if (kind === "end") {
    return (
      <span className="h-4 w-4 rounded-full border-[3px] border-red-500 bg-red-950/30" />
    );
  }

  if (
    kind === "gateway"
  ) {
    return (
      <span className="flex h-4 w-4 rotate-45 items-center justify-center border-2 border-amber-500 bg-amber-950/30">
        <span className="-rotate-45 text-[8px] text-amber-300">
          ×
        </span>
      </span>
    );
  }

  return (
    <span className="h-4 w-6 rounded border-2 border-slate-600 bg-slate-900" />
  );
}