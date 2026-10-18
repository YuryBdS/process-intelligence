"use client";

import { ChangeEvent, useState } from "react";
import readExcelFile from "read-excel-file/browser";

const REQUIRED_SHEETS = [
  "PROCESSO",
  "ETAPAS",
  "ATIVIDADES",
  "CONEXOES",
  "REGRAS",
];

type SheetValidation = {
  name: string;
  found: boolean;
  rows: number;
};

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [validation, setValidation] = useState<SheetValidation[]>([]);
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");

  const hasCriticalError =
    validation.length > 0 && validation.some((sheet) => !sheet.found);

  const isValidWorkbook =
    validation.length > 0 && validation.every((sheet) => sheet.found);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setError("");
    setValidation([]);
    setAnalysisMessage("");

    if (!file) {
      setFileName("");
      return;
    }

    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Formato inválido. Selecione um arquivo .xlsx.");
      return;
    }

    try {
      setIsReading(true);

      const workbook = await readExcelFile(file);

      const result = REQUIRED_SHEETS.map((requiredSheet) => {
        const sheet = workbook.find(
          (item) =>
            item.sheet.trim().toUpperCase() === requiredSheet.toUpperCase()
        );

        return {
          name: requiredSheet,
          found: Boolean(sheet),
          rows: sheet ? Math.max(sheet.data.length - 1, 0) : 0,
        };
      });

      setValidation(result);
    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível ler o arquivo. Verifique se ele é um Excel válido."
      );
    } finally {
      setIsReading(false);
    }
  }

  function handleAnalyzeProcess() {
    if (!isValidWorkbook) {
      return;
    }

    setAnalysisMessage(
      "Template validado com sucesso. O próximo passo será transformar os dados das abas em um modelo interno de processo."
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Process Intelligence
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Mapeamento de Processos · Análises · Automação
            </p>
          </div>

          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
            MVP
          </span>
        </header>

        <section className="flex flex-1 items-center py-16">
          <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 text-sm font-medium text-cyan-400">
                De dados de processo para inteligência operacional
              </p>

              <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                Transforme dados estruturados de processos em análises e
                informações visuais.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                Utilize um template padronizado para transformar informações
                operacionais em mapas de processo, indicadores de carga de
                trabalho, análise Lean, identificação de gargalos e
                oportunidades de automação.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">
                  Enviar template do processo
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Selecione o template Excel do Process Intelligence para
                  iniciar a análise.
                </p>
              </div>

              <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-950 px-6 text-center transition hover:border-cyan-400">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl">
                  ↑
                </div>

                <span className="font-medium">
                  {fileName || "Selecionar arquivo .xlsx"}
                </span>

                <span className="mt-2 text-sm text-slate-500">
                  O arquivo será processado localmente no seu navegador.
                </span>

                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {isReading && (
                <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
                  Lendo e validando o arquivo...
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
                  ✕ {error}
                </div>
              )}

              {validation.length > 0 && !isReading && (
                <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-200">
                    Validação do template
                  </p>

                  <div className="space-y-2">
                    {validation.map((sheet) => (
                      <div
                        key={sheet.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span
                          className={
                            sheet.found ? "text-slate-300" : "text-red-300"
                          }
                        >
                          {sheet.found ? "✓" : "✕"} {sheet.name}
                        </span>

                        <span className="text-slate-500">
                          {sheet.found
                            ? `${sheet.rows} registros`
                            : "não encontrada"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {isValidWorkbook && (
                    <p className="mt-4 border-t border-slate-800 pt-4 text-sm text-emerald-400">
                      ✓ Estrutura mínima do template validada.
                    </p>
                  )}

                  {hasCriticalError && (
                    <p className="mt-4 border-t border-slate-800 pt-4 text-sm text-red-300">
                      ✕ Existem abas obrigatórias ausentes. O processo não pode
                      ser analisado.
                    </p>
                  )}
                </div>
              )}

              <button
                disabled={!isValidWorkbook}
                onClick={handleAnalyzeProcess}
                className={`mt-6 w-full rounded-xl px-5 py-3 font-medium transition ${
                  isValidWorkbook
                    ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    : "cursor-not-allowed bg-slate-700 text-slate-400"
                }`}
              >
                Analisar Processo
              </button>

              <button className="mt-3 w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500">
                Baixar template de exemplo
              </button>

              {analysisMessage && (
                <div className="mt-5 rounded-xl border border-cyan-900 bg-cyan-950/30 p-4 text-sm leading-6 text-cyan-200">
                  {analysisMessage}
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-800 pt-6 text-sm text-slate-500">
          Dados estruturados → BPMN → Análises → Avaliação de Automação
        </footer>
      </div>
    </main>
  );
}