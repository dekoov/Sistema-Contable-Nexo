import { Link } from "react-router";
import { useAuth } from "../../auth/AuthContext";
import { menuSections } from "../../routes/menuConfig";

export default function DashboardPage() {
  const { user } = useAuth();

  const cards = menuSections.flatMap((section) =>
    section.items
      .filter((item) => !item.roles || item.roles.includes(user?.role))
      .map((item) => ({ ...item, section: section.title })),
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Panel principal</h1>
          <p>
            Bienvenido, {user?.name || user?.username}. Selecciona una operación.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {cards.map((card) => (
          <div className="col-12 col-md-6 col-xl-4" key={card.path}>
            <Link className="module-card" to={card.path}>
              <small>{card.section}</small>
              <h2>{card.label}</h2>
              <span>Abrir módulo →</span>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
