# Process Intelligence

Process Intelligence is a portfolio project that transforms structured operational process data into process visualization, operational analytics and automation recommendations.

The project explores a practical question:

> What if process mapping could become structured data that can be validated, analyzed and used to support process improvement and automation decisions?

Instead of treating a process map only as documentation, Process Intelligence connects process design with operational data, workload indicators, Lean analysis, business rules and automation assessment.

---

## Current Status

**V1 MVP completed**

The current version supports the complete flow:

```text
Excel Template
      |
      v
Structural Validation
      |
      v
Process Data Model
      |
      v
Process Visualization
      |
      v
Operational Analytics
      |
      v
Automation Assessment
      |
      v
Automation Prioritization
      |
      v
Executive Recommendation
```

---

## The Problem

Operational processes are often documented across spreadsheets, presentations, interviews and diagrams.

These formats are useful for describing how a process works, but they frequently make it difficult to consistently answer questions such as:

- Where is operational effort concentrated?
- Which activities generate waiting or rework?
- Which parts of the process deserve further investigation?
- Which activities have characteristics suitable for automation?
- Which automation opportunities should be evaluated first?
- Are process stages and connections structurally consistent?

Process Intelligence addresses this by turning process documentation into structured process data.

---

## Structured Process Template

The application uses a standardized Excel workbook as its process data source.

The main sheets are:

- `PROCESSO`
- `ETAPAS`
- `ATIVIDADES`
- `CONEXOES`
- `REGRAS`

Additional guidance sheets help users understand how the template should be completed.

A downloadable example template is available directly from the application.

---

## Structural Validation

Before the process can be analyzed, Process Intelligence validates its structure.

Current checks include:

- Required sheets
- Required fields
- Duplicate identifiers
- Invalid stage references
- Invalid connection references
- Self-referencing connections
- BPMN-type consistency
- Start and end events
- Branch probabilities
- Process-flow structural consistency

Critical structural errors prevent the analysis from running.

---

## Process Visualization

The application automatically generates a process map from the structured Excel data.

The visualization currently supports:

- Swimlanes by responsible area
- Start events
- End events
- Tasks
- Exclusive gateways
- Sequence flows
- Conditions
- Branch probabilities
- Rework and return flows
- Zoom controls
- Fit-to-screen visualization

The map uses conventions inspired by BPMN.

It is intentionally described as a **simplified BPMN representation** and is not yet a formal BPMN 2.0 model or interoperable BPMN file.

---

## Operational Workload Analysis

Process Intelligence estimates monthly operational workload at activity level.

The calculation considers:

```text
Execution Time
x People
x Monthly Volume
x Occurrence Rate
-----------------
       60
```

The result represents estimated monthly human effort in hours.

Waiting time is analyzed separately and is not automatically considered human workload.

```text
Waiting Time != Human Effort
```

This distinction prevents process lead time from being incorrectly interpreted as human effort.

---

## Lean Analysis

Activities can be classified as:

- Value Added
- Necessary
- Waste
- Unclassified

Instead of simply counting activities, the Lean distribution uses estimated monthly workload.

This helps show where operational effort is actually concentrated.

---

## Bottleneck Signals

The application identifies activities that may deserve additional investigation.

The assessment combines signals such as:

- Workload
- Waiting time
- Criticality
- SLA proximity
- Rework
- Waste
- Manual execution

These results are intentionally presented as **bottleneck signals**, not definitive bottlenecks.

A high-workload activity may simply be a high-volume core activity.

Operational context is still required before making a final decision.

---

## Automation Assessment

Each activity is evaluated using characteristics such as:

- Repetitiveness
- Rule-based execution
- Structured data availability
- Human judgment requirements
- Execution type

The result indicates whether an activity has low, medium or high automation suitability.

Automation suitability alone does not define implementation priority.

---

## Automation Prioritization

Process Intelligence separates automation suitability from operational impact.

```text
Automation Suitability
        +
Operational Impact
        =
Automation Priority
```

The prioritization model combines both dimensions before ranking opportunities.

This prevents an activity from becoming a top priority only because it is technically easy to automate.

---

## Executive Recommendations

The application converts analytical results into initial recommendations.

Possible approaches include:

- Deterministic validation
- System integration
- Workflow automation
- Assisted automation
- Process redesign before automation

