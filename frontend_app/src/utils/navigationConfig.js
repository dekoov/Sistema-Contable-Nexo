import { 
  FileText, Box, CreditCard, Settings, 
  User, MapPin, Receipt, BarChart2, Package, Move, ClipboardList, PieChart, 
  UserPlus, Wallet, DollarSign, FileBarChart, Database, Users 
} from "lucide-react";

export const NAVIGATION_CONFIG = {
  "Facturación": {
    color: "#3b82f6",
    icon: FileText,
    items: {
      "Clientes": { icon: User, type: "formulario", desc: "Gestión de clientes y contactos" },
      "Ciudades": { icon: MapPin, type: "formulario", desc: "Ubicaciones de entrega" },
      "Facturas": { icon: Receipt, type: "formulario", desc: "Registro y edición de facturas" },
      "Ventas por ciudad": { icon: BarChart2, type: "reporte", desc: "Totales facturados por ciudad" },
      "Matriz por cliente": { icon: BarChart2, type: "reporte", desc: "Análisis de ventas por cliente" },
    }
  },
  "Inventario": {
    color: "#22c55e",
    icon: Box,
    items: {
      "Artículos": { icon: Package, type: "formulario", desc: "Gestión de stock de productos" },
      "Tipos de movimiento": { icon: Move, type: "formulario", desc: "Definición de movimientos" },
      "Comprobantes": { icon: ClipboardList, type: "formulario", desc: "Ingresos y egresos" },
      "Reporte de inventario": { icon: PieChart, type: "reporte", desc: "Existencias y movimientos" },
    }
  },
  "Cuentas por cobrar": {
    color: "#f59e0b",
    icon: CreditCard,
    items: {
      "Cobradores": { icon: UserPlus, type: "formulario", desc: "Gestión de cobradores" },
      "Formas de pago": { icon: Wallet, type: "formulario", desc: "Métodos de cobro aceptados" },
      "Pagos": { icon: DollarSign, type: "formulario", desc: "Registro de pagos recibidos" },
      "Estado de cuenta": { icon: FileBarChart, type: "reporte", desc: "Saldo pendiente por cliente" },
      "Matriz de recaudación": { icon: FileBarChart, type: "reporte", desc: "Análisis de recaudación" },
    }
  },
  "Integración": {
    color: "#8b5cf6",
    icon: Settings,
    items: {
      "Cola JMS": { icon: Database, type: "sistema", desc: "Estado de integración" },
    }
  },
  "Administración": {
    color: "#8b5cf6",
    icon: Users,
    items: {
      "Usuarios": { icon: Users, type: "sistema", desc: "Gestión de accesos" },
    }
  }
};
