interface AppFooterProps {
  instagram?: string | null;
  whatsappNumber?: string | null; // Ex: "48991234567" ou "(48) 99123-4567"
  barbershopName?: string | null;
}

// Função auxiliar para formatar o link do WhatsApp
const formatWhatsAppLink = (number?: string | null): string | null => {
  if (!number) return null;

  // Remove todos os caracteres não numéricos
  const digitsOnly = number.replace(/\D/g, "");

  // Garante que o número não esteja vazio após a limpeza
  if (!digitsOnly) return null;

  // Adiciona o código do país (55 para Brasil) se não estiver presente e for um número brasileiro típico
  // (10 ou 11 dígitos sem o 55)
  if ((digitsOnly.length === 10 || digitsOnly.length === 11) && !digitsOnly.startsWith("55")) {
    return `https://wa.me/55${digitsOnly}`;
  }
  // Se já começa com 55 e tem o tamanho correto
  if (digitsOnly.startsWith("55") && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
    return `https://wa.me/${digitsOnly}`;
  }
  // Fallback para outros formatos (pode não funcionar para todos os países sem o código do país)
  // Ou se o número já estiver no formato internacional completo
  if (digitsOnly.length >= 10) {
    // Uma checagem genérica
    return `https://wa.me/${digitsOnly}`;
  }

  return null; // Retorna null se não conseguir formatar um link válido
};

export function SocialLinks({
  instagram,
  whatsappNumber,
  barbershopName = "Sua Barbearia de Confiança", // Nome padrão
}: AppFooterProps) {
  const whatsappLink = formatWhatsAppLink(whatsappNumber);

  return (
    <footer className="bg-gray-100 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-6 text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-6 flex justify-between items-center">
        <p className="text-xs text-neutral-700">
          Agendamentos por{" "}
          <a
            href="https://seusistema.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-var(--loja-theme-color) dark:var(--loja-theme-color)/80 font-medium"
          >
            BarbeariaAgendamento
          </a>
        </p>

        {(instagram || whatsappLink) && (
          <div className="flex justify-center items-center gap-4">
            {instagram && (
              <a
                href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram de ${barbershopName}`}
                className="text-[#404040] transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            )}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp de ${barbershopName}`}
                className="hover:text-[var(--loja-theme-color)]/70 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24px"
                  height="24px"
                  fill="#404040"
                  // stroke="var(--loja-theme-color)"
                >
                  <path d="M 12.011719 2 C 6.5057187 2 2.0234844 6.478375 2.0214844 11.984375 C 2.0204844 13.744375 2.4814687 15.462563 3.3554688 16.976562 L 2 22 L 7.2324219 20.763672 C 8.6914219 21.559672 10.333859 21.977516 12.005859 21.978516 L 12.009766 21.978516 C 17.514766 21.978516 21.995047 17.499141 21.998047 11.994141 C 22.000047 9.3251406 20.962172 6.8157344 19.076172 4.9277344 C 17.190172 3.0407344 14.683719 2.001 12.011719 2 z M 12.009766 4 C 14.145766 4.001 16.153109 4.8337969 17.662109 6.3417969 C 19.171109 7.8517969 20.000047 9.8581875 19.998047 11.992188 C 19.996047 16.396187 16.413812 19.978516 12.007812 19.978516 C 10.674812 19.977516 9.3544062 19.642812 8.1914062 19.007812 L 7.5175781 18.640625 L 6.7734375 18.816406 L 4.8046875 19.28125 L 5.2851562 17.496094 L 5.5019531 16.695312 L 5.0878906 15.976562 C 4.3898906 14.768562 4.0204844 13.387375 4.0214844 11.984375 C 4.0234844 7.582375 7.6067656 4 12.009766 4 z M 8.4765625 7.375 C 8.3095625 7.375 8.0395469 7.4375 7.8105469 7.6875 C 7.5815469 7.9365 6.9355469 8.5395781 6.9355469 9.7675781 C 6.9355469 10.995578 7.8300781 12.182609 7.9550781 12.349609 C 8.0790781 12.515609 9.68175 15.115234 12.21875 16.115234 C 14.32675 16.946234 14.754891 16.782234 15.212891 16.740234 C 15.670891 16.699234 16.690438 16.137687 16.898438 15.554688 C 17.106437 14.971687 17.106922 14.470187 17.044922 14.367188 C 16.982922 14.263188 16.816406 14.201172 16.566406 14.076172 C 16.317406 13.951172 15.090328 13.348625 14.861328 13.265625 C 14.632328 13.182625 14.464828 13.140625 14.298828 13.390625 C 14.132828 13.640625 13.655766 14.201187 13.509766 14.367188 C 13.363766 14.534188 13.21875 14.556641 12.96875 14.431641 C 12.71875 14.305641 11.914938 14.041406 10.960938 13.191406 C 10.218937 12.530406 9.7182656 11.714844 9.5722656 11.464844 C 9.4272656 11.215844 9.5585938 11.079078 9.6835938 10.955078 C 9.7955938 10.843078 9.9316406 10.663578 10.056641 10.517578 C 10.180641 10.371578 10.223641 10.267562 10.306641 10.101562 C 10.389641 9.9355625 10.347156 9.7890625 10.285156 9.6640625 C 10.223156 9.5390625 9.737625 8.3065 9.515625 7.8125 C 9.328625 7.3975 9.131125 7.3878594 8.953125 7.3808594 C 8.808125 7.3748594 8.6425625 7.375 8.4765625 7.375 z" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* <p className="text-sm text-gray-600 dark:text-gray-400">
          &copy; {currentYear} {barbershopName || "Barbearia Exemplo"}. Todos os direitos reservados.
        </p> */}
      </div>
    </footer>
  );
}
