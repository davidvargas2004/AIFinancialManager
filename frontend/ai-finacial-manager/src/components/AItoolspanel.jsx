import { useState } from "react";
import useAItools from "../../hooks/useAItools";

const SUGERENCIAS = [
  "¿Cómo está mi salud financiera este mes?",
  "¿En qué categorías estoy gastando más?",
  "¿Qué debería ajustar para ahorrar más?",
];

function AItoolspanel() {
  const [pregunta, setPregunta] = useState("");
  const { respuesta, loading, error, preguntar } = useAItools();

  async function submit(event) {
    event.preventDefault();
    const value = pregunta.trim();
    if (!value || loading) return;
    await preguntar(value);
    setPregunta("");
  }

  return (
    <section className="ai-panel" aria-labelledby="ai-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ASESOR FINANCIERO</p>
          <h2 id="ai-title">Toma mejores decisiones</h2>
        </div>
        <span className="ai-badge">✦ IA</span>
      </div>
      {!respuesta && !loading && (
        <div className="ai-suggestions">
          <p>Pregúntame por tus ingresos, gastos, metas o inversiones.</p>
          <div>
            {SUGERENCIAS.map((sugerencia) => (
              <button key={sugerencia} type="button" onClick={() => setPregunta(sugerencia)}>
                {sugerencia}
              </button>
            ))}
          </div>
        </div>
      )}
      {loading && <p className="ai-status">Analizando tus datos financieros...</p>}
      {error && <p className="form-error">{error}</p>}
      {respuesta && !loading && <div className="ai-response">{respuesta}</div>}
      <form className="ai-form" onSubmit={submit}>
        <input
          value={pregunta}
          onChange={(event) => setPregunta(event.target.value)}
          placeholder="Escribe una pregunta sobre tus finanzas..."
          maxLength={2000}
          aria-label="Pregunta para el asesor financiero"
        />
        <button className="primary-button" type="submit" disabled={loading || !pregunta.trim()}>
          {loading ? "Consultando..." : "Consultar"} <span>→</span>
        </button>
      </form>
    </section>
  );
}

export default AItoolspanel;