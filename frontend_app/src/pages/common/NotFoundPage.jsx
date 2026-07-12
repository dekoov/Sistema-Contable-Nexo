import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="display-3 fw-bold">404</div>
        <h1 className="h3">Página no encontrada</h1>
        <Link className="btn btn-primary" to="/dashboard">
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
