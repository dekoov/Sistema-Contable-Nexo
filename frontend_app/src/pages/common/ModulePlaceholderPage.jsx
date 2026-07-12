export default function ModulePlaceholderPage({ title, description }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h2 className="h5">Vista preparada</h2>
          <p className="text-secondary mb-0">
            En la siguiente etapa se conectará esta pantalla con sus endpoints REST,
            validaciones, formulario, búsqueda y tabla.
          </p>
        </div>
      </div>
    </>
  );
}
