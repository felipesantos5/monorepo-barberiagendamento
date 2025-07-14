import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useOutletContext } from "react-router-dom";

// Importações de componentes ShadCN/UI que usaremos
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2, PlusCircle, Download } from "lucide-react"; // Ícones
import { PhoneFormat } from "@/helper/phoneFormater";
import { CepFormat } from "@/helper/cepFormarter";
import { ImageUploader } from "./ImageUploader";
import apiClient from "@/services/api";
import { ColorSelector } from "@/components/themeColorPicker";
import { API_BASE_URL } from "@/config/BackendUrl";

// Tipos para os dados da barbearia (espelhando seus schemas do backend)
interface Address {
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento?: string;
}

interface WorkingHour {
  _id?: string; // Mongoose pode adicionar _id a subdocumentos
  day: string;
  start: string;
  end: string;
}

interface BarbershopData {
  _id: string;
  name: string;
  description: string;
  address: Address;
  logoUrl?: string;
  contact: string;
  slug: string;
  instagram: string;
  workingHours: WorkingHour[];
  themeColor: string;
  LogoBackgroundColor: string;
  qrcode: string;
}

// Estado inicial para o formulário (parcial, pois será preenchido após o fetch)
const initialBarbershopState: Partial<BarbershopData> = {
  name: "",
  description: "",
  address: {
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    rua: "",
    numero: "",
    complemento: "",
  },
  logoUrl: "",
  themeColor: "",
  LogoBackgroundColor: "",
  contact: "",
  instagram: "",
  slug: "",
  qrcode: "",
  workingHours: [],
};

const daysOfWeek = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

interface AdminOutletContext {
  barbershopId: string;
  barbershopName: string;
}

