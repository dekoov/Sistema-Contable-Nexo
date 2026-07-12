export default function LoadingScreen({ message = "Cargando..." }) {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="text-secondary mb-0">{message}</p>
      </div>
    </div>
  );
}
