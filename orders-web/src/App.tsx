import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { ApiPlaygroundPage } from "./pages/ApiPlaygroundPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LiveMessagesPage } from "./pages/LiveMessagesPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:uuid" element={<OrderDetailPage />} />
        <Route path="/live" element={<LiveMessagesPage />} />
        <Route path="/messages" element={<Navigate to="/live" replace />} />
        <Route path="/mensagens" element={<Navigate to="/live" replace />} />
        <Route path="/mensagens-ao-vivo" element={<Navigate to="/live" replace />} />
        <Route path="/playground" element={<ApiPlaygroundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
