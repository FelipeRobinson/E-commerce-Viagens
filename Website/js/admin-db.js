/* Dados do painel administrativo (localStorage).
   Pacotes e preços vêm de js/pacotes-db.js e as contas criadas no site viram clientes.
   Os clientes de exemplo abaixo são fictícios: seus CPFs têm dígitos verificadores
   inválidos de propósito, para não coincidirem com o CPF de uma pessoa real. */
const AdminDB = (() => {
    const CHAVE = 'oceanun-admin-dados';
    const META_INICIAL = 15000;
    const agora = new Date();
    const iso = d => d.toLocaleDateString('en-CA'); // AAAA-MM-DD no horário local
    const hoje = iso(agora);
    const somaDias = (base, n) => {
        const d = new Date(base + 'T12:00:00');
        d.setDate(d.getDate() + n);
        return iso(d);
    };
    const segunda = somaDias(hoje, -((agora.getDay() + 6) % 7));
    const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

    function dataNoMes(mesesAtras, dia) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - mesesAtras, 1, 12);
        d.setDate(mesesAtras === 0 ? Math.min(dia, agora.getDate()) : dia);
        return iso(d);
    }

    const CLIENTES_EXEMPLO = [
        ['Mariana Alves Prado', '231.884.560-17'], ['Rafael Nogueira Lima', '418.273.905-42'],
        ['Beatriz Campos Rocha', '506.129.738-63'], ['Thiago Ramos Pacheco', '672.340.981-25'],
        ['Camila Duarte Moreira', '789.512.046-38'], ['Lucas Ferraz Teixeira', '314.706.259-81'],
        ['Juliana Peixoto Reis', '925.183.467-04'], ['Eduardo Vieira Bastos', '147.629.830-56'],
        ['Fernanda Lopes Cardoso', '368.951.274-19'], ['Gustavo Mendes Farias', '580.437.162-93'],
        ['Patrícia Antunes Melo', '713.268.095-47'], ['Rodrigo Salles Freitas', '246.890.513-72'],
        ['Larissa Coelho Barros', '459.037.621-85'], ['André Toledo Macedo', '837.165.402-36']
    ];

    // [cliente, pacote, etapa, meses atrás, dia]
    const VENDAS_EXEMPLO = [
        [0, 0, 'concluido', 4, 6], [1, 1, 'concluido', 4, 14], [2, 0, 'concluido', 4, 23],
        [3, 2, 'concluido', 3, 9], [4, 0, 'concluido', 3, 20],
        [5, 1, 'concluido', 2, 4], [6, 2, 'concluido', 2, 13], [7, 0, 'concluido', 2, 25],
        [8, 1, 'concluido', 1, 7], [9, 2, 'concluido', 1, 15], [0, 2, 'concluido', 1, 22], [10, 0, 'concluido', 1, 27],
        [1, 0, 'concluido', 0, 2], [11, 1, 'concluido', 0, 4], [3, 1, 'concluido', 0, 6], [12, 2, 'concluido', 0, 8],
        [2, 1, 'pagamento', 0, 5], [13, 0, 'pagamento', 0, 7],
        [4, 2, 'negociacao', 0, 8], [5, 0, 'negociacao', 0, 8], [6, 1, 'negociacao', 0, 9]
    ];

    // [descrição, dia da semana (0 = segunda) ou 'hoje', cliente, lembrete]
    const TAREFAS_EXEMPLO = [
        ['Enviar proposta do MSC Divina', 'hoje', 6, false],
        ['Confirmar pagamento da reserva', 'hoje', 2, false],
        ['Enviar voucher do embarque', 0, 12, false],
        ['Retornar sobre cabine do MSC Virtuosa', 1, 4, false],
        ['Confirmar número de passageiros', 2, 13, false],
        ['Enviar orientações do porto de Santos', 2, 11, false],
        ['Ligar para fechar o Costa Diadema', 3, 5, false],
        ['Revisar documentos de embarque', 4, 3, false],
        ['Oferecer pacote de Páscoa no MSC Virtuosa', 11, 8, false],
        ['Pesquisa de satisfação pós-viagem', 18, 0, false],
        ['Avisar sobre embarque do Costa Diadema', 4, 7, true],
        ['Renovar contato para o Carnaval', 9, 9, true]
    ];

    function exemplo() {
        const pacotes = Catalogo.todos();
        const clientes = CLIENTES_EXEMPLO.map(([nome, cpf], i) => ({
            id: 'c' + i,
            nome,
            cpf: cpf.replace(/\D/g, ''),
            email: nome.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + '@exemplo.com',
            telefone: '1999000' + String(1000 + i * 37),
            origem: 'exemplo'
        }));
        const vendas = VENDAS_EXEMPLO.map(([cliente, pacote, etapa, meses, dia], i) => {
            const p = pacotes[pacote % pacotes.length];
            const data = dataNoMes(meses, dia);
            return { id: 'v' + i, clienteId: 'c' + cliente, pacoteId: p.id, valor: p.valor, etapa, data,
                     fechamento: etapa === 'concluido' ? data : null };
        });
        const tarefas = TAREFAS_EXEMPLO.map(([descricao, dia, cliente, lembrete], i) => ({
            id: 't' + i,
            descricao,
            prazo: dia === 'hoje' ? hoje : somaDias(segunda, dia),
            clienteId: 'c' + cliente,
            lembrete,
            feita: false
        }));
        return { clientes, vendas, tarefas, meta: META_INICIAL };
    }

    function carregar() {
        let d = null;
        try { d = JSON.parse(localStorage.getItem(CHAVE)); } catch {}
        d = d || exemplo();
        Catalogo.contas().forEach(c => {
            if (!d.clientes.some(x => x.cpf === c.cpf)) {
                d.clientes.push({ id: novoId(), nome: c.nome, cpf: c.cpf, email: c.email, telefone: c.telefone, origem: 'site' });
            }
        });
        return d;
    }

    // Duas dúvidas de exemplo para a aba Mensagens (só entram uma vez)
    function semearMensagens(d) {
        if (d.mensagensSemeadas) return;
        const ontem = somaDias(hoje, -1) + 'T14:20:00';
        const conversa = (i, mensagens) => {
            const c = d.clientes.find(x => x.id === 'c' + i);
            return c && { id: 'exemplo:' + c.id, nome: c.nome, email: c.email, origem: 'exemplo',
                          mensagens, lidaAdmin: mensagens[mensagens.length - 1].de === 'admin' ? mensagens[mensagens.length - 1].em : '', lidaCliente: '' };
        };
        Catalogo.adicionarConversas([
            conversa(6, [
                { de: 'cliente', texto: 'Olá! O pacote do MSC Divina inclui as bebidas?', em: ontem },
                { de: 'admin', texto: 'Oi, Juliana! Inclui sim: o pacote é all inclusive e tem serviço de quarto, spa e cassino.', em: ontem.replace('14:20', '15:05') }
            ]),
            conversa(13, [
                { de: 'cliente', texto: 'Posso levar mais uma pessoa no Costa Diadema? Vi que o pacote é para 2.', em: hoje + 'T09:10:00' }
            ])
        ].filter(Boolean));
        d.mensagensSemeadas = true;
    }

    const dados = carregar();
    semearMensagens(dados);
    function salvar() {
        try { localStorage.setItem(CHAVE, JSON.stringify(dados)); return true; } catch { return false; }
    }
    salvar();

    function mudarEtapa(venda, etapa) {
        venda.etapa = etapa;
        venda.fechamento = etapa === 'concluido' ? (venda.fechamento || hoje) : null;
    }

    function excluirCliente(id) {
        dados.clientes = dados.clientes.filter(c => c.id !== id);
        dados.vendas = dados.vendas.filter(v => v.clienteId !== id);
        dados.tarefas = dados.tarefas.filter(t => t.clienteId !== id);
    }

    const cliente = id => dados.clientes.find(c => c.id === id);
    const chaveMes = meses => dataNoMes(meses, 1).slice(0, 7);
    const eDoMesAtual = v => v.fechamento && v.fechamento.slice(0, 7) === chaveMes(0);

    function metricas() {
        const concluidas = dados.vendas.filter(v => v.etapa === 'concluido' && v.fechamento);
        const soma = lista => lista.reduce((s, v) => s + v.valor, 0);
        const doMes = chave => concluidas.filter(v => v.fechamento.slice(0, 7) === chave);
        const serie = [4, 3, 2, 1, 0].map(m => {
            const rotulo = new Date(chaveMes(m) + '-15T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
            return { rotulo: rotulo[0].toUpperCase() + rotulo.slice(1), valor: soma(doMes(chaveMes(m))) };
        });
        const atual = serie[4].valor;
        const anterior = serie[3].valor;
        const quantidade = doMes(chaveMes(0)).length;
        return {
            serie, atual, quantidade,
            variacao: anterior ? (atual - anterior) / anterior * 100 : null,
            ticket: quantidade ? atual / quantidade : 0,
            aReceber: soma(dados.vendas.filter(v => v.etapa === 'pagamento')),
            meta: dados.meta,
            porPacote: Catalogo.todos().map(p => ({ navio: p.navio, valor: soma(concluidas.filter(v => v.pacoteId === p.id)) }))
        };
    }

    return { dados, salvar, hoje, segunda, somaDias, novoId, mudarEtapa, excluirCliente, cliente, eDoMesAtual, metricas };
})();
