"use client";

import type {
  TemplateValidationIssue,
  TemplateValidationResult,
  ValidationSeverity,
} from "@/lib/template-validation";

type TemplateValidationPanelProps = {
  result: TemplateValidationResult;
};

function getSeverityLabel(
  severity: ValidationSeverity
): string {
  if (severity === "error") {
    return "Erro";
  }

  if (severity === "warning") {
    return "Atenção";
  }

  return "Informação";
}

function getSeverityClass(
  severity: ValidationSeverity
): string {
  if (severity === "error") {
    return "border-red-900 bg-red-950/30 text-red-300";
  }

  if (severity === "warning") {
    return "border-amber-900 bg-amber-950/30 text-amber-300";
  }

  return "border-cyan-900 bg-cyan-950/30 text-cyan-300";
}

function getIssueBorderClass(
  severity: ValidationSeverity
): string {
  if (severity === "error") {
    return "border-red-900/60";
  }

  if (severity === "warning") {
    return "border-amber-900/60";
  }

  return "border-cyan-900/60";
}

function ValidationCounter({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
    >
      <p className="text-xs uppercase tracking-wide opacity-70">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function IssueCard({
  issue,
}: {
  issue: TemplateValidationIssue;
}) {
  return (
    <div
      className={`rounded-xl border bg-slate-950 p-4 ${getIssueBorderClass(
        issue.severity
      )}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getSeverityClass(
                issue.severity
              )}`}
            >
              {getSeverityLabel(
                issue.severity
              )}
            </span>

            <span className="text-xs text-slate-500">
              {issue.id}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {issue.message}
          </p>
        </div>

        <div className="text-right text-xs text-slate-500">
          <p>{issue.sheet}</p>

          <p className="mt-1">
            {issue.recordId}
          </p>
        </div>
      </div>

      {issue.field && (
        <p className="mt-3 text-xs text-slate-600">
          Campo:{" "}
          <span className="text-slate-400">
            {issue.field}
          </span>
        </p>
      )}
    </div>
  );
}

export default function TemplateValidationPanel({
  result,
}: TemplateValidationPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-cyan-400">
            Qualidade do modelo
          </p>

          <h3 className="mt-2 text-2xl font-semibold">
            Validação estrutural do template
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Verificação automática de IDs, referências,
            campos obrigatórios, estrutura do fluxo,
            probabilidades e tipos BPMN informados no
            template.
          </p>
        </div>

        <span
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            result.valid
              ? "border-emerald-800 bg-emerald-950/30 text-emerald-300"
              : "border-red-800 bg-red-950/30 text-red-300"
          }`}
        >
          {result.valid
            ? "Estrutura válida"
            : "Correções necessárias"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ValidationCounter
          label="Erros"
          value={result.errors}
          className="border-red-900/50 bg-red-950/10 text-red-300"
        />

        <ValidationCounter
          label="Atenções"
          value={result.warnings}
          className="border-amber-900/50 bg-amber-950/10 text-amber-300"
        />

        <ValidationCounter
          label="Informações"
          value={result.infos}
          className="border-cyan-900/50 bg-cyan-950/10 text-cyan-300"
        />
      </div>

      {result.issues.length === 0 ? (
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/10 p-5">
          <p className="font-medium text-emerald-300">
            ✓ Nenhuma inconsistência estrutural identificada.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            O template passou pelas verificações estruturais
            disponíveis nesta versão.
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            Inconsistências identificadas
          </p>

          <div className="space-y-3">
            {result.issues.map(
              (issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                />
              )
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-xs leading-5 text-slate-500">
          Erros representam inconsistências que podem
          comprometer a interpretação do processo. Atenções
          indicam situações que merecem revisão, mas não
          necessariamente impedem a análise.
        </p>
      </div>
    </div>
  );
}