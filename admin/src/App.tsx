import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";

import { BarbeariaConfigPage } from "./pages/BarbeariaPage";
import { ServicesPage } from "./pages/ServicesPage";
import { BarberPage } from "./pages/BarberPage";
import { AgendamentosPage } from "./pages/AgendamentosPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { SetPasswordPage } from "./pages/SetPasswordPage.tsx";
import { useAuth } from "./contexts/AuthContext.tsx";
import CommissionsPage from "./pages/CommissionsPage.tsx";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.tsx";
import { AbsencesPage } from "./pages/AbsencesPage.tsx";
import { NewBookingPage } from "./pages/NewBookingPage.tsx";
import { PlansPage } from "./pages/PlansPage.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/configurar-senha/:token" element={<SetPasswordPage />} />
        <Route path="/resetar-senha/:token" element={<ResetPasswordPage />} />

        {/* Envolve todas as rotas do painel com uma verificação básica de login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/:barbershopSlug" element={<AdminLayout />}>
            <Route index element={<DefaultPageBasedOnRole />} />

            <Route path="agendamentos" element={<AgendamentosPage />} />

            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="metricas" element={<DashboardPage />} />
              <Route path="configuracoes" element={<BarbeariaConfigPage />} />
              <Route path="servicos" element={<ServicesPage />} />
              <Route path="funcionarios" element={<BarberPage />} />
              <Route path="comissoes" element={<CommissionsPage />} />
              <Route path="agendamentos/novo-agendamento" element={<NewBookingPage />} />
              <Route path="folgas" element={<AbsencesPage />} />
              <Route path="planos" element={<PlansPage />} />
            </Route>

            <Route path="*" element={<>nao encontrado</>} />
          </Route>

          <Route path="/" element={null} />
        </Route>

        <Route path="*" element={<div>Erro 404 - Página Não Encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}

// Componente auxiliar para redirecionar com base na função do usuário
function DefaultPageBasedOnRole() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    // Admins são redirecionados para o dashboard (métricas)
    return <Navigate to="metricas" replace />;
  }

  // Barbeiros (e qualquer outra função) são redirecionados para os agendamentos
  return <Navigate to="agendamentos" replace />;
}