The recommendation engine is deterministic and rule-based in the current V1.

It does not automatically claim financial savings or guaranteed automation benefits.

Actual benefits should be validated through process-owner review, technical assessment and pilot measurement.

---

## Example Process

The provided workbook represents a synthetic operational request process containing:

- 12 process stages
- 18 operational activities
- 13 process connections
- 5 business rules
- Multiple responsible areas
- Decision points
- Rework flows
- Waiting time
- Operational workload
- Automation characteristics

All example data is synthetic and intended only for demonstration and portfolio purposes.

---

## Solution Architecture

```text
Excel Workbook
      |
      v
Excel Reader
      |
      v
Process Data Parser
      |
      +-----------------------+
      |                       |
      v                       v
Template Validator       Process Flow Model
      |                       |
      v                       v
Process Analytics        Process Visualization
      |
      v
Automation Scoring
      |
      v
Priority Engine
      |
      v
Executive Recommendation Engine
      |
      v
Next.js User Interface
```

The current version processes the uploaded workbook directly in the browser.

No backend is required for V1.

---

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- read-excel-file
- SVG-based process visualization
- Git
- GitHub

The process map is generated without requiring an external BPMN visualization library.

---

## Repository Structure

```text
process-intelligence/
|
+-- docs/
|   +-- data-contract.md
|   +-- solution-design.md
|
+-- examples/
|   +-- Process_Intelligence_Template_V2.xlsx
|
+-- web/
|   +-- public/
|   +-- src/
|   |   +-- app/
|   |   +-- components/
|   |   +-- lib/
|   |
|   +-- package.json
|
+-- README.md
+-- LICENSE
```

---

## Running Locally

Clone the repository:

```bash
git clone https://github.com/YuryBdS/process-intelligence.git
```

Enter the application directory:

```bash
cd process-intelligence/web
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

On Windows environments where PowerShell blocks `npm.ps1`, the equivalent commands can be executed with:

```bash
npm.cmd install
npm.cmd run dev
```

> The commands above are installation instructions for someone cloning the project. They do not need to be executed when editing this README.

---

## Technical Validation

V1 has been validated with:

```text
Production build        OK
TypeScript validation   OK
ESLint                   0 errors / 0 warnings
Production dependencies 0 known vulnerabilities
```

Validation commands:

```bash
npm run lint
npm run build
npm audit --omit=dev
```

The dependency security statement above refers specifically to production dependencies at the time of V1 validation.

---

## Design Principles

### Structured data before automation

Automation decisions should start with a clear representation of the process, activities, rules, inputs, outputs and exceptions.

### Rules before unnecessary AI

When deterministic rules can reliably solve the problem, they should be preferred before introducing generative AI.

### Workload is not the same as bottleneck

High workload is an analytical signal, not automatic evidence of a bottleneck.

### Waiting is not human effort

Waiting time affects process lead time but should not automatically be counted as operational workload.

### Do not automate waste blindly

When an activity exists because of rework or process inefficiency, redesign may be more appropriate than automation.

### Recommendations should be explainable

Every recommendation should be traceable to structured process data and explicit decision rules.

---

## V1 Scope

The current version includes:

- Excel-based process modeling
- Downloadable example template
- Structural process validation
- Automatic process visualization
- BPMN-inspired notation
- Swimlanes
- Operational workload analysis
- Lean analysis
- Bottleneck signals
- Automation suitability assessment
- Automation prioritization
- Executive recommendations
- Local browser-based processing

---

## Future Evolution

Possible future versions may include:

- Formal BPMN 2.0 generation
- BPMN file export
- Process simulation
- Capacity simulation
- Scenario comparison
- Automated reporting
- PDF or presentation export
- Process benchmarking
- Historical process analysis
- Integration with operational systems
- AI-assisted process discovery
- AI-assisted process documentation

These capabilities are intentionally outside the V1 scope.

---

## Project Purpose

Process Intelligence was created as a portfolio project focused on the intersection of:

**Process Management + Data + Operational Analytics + Automation**

The objective is not only to draw process maps.

The project demonstrates how structured process information can be transformed into explainable analytical signals and better automation decisions.

---

## Author

**Yury Batista**

Business processes, operational analysis, data and automation.