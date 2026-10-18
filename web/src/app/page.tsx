export default function Home() {
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
                Transforme dados estruturados de processos em análises e informações visuais.
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
                  Selecione o template Excel do Process Intelligence para iniciar a análise.
                </p>
              </div>

              <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-950 px-6 text-center transition hover:border-cyan-400">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl">
                  ↑
                </div>

                <span className="font-medium">
                  Selecionar arquivo .xlsx
                </span>

                <span className="mt-2 text-sm text-slate-500">
                  O arquivo será processado localmente no seu navegador.
                </span>

                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                />
              </label>

              <button
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-700 px-5 py-3 font-medium text-slate-400"
              >
                Analisar Processo
              </button>

              <button className="mt-3 w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500">
                Baixar template de exemplo
              </button>
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