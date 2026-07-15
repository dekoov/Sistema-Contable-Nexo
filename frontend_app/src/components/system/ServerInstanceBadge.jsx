import { useCallback, useEffect, useState } from "react";
import { getServerInstance } from "../../api/systemApi";
import { RefreshCw, Server, AlertCircle, CheckCircle } from "lucide-react";

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
    <div className="d-flex align-items-center bg-light border px-3 py-1 rounded-pill gap-2">
      <div style={{ width: 8, height: 8 }} className={`rounded-circle ${error ? "bg-danger" : "bg-success"}`} />
      
      <div className="d-flex flex-column" style={{ fontSize: '0.75rem' }}>
        <span className="fw-bold text-dark">
          {instance ? `${instance.name} : ${instance.port}` : "Nodo offline"}
        </span>
        {instance?.host && <span className="text-muted" style={{ fontSize: '0.65rem' }}>{instance.host}</span>}
      </div>

      <button
        className="btn btn-link btn-sm p-0 ms-2 text-dark"
        onClick={refresh}
        disabled={loading}
        title="Actualizar estado del nodo"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
