import { useCallback, useEffect, useState } from "react";
import { getServerInstance } from "../../api/systemApi";

export default function ServerInstanceBadge() {
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getServerInstance();
      setInstance({
        name: data.instance ?? data.node ?? data.server ?? "Nodo desconocido",
        host: data.host ?? data.hostname ?? "",
        port: data.port ?? data.serverPort ?? "N/D",
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "No fue posible consultar el nodo de aplicación.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="server-instance">
      <div>
        <span className={`status-dot ${error ? "status-error" : "status-ok"}`} />
        <strong>
          {instance ? `${instance.name} | Puerto ${instance.port}` : "Nodo sin consultar"}
        </strong>
        {instance?.host && <small className="d-block text-secondary">{instance.host}</small>}
        {error && <small className="d-block text-danger">{error}</small>}
      </div>

      <button
        className="btn btn-sm btn-outline-primary"
        onClick={refresh}
        disabled={loading}
        title="Consultar nuevamente para evidenciar el balanceo"
      >
        {loading ? "Consultando..." : "Actualizar nodo"}
      </button>
    </div>
  );
}
