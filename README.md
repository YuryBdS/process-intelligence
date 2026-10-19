# Process Intelligence

**From structured process data to operational intelligence and automation decisions.**

Process Intelligence is a portfolio project that transforms structured operational data into process visualization, workload analytics, Lean insights, bottleneck signals, automation prioritization and executive recommendations.

### [Live Demo](https://process-intelligence-seven.vercel.app)

### [GitHub Repository](https://github.com/YuryBdS/process-intelligence)

---

## Why I Built This

Process mapping is frequently treated as documentation.

A process is mapped, presented and eventually becomes a static diagram.

But operational processes also contain valuable data:

- execution time
- waiting time
- workload
- volume
- SLA
- business rules
- exceptions
- rework
- decision points
- systems
- responsible areas
- automation characteristics

Process Intelligence explores a different approach:

> What if process mapping became structured data that could support operational analysis and automation decisions?

The result is an application that connects:

**Process Management + Data + Operational Analytics + Automation**

---

## What the Application Does

The user starts with a structured Excel template.

The application then transforms this information through the following flow:

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

The objective is not only to draw a process map.

The objective is to transform process information into **explainable analytical signals that can support better decisions**.

---

## Live Demo

The V1 is publicly available at:

### https://process-intelligence-seven.vercel.app

You can:

1. Download the example Excel template.
2. Upload the template to the application.
3. Validate the process structure.
4. Generate the process map.
5. Analyze workload and Lean distribution.
6. Identify bottleneck signals.
7. Evaluate automation opportunities.
8. Review automation priorities.
9. Generate initial executive recommendations.

All sample data is synthetic and intended only for demonstration purposes.

---

## Product Preview

The current interface includes:

- Excel template upload
- Structural validation
- Process overview
- BPMN-inspired process visualization
- Swimlanes
- Workload indicators
- Lean analysis
- Bottleneck signals
- Automation assessment
- Automation priority ranking
- Executive recommendations

> A product screenshot can be added here as the visual cover of the project.

---

## V1 Status

**V1 MVP completed and deployed.**

The current version has been validated locally and in production.

```text
Production build        OK
TypeScript validation   OK
ESLint                   0 errors / 0 warnings
Production dependencies 0 known vulnerabilities
Production deployment   OK
```

---

# Core Capabilities

## 1. Structured Process Template

The application uses a standardized Excel workbook as its process data source.

The main sheets are:

- `PROCESSO`
- `ETAPAS`
- `ATIVIDADES`
- `CONEXOES`
- `REGRAS`

Additional guidance sheets help users understand how the process should be documented.

The application also provides a downloadable example template.

---

## 2. Structural Validation

Before the process can be analyzed, Process Intelligence validates its structure.

Current validation includes:

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

This creates an important principle for the project:

```text
Validate the process model before analyzing the process.
```

---

## 3. Process Visualization

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
- Rework flows
- Return flows
- Zoom controls
- Fit-to-screen visualization

The map uses conventions inspired by BPMN.

It is intentionally described as a **simplified BPMN representation**.

The current version is not yet a formal BPMN 2.0 model or an interoperable BPMN file.

---

## 4. Operational Workload Analysis

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

One important design decision is that waiting time is analyzed separately.

```text
Waiting Time != Human Effort
```

Waiting can increase process lead time without requiring equivalent human effort.

---

## 5. Lean Analysis

Activities can be classified as:

- Value Added
- Necessary
- Waste
- Unclassified

Instead of simply counting activities, the Lean distribution uses estimated monthly workload.

This provides a more useful view of where operational effort is actually concentrated.

---

## 6. Bottleneck Signals

The application identifies activities that may deserve additional investigation.

The assessment combines signals such as:

- Workload
- Waiting time
- Criticality
- SLA proximity
- Rework
- Waste
- Manual execution

The results are intentionally presented as **bottleneck signals**, not definitive bottlenecks.

A high-workload activity may simply be a high-volume core activity.

```text
High Workload != Confirmed Bottleneck
```

Operational context is still required before making a final decision.

---

## 7. Automation Assessment

Each activity is evaluated using characteristics such as:

- Repetitiveness
- Rule-based execution
- Structured data availability
- Human judgment requirements
- Execution type

The result indicates whether an activity has:

- Low automation suitability
- Medium automation suitability
- High automation suitability

Automation suitability alone does not define implementation priority.

---

## 8. Automation Prioritization

Process Intelligence separates two dimensions:

```text
Automation Suitability
        +
Operational Impact
        =
Automation Priority
```

This distinction is important.

An activity can be technically easy to automate but have limited business impact.

Likewise, an operationally important activity may require significant redesign before automation.

The ranking therefore combines both perspectives.

---

## 9. Executive Recommendations

