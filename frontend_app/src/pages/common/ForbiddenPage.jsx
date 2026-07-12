import { Link } from "react-router";

export default function ForbiddenPage() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="display-3 fw-bold text-danger">403</div>
        <h1 className="h3">Acceso no autorizado</h1>
        <p className="text-secondary">Tu rol no permite abrir esta pantalla.</p>
        <Link className="btn btn-primary" to="/dashboard">
          Regresar
        </Link>
      </div>
    </div>
  );
}
