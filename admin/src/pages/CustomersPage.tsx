import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import apiClient from "@/services/api";

// Imports de UI e Ícones
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Crown, PlusCircle } from "lucide-react";
import { PhoneFormat } from "@/helper/phoneFormater"; // Seu helper de formatação

// Tipagens
interface Plan {
  _id: string;
  name: string;
}
interface Subscription {
  _id: string;
  plan: Plan;
  status: "active" | "expired" | "canceled";
}
interface Customer {
  _id: string;
  name: string;
  phone: string;
  subscriptions: Subscription[]; // O cliente agora tem um array de assinaturas
}
interface AdminOutletContext {
  barbershopId: string;
}

export function CustomersPage() {
  const { barbershopId } = useOutletContext<AdminOutletContext>();

  // Estados de dados
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Função para buscar todos os dados da página
  const fetchPageData = async () => {
    if (!barbershopId) return;
    setIsLoading(true);
    try {
      const [customersRes, plansRes] = await Promise.all([
        apiClient.get(`/api/barbershops/${barbershopId}/admin/customers`),
        apiClient.get(`/api/barbershops/${barbershopId}/plans`),
      ]);
      setCustomers(customersRes.data);
      setPlans(plansRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados da página.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [barbershopId]);

  // Funções para controlar o modal
  const handleOpenSubscribeModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedPlanId(""); // Reseta a seleção anterior
    setIsModalOpen(true);
  };

  // Função para atribuir o plano ao cliente
  const handleSubscribeCustomer = async () => {
    if (!selectedCustomer || !selectedPlanId) {
      toast.error("Por favor, selecione um plano.");
      return;
    }
    setIsSubscribing(true);
    try {
      await apiClient.post(
        `/api/barbershops/${barbershopId}/admin/customers/${selectedCustomer._id}/subscribe`,
        {
          planId: selectedPlanId,
        }
      );
      toast.success(`${selectedCustomer.name} agora tem um novo plano!`);
      setIsModalOpen(false);
      // Futuramente, aqui você pode recarregar a lista de clientes para atualizar o status do plano
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Falha ao atribuir o plano.");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clientes</h1>
        {/* Você pode adicionar um botão de "Novo Cliente" aqui no futuro */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Visualize todos os clientes que já realizaram agendamentos e
            gerencie seus planos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status do Plano</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length > 0 ? (
                customers.map((customer) => {
                  // --- 2. LÓGICA PARA EXIBIR O PLANO ATIVO ---
                  const activeSubscription = customer.subscriptions?.find(
                    (sub) => sub.status === "active"
                  );

                  return (
                    <TableRow key={customer._id}>
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell>{PhoneFormat(customer.phone)}</TableCell>
                      <TableCell>
                        {activeSubscription ? (
                          <span className="font-semibold text-green-600 flex items-center">
                            <Crown className="mr-2 h-4 w-4" />
                            {activeSubscription.plan.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Sem plano ativo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenSubscribeModal(customer)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Gerenciar Plano
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para Atribuir Plano */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Atribuir Plano para {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription>
              Selecione um dos planos cadastrados para vincular a este cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="planSelect">Planos Disponíveis</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger id="planSelect" className="mt-1">
                <SelectValue placeholder="Selecione um plano..." />
              </SelectTrigger>
              <SelectContent>
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum plano cadastrado.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubscribeCustomer}
              disabled={isSubscribing || !selectedPlanId}
            >
              {isSubscribing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Atribuição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