The application converts analytical results into initial recommendations.

Possible approaches include:

- Deterministic validation
- System integration
- Workflow automation
- Assisted automation
- Process redesign before automation

The recommendation engine is deterministic and rule-based in V1.

Recommendations remain explainable because they are connected to explicit process data and scoring rules.

The system does not automatically claim financial savings or guaranteed automation benefits.

Actual benefits should be validated through:

- process-owner review
- technical assessment
- pilot implementation
- before/after measurement

---

# Example Process

The provided workbook represents a synthetic operational request process containing:

```text
12 process stages
18 operational activities
13 process connections
5 business rules
3 responsible areas
```

The example also includes:

- Decision points
- Rework flows
- Waiting time
- Operational workload
- SLA information
- Lean classification
- Automation characteristics

All information is synthetic and intended exclusively for demonstration and portfolio purposes.

---

# Solution Architecture

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

The Excel workbook is processed directly in the browser.

The current V1 does not require:

- Backend
- Database
- External AI API
- Server-side file storage

This keeps the architecture simple and makes the application suitable for lightweight deployment.

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Data Processing

- read-excel-file
- Structured process data model
- Deterministic scoring rules

## Visualization

- React
- SVG
- Custom process-map rendering

## Engineering

- Git
- GitHub
- ESLint
- TypeScript validation
- Production build validation

## Deployment

- Vercel

---

# Repository Structure

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
|   |
|   +-- public/
|   |   +-- Process_Intelligence_Template_V2.xlsx
|   |
|   +-- src/
|   |   |
|   |   +-- app/
|   |   |
|   |   +-- components/
|   |   |   +-- process-map.tsx
|   |   |   +-- template-validation-panel.tsx
|   |   |
|   |   +-- lib/
|   |       +-- process-data.ts
|   |       +-- process-flow.ts
|   |       +-- template-validation.ts
|   |       +-- automation-priority.ts
|   |       +-- executive-recommendation.ts
|   |
|   +-- package.json
|
+-- README.md
+-- LICENSE
```

---

# Design Principles

## Structured Data Before Automation

Automation decisions should start with a clear representation of:

- activities
- inputs
- outputs
- rules
- exceptions
- responsibilities
- systems

---

## Rules Before Unnecessary AI

If deterministic rules can reliably solve the problem, they should be considered before introducing generative AI.

The current V1 therefore focuses on **explainable rule-based intelligence**.

---

## Workload Is Not the Same as Bottleneck

A high-volume core activity may naturally have high workload.

High workload should trigger investigation, not an automatic conclusion.

---

## Waiting Is Not Human Effort

Waiting affects process lead time.

It should not automatically be counted as operational human effort.

---

## Do Not Automate Waste Blindly

An inefficient process should not automatically become an automated inefficient process.

When an activity exists because of:

- rework
- unnecessary handoffs
- poor process design
- redundant controls

process redesign may be more appropriate than automation.

---

## Recommendations Should Be Explainable

Every recommendation should be traceable to structured process information and explicit rules.

This makes the logic easier to:

- understand
- challenge
- improve
- audit

---

# Running Locally

Clone the repository:

```bash
git clone https://github.com/YuryBdS/process-intelligence.git
```

Enter the web application:

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

For Windows environments where PowerShell blocks `npm.ps1`, use:

```bash
npm.cmd install
npm.cmd run dev
```

---

# Technical Validation

The V1 was validated using:

```bash
npm run lint
npm run build
npm audit --omit=dev
```

Validation result:

```text
Next.js production build       PASS
TypeScript validation          PASS
ESLint                         PASS
Production vulnerabilities     0
Vercel production deployment   PASS
```

---

# V1 Scope

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
- Public deployment

---

# Future Evolution

Possible future versions may include:

- Formal BPMN 2.0 generation
- BPMN file export
- Process simulation
- Capacity simulation
- Scenario comparison
- Automated reporting
- PDF export
- Presentation export
- Process benchmarking
- Historical process analysis
- Integration with operational systems
- AI-assisted process discovery
- AI-assisted process documentation

These capabilities are intentionally outside the V1 scope.

---

# What This Project Demonstrates

This project was created to demonstrate more than application development.

It combines:

```text
Business Process Understanding
          +
Structured Data Modeling
          +
Operational Analysis
          +
Decision Rules
          +
Automation Thinking
          +
Software Development
```

The central idea is:

> Process information becomes significantly more valuable when it can be structured, analyzed and transformed into explainable decisions.

---

# Project Links

### Live Application

https://process-intelligence-seven.vercel.app

### Source Code

https://github.com/YuryBdS/process-intelligence

---

# Author

**Yury Batista**

Business Processes · Operational Analysis · Data · Automation
