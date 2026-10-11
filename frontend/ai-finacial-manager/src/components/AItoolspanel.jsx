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

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="ai-panel" aria-labelledby="ai-title">
      <div className="section-heading">
        <div className="ai-heading-copy">
          <p className="eyebrow">ASESOR FINANCIERO</p>
          <h2 id="ai-title">Toma mejores decisiones</h2>
          <p className="ai-intro">Consulta tus ingresos, gastos y metas con una vista clara de tu dinero.</p>
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
      {loading && (
        <div className="ai-loading" role="status" aria-live="polite">
          <span className="ai-spinner" aria-hidden="true" />
          <div>
            <strong>Analizando tus datos financieros</strong>
            <p>Estoy revisando tus movimientos y preparando una recomendación...</p>
          </div>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      {respuesta && !loading && (
        <div className="ai-response-wrap">
          <div className="ai-response-label"><span>✦</span> Respuesta de tu asesor</div>
          <div className="ai-response">
            <p className="ai-greeting">{respuesta.saludo}</p>
            <p>{respuesta.resumen}</p>
            {respuesta.registro?.estado === "registrado" && (
              <div className="ai-recorded">
                <strong>Movimiento registrado</strong>
                <span>{respuesta.registro.tipo === "ingreso" ? "Ingreso" : "Gasto"} de ${Number(respuesta.registro.monto).toLocaleString("es-CO", { minimumFractionDigits: 2 })} · {respuesta.registro.categoria}</span>
              </div>
            )}
            {respuesta.observaciones.length > 0 && (
              <div className="ai-observations">
                <strong>Observaciones clave</strong>
                <ul>
                  {respuesta.observaciones.map((observacion, index) => (
                    <li key={`${observacion}-${index}`}>{observacion}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="ai-recommendation">
              <strong>Recomendación</strong>
              <p>{respuesta.recomendacion}</p>
            </div>
          </div>
        </div>
      )}
      <form className="ai-form" onSubmit={submit}>
        <div className="ai-composer">
          <textarea
            value={pregunta}
            onChange={(event) => setPregunta(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe aquí tu pregunta...&#10;Por ejemplo: ¿cómo puedo ahorrar más este mes?"
            maxLength={2000}
            aria-label="Pregunta para el asesor financiero"
            rows={4}
          />
          <div className="ai-composer-footer">
            <span>{pregunta.length}/2000 · Ctrl + Enter para enviar</span>
            <button className="ai-clear" type="button" onClick={() => setPregunta("")} disabled={!pregunta}>
              Limpiar
            </button>
          </div>
        </div>
        <button className="primary-button ai-submit" type="submit" disabled={loading || !pregunta.trim()}>
          <span>{loading ? "Consultando..." : "Consultar al asesor"}</span><b>→</b>
        </button>
      </form>
    </section>
  );
}

export default AItoolspanel;