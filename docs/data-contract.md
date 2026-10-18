# Process Intelligence — Data Contract

## Purpose

This document defines the data structure expected by the Process Intelligence application.

The objective of the data contract is to ensure that operational process information can be collected in a consistent, structured and reusable format before being transformed into process visualization and analytics.

The spreadsheet acts as the input layer of the solution.

---

## Input Structure

The current version of the template contains five sheets used directly by the application:

- `PROCESSO`
- `ETAPAS`
- `ATIVIDADES`
- `CONEXOES`
- `REGRAS`

Additional sheets such as `GUIA`, `ROTEIRO`, `DICIONARIO` and `LISTAS` support data collection and user guidance but are not part of the core analytical model.

---

# 1. PROCESSO

Contains the general context and metadata of the process.

| Field | Required | Description |
|---|---|---|
| processo_id | Yes | Unique process identifier |
| nome_processo | Yes | Process name |
| contexto_operacional | No | Operational context or service description |
| area_dona | Yes | Area responsible for the process |
| dono_processo | Recommended | Process owner |
| objetivo | Yes | Main objective of the process |
| versao | Yes | Process mapping version |
| status_mapeamento | Yes | Current mapping status |
| escopo_inicio | Yes | Event that starts the process |
| escopo_fim | Yes | Event that ends the process |
| entrada_principal | Recommended | Main process input |
| saida_principal | Recommended | Main process output |
| volume_medio_mes | Recommended | Average monthly volume |
| periodicidade | Recommended | Process frequency |
| sla_processo | No | Process-level SLA |
| observacao | No | Additional information |

### Current Rule

Version 1 supports one process per workbook.

---

# 2. ETAPAS

Represents the macro structure of the process.

Each stage becomes a process element that can later be represented in BPMN.

| Field | Required | Description |
|---|---|---|
| etapa_id | Yes | Unique stage identifier |
| processo_id | Yes | Process associated with the stage |
| nome_etapa | Yes | Stage name |
| tipo_bpmn | Yes | BPMN element type |
| ordem_referencia | Recommended | Reference order for visualization |
| area_responsavel | Recommended | Area responsible for the stage |
| descricao | Recommended | Stage description |
| entrada_etapa | No | Stage input |
| saida_etapa | No | Stage output |
| criterio_saida | No | Condition required to complete the stage |
| handoff_para | No | Area or role receiving the next activity |
| observacao | No | Additional information |

### Important Rule

`ordem_referencia` helps organize the visualization but does not define the real process flow.

The actual flow is defined by the `CONEXOES` sheet.

---

# 3. ATIVIDADES

Contains the operational activities performed inside each process stage.

This is the main analytical layer of Process Intelligence.

## Operational Information

Examples of activity attributes include:

- Activity name
- Responsible role
- Responsible area
- System
- Execution type
- Input
- Output
- Exception
- Control

## Time and Capacity Information

| Field | Description |
|---|---|
| tempo_execucao_min | Active execution time in minutes |
| tempo_espera_min | Waiting time associated with the activity |
| quantidade_pessoas | Number of people involved |
| volume_medio_mes | Average monthly occurrence volume |
| taxa_ocorrencia_pct | Percentage of cases where the activity occurs |
| sla_atividade | Activity-level SLA |

## Process Intelligence Information

Activities may also contain characteristics used for process analysis:

- Lean classification
- Criticality
- Repetitiveness
- Rule-based execution
- Structured data availability
- Level of human judgment

These attributes will later support bottleneck analysis and automation assessment.

---

## Calculated Metrics

Some values must not be manually entered by the user.

They are calculated by the solution.

### Total Activity Time

```text
Total Time =
Execution Time + Waiting Time
