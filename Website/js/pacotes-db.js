/* =====================================================================
   BIBLIOTECA DE PACOTES - OCEANUN
   ---------------------------------------------------------------------
   Este é o ÚNICO lugar onde os pacotes são cadastrados.
   Todas as páginas (Início, Cruzeiros, Pacotes, Carrinho, busca e menu)
   leem os dados daqui. Para adicionar um pacote, copie um bloco { ... },
   cole no final da lista (separado por vírgula) e altere os valores.

   Campos:
     id         -> identificador único (sem espaços nem acentos)
     navio      -> nome do navio
     destino    -> local de destino
     embarque   -> porto de embarque/desembarque
     dataIda    -> data de ida  no formato "AAAA-MM-DD"
     dataVolta  -> data de volta no formato "AAAA-MM-DD"
     servicos   -> lista de serviços prestados pelo navio
     pessoas    -> quantas pessoas estão incluídas no pacote
     valor      -> preço em reais (número, sem "R$" e sem ponto de milhar)
     imagem     -> caminho da imagem a partir da pasta "Website/"
     descricao  -> texto curto exibido no carrinho/detalhes
     destaque   -> true = aparece em "Pacotes Imperdíveis" e no menu
     tags       -> palavras extras para a busca (opcional)
   ===================================================================== */

const PACOTES = [
    {
        id: "costa-diadema-dez26",
        navio: "Costa Diadema",
        destino: "Santos",
        embarque: "Santos",
        dataIda: "2026-12-10",
        dataVolta: "2026-12-13",
        servicos: ["All inclusive", "Serviço de quarto", "Piscina", "Shows"],
        pessoas: 2,
        valor: 2499, // TODO: confirmar valor
        imagem: "img/travel/Ocenun(1).png",
        descricao: "Viagem de cruzeiro para Santos, saindo do porto de Santos.",
        destaque: true,
        tags: ["nacional", "litoral", "fim de ano"]
    },
    {
        id: "msc-divina-fev27",
        navio: "MSC Divina",
        destino: "Santos",
        embarque: "Santos",
        dataIda: "2027-02-09",
        dataVolta: "2027-02-12",
        servicos: ["All inclusive", "Serviço de quarto", "Spa", "Cassino"],
        pessoas: 2,
        valor: 2599, // TODO: confirmar valor
        imagem: "img/travel/Ocenun(2).png",
        descricao: "Viagem de cruzeiro para Santos, saindo do porto de Santos.",
        destaque: true,
        tags: ["nacional", "litoral", "carnaval"]
    },
    {
        id: "msc-virtuosa-abr27",
        navio: "MSC Virtuosa",
        destino: "Santos",
        embarque: "Santos",
        dataIda: "2027-04-01",
        dataVolta: "2027-04-04",
        servicos: ["All inclusive", "Serviço de quarto"],
        pessoas: 3,
        valor: 2799,
        imagem: "img/travel/Ocenun(3).png",
        descricao: "Viagem de cruzeiro para Santos, saindo do porto de Santos.",
        destaque: true,
        tags: ["nacional", "litoral", "páscoa"]
    }
];