export function BarbeariaConfigPage() {
  const { barbershopId } = useOutletContext<AdminOutletContext>();

  const [formData, setFormData] = useState<Partial<BarbershopData>>(initialBarbershopState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false); // Novo estado para upload
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (!barbershopId) {
      setError("ID da barbearia não fornecido.");
      setIsLoading(false);
      return;
    }

    const fetchBarbershopData = async () => {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const response = await apiClient.get(`${API_BASE_URL}/barbershops/${barbershopId}`);
        setFormData(response.data);

        const url = `${API_BASE_URL}/barbershops/${barbershopId}/qrcode`;
        setQrCodeUrl(url);
      } catch (err) {
        console.error("Erro ao buscar dados da barbearia:", err);
        setError("Falha ao carregar os dados da barbearia. Verifique o console.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBarbershopData();
  }, [barbershopId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digitsOnly = inputValue.replace(/\D/g, ""); // Remove todos os não dígitos
    setFormData((prev) => ({
      ...prev,
      contact: digitsOnly.slice(0, 11), // Salva apenas os dígitos e limita a 11
    }));
  };

  const handleCepChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digitsOnly = inputValue.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      address: {
        ...(prev?.address as Address), // Assume que address já foi inicializado
        cep: digitsOnly.slice(0, 8), // Salva apenas os dígitos e limita a 8
      },
    }));
  };

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: { ...prev?.address, [name]: value } as Address,
    }));
  };

  const handleThemeColorChange = (newColor: string) => {
    setFormData((prev) => ({
      ...prev,
      themeColor: newColor,
    }));
  };

  const handleWorkingHourChange = (index: number, field: keyof WorkingHour, value: string) => {
    setFormData((prev) => {
      const updatedWorkingHours = [...(prev?.workingHours || [])];
      if (updatedWorkingHours[index]) {
        (updatedWorkingHours[index] as any)[field] = value;
      }
      return { ...prev, workingHours: updatedWorkingHours };
    });
  };

  const addWorkingHour = () => {
    setFormData((prev) => ({
      ...prev,
      workingHours: [...(prev?.workingHours || []), { day: "Segunda-feira", start: "09:00", end: "18:00" }],
    }));
  };

  const removeWorkingHour = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workingHours: (prev?.workingHours || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Usaremos isLoading para o processo geral de salvar
    setError(null);
    setSuccessMessage(null);

    if (!barbershopId) {
      setError("ID da barbearia não está definido.");
      setIsLoading(false);
      return;
    }

    let finalLogoUrl = formData.logoUrl; // Começa com a URL existente ou a que foi carregada

    // 1. Se um novo arquivo de logo foi selecionado, faça o upload primeiro
    if (logoFile) {
      setIsUploading(true); // Indica que o upload está em progresso
      const imageUploadData = new FormData();
      imageUploadData.append("logoFile", logoFile); // 'logoFile' deve corresponder ao esperado pelo multer no backend

      try {
        const uploadResponse = await apiClient.post(
          `${API_BASE_URL}/api/upload/logo`, // Rota de upload no backend
          imageUploadData
        );
        finalLogoUrl = uploadResponse.data.logoUrl; // Pega a URL retornada pelo backend
        setLogoFile(null); // Limpa o arquivo do estado após o upload
      } catch (uploadError: any) {
        console.error("Erro no upload da logo:", uploadError);
        setError(uploadError.response?.data?.error || "Falha ao fazer upload da nova logo. As outras alterações não foram salvas.");
        setIsUploading(false);
        setIsLoading(false);
        return; // Interrompe o processo se o upload falhar
      } finally {
        setIsUploading(false);
      }
    }

    // 2. Agora, prepare os dados da barbearia para atualização, incluindo a finalLogoUrl
    // Remove _id e outros campos não editáveis do formData antes de enviar para o PUT
    const { _id, createdAt, updatedAt, ...dataToUpdateClean } = formData as any;

    const payload = {
      ...dataToUpdateClean,
      logoUrl: finalLogoUrl, // Usa a nova URL se um arquivo foi upado, senão a que já estava
    };

    try {
      // 3. Envie os dados atualizados da barbearia (incluindo a nova logoUrl se houver)
      const updateResponse = await apiClient.put(`${API_BASE_URL}/barbershops/${barbershopId}`, payload);
      setSuccessMessage("Dados da barbearia atualizados com sucesso!");
      setFormData(updateResponse.data); // Atualiza o formData com os dados retornados (incluindo a nova logoUrl)
    } catch (err: any) {
      console.error("Erro ao atualizar barbearia:", err);
      setError(err.response?.data?.error || "Falha ao atualizar dados da barbearia.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!qrCodeUrl) return;

    try {
      // Baixa a imagem como um "blob" (um tipo de dado binário)
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();

      // Cria uma URL temporária no navegador para este blob
      const url = window.URL.createObjectURL(blob);

      // Cria um elemento de link <a> invisível
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `qrcode-barbearia-${barbershopId}.png`); // Define o nome do arquivo

      // Adiciona o link ao corpo do documento e o "clica" programaticamente
      document.body.appendChild(link);
      link.click();

      // Limpa e remove o link temporário
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar o QR Code:", error);
      // Adicione um toast.error aqui se quiser
    }
  };

  if (isLoading && !formData?.name) return <p className="text-center p-10">Carregando configurações...</p>;
  if (error && !formData?.name) return <p className="text-center p-10 text-red-600">{error}</p>;
  if (!formData?.name && !isLoading) return <p className="text-center p-10">Nenhuma configuração encontrada para esta barbearia.</p>;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Configurações da Barbearia</CardTitle>
        <CardDescription>Edite os detalhes do seu estabelecimento.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Detalhes Básicos */}

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" value={formData.name || ""} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" className="h-40" value={formData.description || ""} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contato (WhatsApp)</Label>
              <Input
                id="contact"
                name="contact"
                type="tel" // Tipo semântico para telefone
                value={PhoneFormat(formData.contact || "")} // Mostra o valor formatado
                onChange={handleContactChange} // Usa o handler específico para salvar só os dígitos
                maxLength={15} // (XX) XXXXX-XXXX são 15 caracteres
                placeholder="(XX) XXXXX-XXXX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Instagram</Label>
              <Input id="instagram" name="instagram" value={formData.instagram || ""} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" name="slug" value={formData.slug || ""} onChange={handleInputChange} required />
            <p className="text-xs text-gray-500">Ex: nome-da-barbearia (usado na URL da sua página)</p>
          </div>

          <div className="space-y-2">
            <ImageUploader
              label="Logo da Barbearia"
              initialImageUrl={formData.logoUrl || null}
              onFileSelect={(file) => {
                setLogoFile(file);
              }}
              aspectRatio="square"
            />
            {isUploading && <p className="text-sm text-blue-600 mt-2">Enviando logo...</p>}
          </div>

          <div className="space-y-2">
            <ColorSelector
              label="Cor principal"
              color={formData.themeColor || "#D10000"} // Usa a cor do formData ou um fallback
              onChange={handleThemeColorChange}
            />
            <p className="text-xs text-muted-foreground">Esta cor será usada em botões e destaques na página de agendamento da sua barbearia.</p>
          </div>

          <CardHeader className="px-0!">
            <CardTitle>QR Code para Agendamento</CardTitle>
            <CardDescription>Use este QR Code em materiais de divulgação para que seus clientes possam agendar facilmente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {qrCodeUrl ? (
              <>
                <div className="p-4 bg-white rounded-lg border">
                  <img src={qrCodeUrl} alt="QR Code de Agendamento" width={200} height={200} />
                </div>

                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar QR Code
                </Button>
              </>
            ) : (
              <p>Carregando QR Code...</p>
            )}
          </CardContent>

          {/* Endereço */}
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-1">Endereço</legend>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    name="cep"
                    type="text" // Ou "tel" se preferir o teclado numérico, mas "text" é comum para CEP com máscara
                    value={CepFormat(formData.address?.cep || "")} // Mostra o valor formatado
                    onChange={handleCepChange} // Usa o handler específico
                    maxLength={9} // XXXXX-XXX são 9 caracteres
                    minLength={9} // XXXXX-XXX são 9 caracteres
                    placeholder="00000-000"
                    required // Se o CEP for obrigatório
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rua">Rua</Label>
                  <Input id="rua" name="rua" value={formData.address?.rua || ""} onChange={handleAddressChange} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" name="numero" value={formData.address?.numero || ""} onChange={handleAddressChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" name="bairro" value={formData.address?.bairro || ""} onChange={handleAddressChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" name="complemento" value={formData.address?.complemento || ""} onChange={handleAddressChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" name="cidade" value={formData.address?.cidade || ""} onChange={handleAddressChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado (UF)</Label>
                  <Input id="estado" name="estado" maxLength={2} value={formData.address?.estado || ""} onChange={handleAddressChange} required />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Horários de Funcionamento */}
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-1">Horários de Funcionamento</legend>
            <div className="space-y-4 mt-2">
              {(formData.workingHours || []).map((wh, index) => (
                <div
                  key={wh._id || index}
                  // ✅ LÓGICA DE RESPONSIVIDADE AQUI
                  className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-end gap-3 p-3 border rounded-lg bg-gray-50/50"
                >
                  {/* Seletor do Dia */}
                  <div className="md:col-span-1">
                    <Label htmlFor={`wh-day-${index}`} className="text-xs font-medium text-gray-600">
                      Dia da Semana
                    </Label>
                    <Select value={wh.day} onValueChange={(value) => handleWorkingHourChange(index, "day", value)}>
                      <SelectTrigger id={`wh-day-${index}`} className="mt-1 w-full md:w-40">
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Container para horários e botão de remover */}
                  <div className="flex flex-col items-end gap-2 md:flex-row">
                    {/* Input de Início */}
                    <div className="w-full">
                      <Label htmlFor={`wh-start-${index}`} className="text-xs font-medium text-gray-600">
                        Início
                      </Label>
                      <Input
                        id={`wh-start-${index}`}
                        type="time"
                        className="mt-1"
                        value={wh.start}
                        onChange={(e) => handleWorkingHourChange(index, "start", e.target.value)}
                      />
                    </div>

                    {/* Input de Fim */}
                    <div className="w-full">
                      <Label htmlFor={`wh-end-${index}`} className="text-xs font-medium text-gray-600">
                        Fim
                      </Label>
                      <Input
                        id={`wh-end-${index}`}
                        type="time"
                        className="mt-1"
                        value={wh.end}
                        onChange={(e) => handleWorkingHourChange(index, "end", e.target.value)}
                      />
                    </div>

                    {/* Botão de Remover */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeWorkingHour(index)}
                      aria-label="Remover este horário"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addWorkingHour} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Horário
              </Button>
            </div>
          </fieldset>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isLoading || isUploading} className="cursor-pointer mt-4">
            {isLoading ? (isUploading ? "Enviando Imagem..." : "Salvando...") : "Salvar Configurações"}
          </Button>
        </CardFooter>
        <div className="px-6 mt-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
        </div>
      </form>
    </Card>
  );
}
