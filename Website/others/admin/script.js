// Painel administrativo: Vendas, Clientes, Tarefas e lembretes, Faturamento (dados em js/admin-db.js)
const db = AdminDB.dados;
const painel = document.getElementById('painel');
const busca = document.getElementById('busca');
const dialogo = document.getElementById('dialogo');
const dica = document.getElementById('dica');
const novo = document.getElementById('admin-novo');
const { moeda } = Catalogo;

const ETAPAS = { negociacao: 'Negociação', pagamento: 'Pagamento', concluido: 'Concluído' };
const ORDEM_ETAPAS = Object.keys(ETAPAS);
const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const CORES = ['var(--serie-1)', 'var(--serie-2)', 'var(--serie-3)'];
const ordenacao = { campo: 'nome', direcao: 1 };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalizar = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const combina = (...textos) => normalizar(textos.join(' ')).includes(normalizar(busca.value.trim()));
const nomeCliente = id => AdminDB.cliente(id)?.nome || 'Cliente removido';
const nomeNavio = id => Catalogo.porId(id)?.navio || 'Pacote removido';
const formatarCpf = c => c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
const formatarTelefone = t => t.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
const pendentes = () => db.tarefas.filter(t => !t.feita);
const ultimaVenda = id => db.vendas.filter(v => v.clienteId === id).sort((a, b) => b.data.localeCompare(a.data))[0];
const opcoesClientes = () => [...db.clientes].sort((a, b) => a.nome.localeCompare(b.nome)).map(c => [c.id, c.nome]);

function persistir() {
    if (!AdminDB.salvar()) alert('Não foi possível salvar neste navegador.');
    desenhar();
}

// ---------- Formulário genérico ----------
function abrirFormulario({ titulo, campos, valores = {}, aoSalvar, aoExcluir }) {
    const htmlCampo = c => {
        const v = valores[c.nome] ?? '';
        let controle;
        if (c.tipo === 'select') {
            controle = `<select id="f-${c.nome}" name="${c.nome}">${c.opcoes.map(([valor, texto]) =>
                `<option value="${esc(valor)}"${valor === v ? ' selected' : ''}>${esc(texto)}</option>`).join('')}</select>`;
        } else if (c.tipo === 'checkbox') {
            return `<label class="campo-check"><input type="checkbox" name="${c.nome}"${v ? ' checked' : ''}> ${esc(c.rotulo)}</label>`;
        } else {
            controle = `<input id="f-${c.nome}" name="${c.nome}" type="${c.tipo || 'text'}" value="${esc(v)}">`;
        }
        return `<label for="f-${c.nome}">${esc(c.rotulo)}</label>${controle}<p class="erro" data-erro="${c.nome}"></p>`;
    };
    dialogo.innerHTML = `
        <form novalidate>
            <h2 id="dialogo-titulo">${esc(titulo)}</h2>
            ${campos.map(htmlCampo).join('')}
            <div class="dialogo-botoes">
                <button type="submit" class="perfil-btn">Salvar</button>
                <button type="button" class="perfil-btn secundario" data-fechar>Cancelar</button>
                ${aoExcluir ? '<button type="button" class="perfil-btn perigo" data-excluir>Excluir</button>' : ''}
            </div>
        </form>`;
    const form = dialogo.querySelector('form');
    form.addEventListener('submit', e => {
        e.preventDefault();
        const dados = Object.fromEntries(new FormData(form));
        const erros = aoSalvar(dados) || {};
        dialogo.querySelectorAll('[data-erro]').forEach(p => { p.textContent = erros[p.dataset.erro] || ''; });
        if (!Object.keys(erros).length) {
            dialogo.close();
            persistir();
        }
    });
    dialogo.querySelector('[data-fechar]').addEventListener('click', () => dialogo.close());
    dialogo.querySelector('[data-excluir]')?.addEventListener('click', () => {
        if (!confirm('Excluir este registro?')) return;
        aoExcluir();
        dialogo.close();
        persistir();
    });
    dialogo.showModal();
}

// ---------- Vendas ----------
function formularioVenda(venda) {
    const pacotes = Catalogo.todos().map(p => [p.id, `${p.navio} - ${moeda(p.valor)}`]);
    if (!db.clientes.length) { alert('Cadastre um cliente antes de registrar uma venda.'); return; }
    abrirFormulario({
        titulo: venda ? 'Alterar venda' : 'Nova venda',
        campos: [
            { nome: 'clienteId', rotulo: 'Cliente', tipo: 'select', opcoes: opcoesClientes() },
            { nome: 'pacoteId', rotulo: 'Pacote', tipo: 'select', opcoes: pacotes },
            { nome: 'etapa', rotulo: 'Etapa', tipo: 'select', opcoes: Object.entries(ETAPAS) }
        ],
        valores: venda || { etapa: 'negociacao' },
        aoSalvar: v => {
            const alvo = venda || { id: AdminDB.novoId(), data: AdminDB.hoje, fechamento: null };
            if (alvo.pacoteId !== v.pacoteId) alvo.valor = Catalogo.porId(v.pacoteId).valor;
            alvo.clienteId = v.clienteId;
            alvo.pacoteId = v.pacoteId;
            AdminDB.mudarEtapa(alvo, v.etapa);
            if (!venda) db.vendas.push(alvo);
        },
        aoExcluir: venda && (() => { db.vendas = db.vendas.filter(x => x !== venda); })
    });
}

const ICONES_ETAPA = { negociacao: 'fa-comments-dollar', pagamento: 'fa-credit-card', concluido: 'fa-circle-check' };
const iniciais = nome => {
    const partes = nome.split(' ').filter(Boolean);
    return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
};

function desenharVendas() {
    const vendas = db.vendas.filter(v => v.etapa !== 'concluido' || AdminDB.eDoMesAtual(v))
        .filter(v => combina(nomeCliente(v.clienteId), nomeNavio(v.pacoteId)));
    painel.innerHTML = `<div class="kanban">${ORDEM_ETAPAS.map((etapa, i) => {
        const lista = vendas.filter(v => v.etapa === etapa);
        const total = lista.reduce((s, v) => s + v.valor, 0);
        const proxima = ETAPAS[ORDEM_ETAPAS[i + 1]];
        return `<section class="kanban-coluna etapa-${etapa}" aria-labelledby="titulo-${etapa}">
            <header class="kanban-cabeca">
                <span class="kanban-passo" aria-hidden="true">${i + 1}</span>
                <div>
                    <h2 id="titulo-${etapa}"><i class="fa-solid ${ICONES_ETAPA[etapa]}" aria-hidden="true"></i> ${ETAPAS[etapa]}</h2>
                    <p>${lista.length} venda${lista.length === 1 ? '' : 's'} · ${moeda(total)}${etapa === 'concluido' ? ' neste mês' : ''}</p>
                </div>
            </header>
            <div class="kanban-corpo">${lista.map(v => `
                <article class="venda-card">
                    <span class="venda-avatar" aria-hidden="true">${esc(iniciais(nomeCliente(v.clienteId)))}</span>
                    <div class="venda-info">
                        <button type="button" class="venda-nome" data-editar-venda="${v.id}">${esc(nomeCliente(v.clienteId))}</button>
                        <p><i class="fa-solid fa-ship" aria-hidden="true"></i> ${esc(nomeNavio(v.pacoteId))}</p>
                        <p class="venda-valor">${moeda(v.valor)}</p>
                    </div>
                    ${proxima
                        ? `<button type="button" class="avancar" data-avancar="${v.id}" aria-label="Mover para ${proxima}" title="Mover para ${proxima}"><i class="fa-solid fa-arrow-right"></i></button>`
                        : '<span class="venda-ok" title="Venda concluída"><i class="fa-solid fa-check"></i></span>'}
                </article>`).join('') || '<p class="vazio">Nenhuma venda nesta etapa.</p>'}
            </div>
        </section>`;
    }).join('')}</div>`;
}

// ---------- Clientes ----------
function validarCliente(v, atual) {
    const erros = {};
    const cpf = v.cpf.replace(/\D/g, '');
    const telefone = v.telefone.replace(/\D/g, '');
    if (!/^\p{L}+([ '-]\p{L}+)+$/u.test(v.nome.trim().replace(/\s+/g, ' '))) erros.nome = 'Informe nome e sobrenome.';
    if (!atual || cpf !== atual.cpf) {
        if (!Catalogo.cpfValido(cpf)) erros.cpf = 'Informe um CPF válido.';
        else if (db.clientes.some(c => c !== atual && c.cpf === cpf)) erros.cpf = 'Este CPF já está cadastrado.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) erros.email = 'Informe um e-mail válido.';
    if (!/^[1-9]{2}\d{8,9}$/.test(telefone)) erros.telefone = 'Informe o telefone com DDD.';
    return erros;
}

function formularioCliente(cliente) {
    const venda = cliente && ultimaVenda(cliente.id);
    const campos = [
        { nome: 'nome', rotulo: 'Nome completo' },
        { nome: 'cpf', rotulo: 'CPF' },
        { nome: 'email', rotulo: 'E-mail', tipo: 'email' },
        { nome: 'telefone', rotulo: 'Telefone com DDD', tipo: 'tel' }
    ];
    if (venda) campos.push({ nome: 'etapa', rotulo: 'Status', tipo: 'select', opcoes: Object.entries(ETAPAS) });
    abrirFormulario({
        titulo: cliente ? 'Alterar cliente' : 'Novo cliente',
        campos,
        valores: cliente ? { ...cliente, cpf: formatarCpf(cliente.cpf), telefone: formatarTelefone(cliente.telefone), etapa: venda?.etapa } : {},
        aoSalvar: v => {
            const erros = validarCliente(v, cliente);
            if (Object.keys(erros).length) return erros;
            const alvo = cliente || { id: AdminDB.novoId(), origem: 'admin' };
            alvo.nome = v.nome.trim().replace(/\s+/g, ' ');
            alvo.cpf = v.cpf.replace(/\D/g, '');
            alvo.email = v.email.trim().toLowerCase();
            alvo.telefone = v.telefone.replace(/\D/g, '');
            if (!cliente) db.clientes.push(alvo);
            if (venda) AdminDB.mudarEtapa(venda, v.etapa);
        },
        aoExcluir: cliente && (() => AdminDB.excluirCliente(cliente.id))
    });
}

let filtroStatus = 'todos';
const RESUMO_CLIENTES = [
    ['todos', 'Clientes', 'fa-users'],
    ['negociacao', 'Em negociação', ICONES_ETAPA.negociacao],
    ['pagamento', 'Em pagamento', ICONES_ETAPA.pagamento],
    ['concluido', 'Concluídos', ICONES_ETAPA.concluido],
    ['nenhuma', 'Sem venda', 'fa-user-clock']
];

function desenharClientes() {
    const colunas = [['nome', 'Nome do Cliente'], ['cpf', 'CPF'], ['local', 'Local'], ['status', 'Status']];
    const todas = db.clientes.map(c => {
        const v = ultimaVenda(c.id);
        const pacote = v && Catalogo.porId(v.pacoteId);
        return { c, nome: c.nome, cpf: c.cpf, pacote,
                 local: pacote ? `${pacote.destino} (${pacote.navio})` : 'Sem viagem',
                 etapa: v ? v.etapa : 'nenhuma',
                 status: v ? ETAPAS[v.etapa] : 'Sem venda' };
    });
    const contagem = chave => chave === 'todos' ? todas.length : todas.filter(l => l.etapa === chave).length;
    const linhas = todas
        .filter(l => filtroStatus === 'todos' || l.etapa === filtroStatus)
        .filter(l => combina(l.nome, l.cpf, formatarCpf(l.cpf), l.local, l.status, l.c.email))
        .sort((a, b) => a[ordenacao.campo].localeCompare(b[ordenacao.campo]) * ordenacao.direcao);
    const aria = campo => ordenacao.campo === campo ? (ordenacao.direcao > 0 ? 'ascending' : 'descending') : 'none';
    const seta = campo => ordenacao.campo !== campo ? 'fa-sort' : ordenacao.direcao > 0 ? 'fa-sort-up' : 'fa-sort-down';
    painel.innerHTML = `
        <div class="resumo-clientes">${RESUMO_CLIENTES.map(([chave, rotulo, icone]) => `
            <button type="button" class="resumo-card etapa-${chave}" data-filtro="${chave}" aria-pressed="${filtroStatus === chave}">
                <span class="resumo-icone"><i class="fa-solid ${icone}" aria-hidden="true"></i></span>
                <span><strong>${contagem(chave)}</strong>${rotulo}</span>
            </button>`).join('')}
        </div>
        <div class="tabela-rolagem"><table class="tabela-clientes">
        <thead><tr>${colunas.map(([campo, nome]) => `
            <th aria-sort="${aria(campo)}"><button type="button" data-ordenar="${campo}">${nome} <i class="fa-solid ${seta(campo)}"></i></button></th>`).join('')}
            <th><span class="sr">Ações</span></th></tr></thead>
        <tbody>${linhas.map(l => `<tr class="etapa-${l.etapa}">
            <td><div class="cliente-nome">
                <span class="venda-avatar" aria-hidden="true">${esc(iniciais(l.nome))}</span>
                <span><strong>${esc(l.nome)}</strong>${l.c.origem === 'site' ? '<b class="tag-site">Cadastro no site</b>' : ''}
                    <small>${esc(l.c.email)}</small></span>
            </div></td>
            <td class="cliente-cpf">${esc(formatarCpf(l.cpf))}</td>
            <td>${l.pacote ? `<i class="fa-solid fa-ship icone-navio" aria-hidden="true"></i> ${esc(l.local)}` : `<span class="sem-viagem">${esc(l.local)}</span>`}</td>
            <td><span class="status-pilula">${esc(l.status)}</span></td>
            <td><button type="button" class="alterar" data-editar-cliente="${l.c.id}"><i class="fa-solid fa-pen" aria-hidden="true"></i> Alterar</button></td>
        </tr>`).join('') || '<tr><td colspan="5" class="vazio">Nenhum cliente encontrado.</td></tr>'}</tbody>
    </table></div>`;
}

// ---------- Tarefas ----------
function formularioTarefa(tarefa) {
    if (!db.clientes.length) { alert('Cadastre um cliente antes de criar uma tarefa.'); return; }
    abrirFormulario({
        titulo: tarefa ? 'Alterar tarefa' : 'Nova tarefa',
        campos: [
            { nome: 'descricao', rotulo: 'Descrição' },
            { nome: 'prazo', rotulo: 'Prazo', tipo: 'date' },
            { nome: 'clienteId', rotulo: 'Cliente', tipo: 'select', opcoes: opcoesClientes() },
            { nome: 'lembrete', rotulo: 'É um lembrete', tipo: 'checkbox' }
        ],
        valores: tarefa || { prazo: AdminDB.hoje },
        aoSalvar: v => {
            const erros = {};
            if (!v.descricao.trim()) erros.descricao = 'Descreva a tarefa.';
            if (!v.prazo) erros.prazo = 'Informe o prazo.';
            else if (v.prazo < AdminDB.hoje && v.prazo !== tarefa?.prazo) erros.prazo = 'O prazo não pode estar no passado.';
            if (Object.keys(erros).length) return erros;
            const alvo = tarefa || { id: AdminDB.novoId(), feita: false };
            Object.assign(alvo, { descricao: v.descricao.trim(), prazo: v.prazo, clienteId: v.clienteId, lembrete: Boolean(v.lembrete) });
            if (!tarefa) db.tarefas.push(alvo);
        },
        aoExcluir: tarefa && (() => { db.tarefas = db.tarefas.filter(x => x !== tarefa); })
    });
}

function itemTarefa(t) {
    const atrasada = t.prazo < AdminDB.hoje;
    return `<li class="tarefa-item${atrasada ? ' atrasada' : ''}">
        <button type="button" class="concluir" data-concluir="${t.id}" aria-label="Concluir: ${esc(t.descricao)}" title="Marcar como concluída"><i class="fa-solid fa-check"></i></button>
        <button type="button" class="tarefa-texto" data-editar-tarefa="${t.id}">
            <strong>${esc(t.descricao)}</strong>
            <span class="tarefa-meta">
                <span><i class="fa-solid fa-user" aria-hidden="true"></i> ${esc(nomeCliente(t.clienteId))}</span>
                <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${Catalogo.data(t.prazo)}</span>
                ${atrasada ? '<span class="tag-atrasada"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Atrasada</span>' : ''}
            </span>
        </button>
    </li>`;
}

function blocoTarefas(titulo, lista, classe, icone) {
    return `<section class="tarefas-bloco ${classe}">
        <header><i class="fa-solid ${icone}" aria-hidden="true"></i><h2>${titulo}</h2><span class="bloco-contagem">${lista.length}</span></header>
        <ul>${lista.map(itemTarefa).join('') || '<li class="tarefas-vazio"><i class="fa-solid fa-mug-hot" aria-hidden="true"></i> Nada pendente por aqui.</li>'}</ul>
    </section>`;
}

function desenharTarefas() {
    const { hoje, segunda, somaDias } = AdminDB;
    const domingo = somaDias(segunda, 6);
    const mes = hoje.slice(0, 7);
    const lista = pendentes().filter(t => combina(t.descricao, nomeCliente(t.clienteId))).sort((a, b) => a.prazo.localeCompare(b.prazo));
    const comuns = lista.filter(t => !t.lembrete);
    const grupos = {
        hoje: comuns.filter(t => t.prazo <= hoje),
        semana: comuns.filter(t => t.prazo > hoje && t.prazo <= domingo),
        mes: comuns.filter(t => t.prazo > domingo && t.prazo.slice(0, 7) === mes),
        lembretes: lista.filter(t => t.lembrete)
    };
    const resumo = [
        ['Para hoje', grupos.hoje.length, 'fa-sun', 'etapa-negociacao'],
        ['Atrasadas', lista.filter(t => t.prazo < hoje).length, 'fa-triangle-exclamation', 'etapa-atrasada'],
        ['Esta semana', grupos.semana.length, 'fa-calendar-week', 'etapa-pagamento'],
        ['Este mês', grupos.mes.length, 'fa-calendar', 'etapa-concluido'],
        ['Lembretes', grupos.lembretes.length, 'fa-bell', 'etapa-todos']
    ];
    painel.innerHTML = `
        <div class="resumo-clientes">${resumo.map(([rotulo, n, icone, classe]) => `
            <div class="resumo-card estatico ${classe}">
                <span class="resumo-icone"><i class="fa-solid ${icone}" aria-hidden="true"></i></span>
                <span><strong>${n}</strong>${rotulo}</span>
            </div>`).join('')}
        </div>
        <div class="tarefas-topo">
            <section class="semana-cartao" aria-label="Tarefas da semana">
                <div class="semana">${DIAS.map((dia, i) => {
                    const data = somaDias(segunda, i);
                    const doDia = lista.filter(t => t.prazo === data);
                    return `<div class="semana-dia${data === hoje ? ' hoje' : ''}">
                        <h2><span class="dia-nome">${dia}</span><span class="dia-numero">${data.slice(8)}</span>
                            ${data === hoje ? '<span class="dia-hoje">Hoje</span>' : ''}</h2>
                        ${doDia.map(t => `<button type="button" class="semana-tarefa${t.lembrete ? ' lembrete' : ''}" data-editar-tarefa="${t.id}">
                            <i class="fa-solid ${t.lembrete ? 'fa-bell' : 'fa-thumbtack'}" aria-hidden="true"></i> ${esc(t.descricao)}</button>`).join('')
                            || '<p class="dia-livre">Livre</p>'}
                    </div>`;
                }).join('')}</div>
            </section>
            ${blocoTarefas('Para hoje', grupos.hoje, 'bloco-hoje', 'fa-sun')}
        </div>
        <div class="tarefas-base">
            ${blocoTarefas('Desta semana', grupos.semana, 'bloco-semana', 'fa-calendar-week')}
            ${blocoTarefas('Deste mês', grupos.mes, 'bloco-mes', 'fa-calendar')}
            ${blocoTarefas('Lembretes', grupos.lembretes, 'bloco-lembretes', 'fa-bell')}
        </div>`;
}

function mostrarPendencias() {
    const lista = pendentes().filter(t => t.prazo <= AdminDB.hoje);
    dialogo.innerHTML = `
        <h2 id="dialogo-titulo">Pendências de hoje</h2>
        <ul class="pendencias">${lista.map(t => `<li>${esc(t.descricao)} - ${esc(nomeCliente(t.clienteId))}
            <small>${Catalogo.data(t.prazo)}${t.prazo < AdminDB.hoje ? ' (atrasada)' : ''}</small></li>`).join('') || '<li>Nenhuma tarefa vencida ou para hoje.</li>'}</ul>
        <div class="dialogo-botoes"><button type="button" class="perfil-btn" id="fechar-pendencias">Fechar</button></div>`;
    document.getElementById('fechar-pendencias').addEventListener('click', () => dialogo.close());
    dialogo.showModal();
}

// ---------- Faturamento ----------
function graficoLinha(serie) {
    const L = 640, A = 260, esq = 70, dir = 24, topo = 24, base = 30;
    const maior = Math.max(...serie.map(s => s.valor), 1);
    const passo = Math.ceil(maior / 4 / 2500) * 2500;
    const x = i => esq + i * (L - esq - dir) / (serie.length - 1);
    const y = v => A - base - v / (passo * 4) * (A - topo - base);
    const pontos = serie.map((s, i) => `${x(i)},${y(s.valor)}`).join(' ');
    const ultimo = serie[serie.length - 1];
    return `<svg class="grafico" viewBox="0 0 ${L} ${A}" role="img" aria-label="Receita concluída nos últimos cinco meses">
        ${[0, 1, 2, 3, 4].map(n => `<line class="grade" x1="${esq}" x2="${L - dir}" y1="${y(passo * n)}" y2="${y(passo * n)}"/>
            <text class="eixo" x="${esq - 10}" y="${y(passo * n) + 4}" text-anchor="end">${(passo * n).toLocaleString('pt-BR')}</text>`).join('')}
        ${serie.map((s, i) => `<text class="eixo" x="${x(i)}" y="${A - 8}" text-anchor="middle">${esc(s.rotulo)}</text>`).join('')}
        <line id="cruz" class="cruz" y1="${topo}" y2="${A - base}" visibility="hidden"/>
        <defs><linearGradient id="area-receita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#0153c2" stop-opacity=".28"/><stop offset="1" stop-color="#0153c2" stop-opacity="0"/>
        </linearGradient></defs>
        <polygon fill="url(#area-receita)" points="${x(0)},${y(0)} ${pontos} ${x(serie.length - 1)},${y(0)}"/>
        <polyline class="linha" points="${pontos}"/>
        ${serie.map((s, i) => `<circle class="ponto" cx="${x(i)}" cy="${y(s.valor)}" r="5"/>`).join('')}
        <text class="rotulo" x="${x(serie.length - 1)}" y="${y(ultimo.valor) - 12}" text-anchor="end">${moeda(ultimo.valor)}</text>
        ${serie.map((s, i) => `<rect class="alvo" x="${x(i) - (L - esq - dir) / (serie.length - 1) / 2}" y="0" width="${(L - esq - dir) / (serie.length - 1)}" height="${A - base}"
            data-dica="${esc(s.rotulo)}: ${moeda(s.valor)}" data-x="${x(i)}"/>`).join('')}
    </svg>`;
}

function graficoRosca(itens) {
    const total = itens.reduce((s, i) => s + i.valor, 0);
    if (!total) return '<p class="vazio">Ainda não há vendas concluídas.</p>';
    const raio = 70, volta = 2 * Math.PI * raio;
    const percentual = valor => (valor / total * 100).toFixed(1).replace('.', ',') + '%';
    let acumulado = 0;
    const arcos = itens.map((item, i) => {
        const tamanho = item.valor / total * volta;
        const arco = item.valor ? `<circle class="arco" cx="100" cy="100" r="${raio}" stroke="${CORES[i]}"
            stroke-dasharray="${Math.max(tamanho - 2, 0.1)} ${volta}" stroke-dashoffset="${-acumulado}"
            data-dica="${esc(item.navio)}: ${moeda(item.valor)} (${percentual(item.valor)})"/>` : '';
        acumulado += tamanho;
        return arco;
    }).join('');
    return `<div class="rosca">
        <svg viewBox="0 0 200 200" role="img" aria-label="Receita por navio"><g transform="rotate(-90 100 100)">${arcos}</g></svg>
        <ul class="legenda">${itens.map((item, i) => `<li><span class="amostra" style="background:${CORES[i]}"></span>
            <span>${esc(item.navio)}<br><strong>${percentual(item.valor)}</strong> · ${moeda(item.valor)}</span></li>`).join('')}</ul>
    </div>`;
}

function barras(itens) {
    const maior = Math.max(...itens.map(i => i.valor), 1);
    return `<div class="barras">${itens.map(i => `
        <div class="barra-linha">
            <span class="barra-nome">${i.icone ? `<i class="fa-solid ${i.icone}"></i> ` : ''}${esc(i.nome)}</span>
            <div class="barra-trilho"><div class="barra" style="width:${i.valor / maior * 100}%;background:${i.cor}" data-dica="${esc(i.nome)}: ${moeda(i.valor)}"></div></div>
            <span class="barra-valor">${moeda(i.valor)}</span>
        </div>`).join('')}</div>`;
}

function desenharFaturamento() {
    const m = AdminDB.metricas();
    const variacao = m.variacao === null ? 'Sem base no mês anterior'
        : `<span class="${m.variacao >= 0 ? 'sobe' : 'desce'}"><i class="fa-solid fa-arrow-${m.variacao >= 0 ? 'up' : 'down'}"></i> ${m.variacao >= 0 ? '+' : ''}${m.variacao.toFixed(1).replace('.', ',')}%</span> vs mês anterior`;
    const percentualMeta = m.meta ? m.atual / m.meta * 100 : 0;
    const falta = m.meta - m.atual;
    const kpi = (classe, icone, titulo, valor, apoio) => `
        <div class="fat-kpi ${classe}">
            <span class="fat-kpi-icone"><i class="fa-solid ${icone}" aria-hidden="true"></i></span>
            <div><h2>${titulo}</h2><p class="heroi">${valor}</p><p class="apoio">${apoio}</p></div>
        </div>`;
    const cartao = (classe, icone, titulo, corpo) => `
        <section class="fat-cartao ${classe}">
            <header class="fat-cabeca"><i class="fa-solid ${icone}" aria-hidden="true"></i><h2>${titulo}</h2></header>
            <div class="fat-corpo">${corpo}</div>
        </section>`;
    painel.innerHTML = `
        <div class="fat-kpis">
            ${kpi('kpi-faturamento', 'fa-sack-dollar', 'Faturamento do mês', moeda(m.atual), variacao)}
            ${kpi('kpi-ticket', 'fa-receipt', 'Ticket médio', m.quantidade ? moeda(m.ticket) : '-',
                `${m.quantidade} venda${m.quantidade === 1 ? '' : 's'} concluída${m.quantidade === 1 ? '' : 's'} no mês`)}
            ${kpi('kpi-receber', 'fa-hourglass-half', 'A receber', moeda(m.aReceber), 'vendas na etapa de pagamento')}
            ${kpi('kpi-meta', 'fa-bullseye', 'Meta do mês', `${Math.round(percentualMeta)}%`, `${moeda(m.atual)} de ${moeda(m.meta)}`)}
        </div>
        <div class="fat-grade">
        ${cartao('fat-linha cab-azul', 'fa-chart-line', 'Receita por mês', graficoLinha(m.serie))}
        ${cartao('fat-rosca cab-escuro', 'fa-chart-pie', 'Receita por navio', graficoRosca(m.porPacote))}
        ${cartao('fat-status cab-amarelo', 'fa-scale-balanced', 'Status do faturamento', barras([
            { nome: 'Concluído/Recebido', valor: m.atual, cor: 'var(--bom)', icone: 'fa-circle-check' },
            { nome: 'A receber', valor: m.aReceber, cor: 'var(--serie-1)', icone: 'fa-clock' }
        ]))}
        ${cartao('fat-meta cab-degrade', 'fa-bullseye', 'Meta de vendas do mês', `
            <div class="meta-progresso" role="img" aria-label="${Math.round(percentualMeta)}% da meta atingida">
                <div class="meta-feito" style="width:${Math.min(percentualMeta, 100)}%"></div>
                <span class="meta-pct">${Math.round(percentualMeta)}%</span>
            </div>
            <div class="meta-legenda">
                <span><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Realizado <strong>${moeda(m.atual)}</strong></span>
                <span><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i> Meta <strong>${moeda(m.meta)}</strong></span>
            </div>
            <p class="meta-falta">${falta > 0 ? `Faltam <strong>${moeda(falta)}</strong> para bater a meta.` : '<strong>Meta batida!</strong> Parabéns à equipe.'}</p>
            <label class="meta-campo">Alterar meta (R$) <input type="number" id="meta" min="1" step="100" value="${m.meta}"></label>`)}
        <details class="fat-cartao fat-tabela"><summary>Ver dados em tabela</summary>
            <table><thead><tr><th>Mês</th><th>Receita</th></tr></thead>
            <tbody>${m.serie.map(s => `<tr><td>${esc(s.rotulo)}</td><td>${moeda(s.valor)}</td></tr>`).join('')}</tbody></table>
            <table><thead><tr><th>Navio</th><th>Receita</th></tr></thead>
            <tbody>${m.porPacote.map(p => `<tr><td>${esc(p.navio)}</td><td>${moeda(p.valor)}</td></tr>`).join('')}</tbody></table>
        </details>
    </div>`;
}

// ---------- Mensagens ----------
let conversaAberta = null;
const quando = iso => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const ORIGENS = { conta: 'Cliente cadastrado', visitante: 'Visitante', exemplo: 'Exemplo' };
const ultimaMensagem = c => c.mensagens[c.mensagens.length - 1];

function avisarChat() {
    document.getElementById('chat')?.dispatchEvent(new Event('oceanun-mensagens'));
}

function desenharMensagens() {
    const ordenar = lista => lista.filter(c => c.mensagens.length)
        .sort((a, b) => ultimaMensagem(b).em.localeCompare(ultimaMensagem(a).em));
    let conversas = ordenar(Catalogo.listarConversas())
        .filter(c => combina(c.nome, c.email || '', ...c.mensagens.map(m => m.texto)));
    if (!conversas.some(c => c.id === conversaAberta)) conversaAberta = conversas[0]?.id || null;
    const aberta = conversas.find(c => c.id === conversaAberta);
    if (aberta && Catalogo.naoLidas(aberta, 'admin')) {
        Catalogo.marcarLida(aberta.id, 'admin');
        conversas = conversas.map(c => c.id === aberta.id ? Catalogo.listarConversas().find(x => x.id === c.id) : c);
        avisarChat();
    }
    painel.innerHTML = `<div class="msg-grade">
        <ul class="msg-lista">${conversas.map(c => {
            const n = Catalogo.naoLidas(c, 'admin');
            return `<li><button type="button" data-conversa="${esc(c.id)}"${c.id === conversaAberta ? ' aria-current="true"' : ''}>
                <span class="msg-nome">${esc(c.nome)}${n ? `<b class="msg-nova">${n} nova${n > 1 ? 's' : ''}</b>` : ''}</span>
                <span class="msg-previa">${esc(ultimaMensagem(c).texto)}</span>
                <small>${esc(ORIGENS[c.origem] || '')} · ${quando(ultimaMensagem(c).em)}</small>
            </button></li>`;
        }).join('') || '<li class="vazio">Nenhuma mensagem ainda. As dúvidas enviadas pelo chat do site aparecem aqui.</li>'}</ul>
        <div class="msg-conversa">${aberta ? `
            <header class="msg-topo">
                <div><strong>${esc(aberta.nome)}</strong><small>${esc(aberta.email || 'Visitante sem cadastro')}</small></div>
                <button type="button" class="perfil-btn perigo" data-excluir-conversa="${esc(aberta.id)}">Excluir conversa</button>
            </header>
            <div class="msg-historico" id="msg-historico">${aberta.mensagens.map(m => `
                <div class="msg-balao ${m.de === 'admin' ? 'equipe' : 'cliente'}">
                    <p>${esc(m.texto)}</p><small>${m.de === 'admin' ? 'Equipe' : esc(aberta.nome.split(' ')[0])} · ${quando(m.em)}</small>
                </div>`).join('')}</div>
            <form class="msg-resposta" id="form-resposta">
                <label for="resposta" class="sr">Resposta para ${esc(aberta.nome)}</label>
                <textarea id="resposta" rows="2" maxlength="500" placeholder="Escreva a resposta (Enter envia, Shift+Enter quebra linha)"></textarea>
                <button type="submit" class="perfil-btn">Responder</button>
            </form>` : '<p class="vazio">Selecione uma conversa.</p>'}
        </div>
    </div>`;
    const historico = document.getElementById('msg-historico');
    if (historico) historico.scrollTop = historico.scrollHeight;
}

function enviarResposta() {
    const campo = document.getElementById('resposta');
    if (!campo.value.trim()) return;
    if (!Catalogo.responderConversa(conversaAberta, campo.value)) {
        alert('Não foi possível enviar a resposta neste navegador.');
        return;
    }
    desenhar();
    document.getElementById('resposta')?.focus();
}

painel.addEventListener('submit', e => {
    if (e.target.id !== 'form-resposta') return;
    e.preventDefault();
    enviarResposta();
});
painel.addEventListener('keydown', e => {
    if (e.target.id === 'resposta' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarResposta();
    }
});

// ---------- Navegação entre as telas ----------
const ABAS = {
    vendas: { titulo: 'Vendas', desenhar: desenharVendas, novo: () => formularioVenda(), busca: true },
    clientes: { titulo: 'Clientes', desenhar: desenharClientes, novo: () => formularioCliente(), busca: true },
    tarefas: { titulo: 'Tarefas e lembretes', desenhar: desenharTarefas, novo: () => formularioTarefa(), busca: true },
    faturamento: { titulo: 'Faturamento', desenhar: desenharFaturamento },
    mensagens: { titulo: 'Mensagens', desenhar: desenharMensagens, busca: true }
};
const abaAtual = () => ABAS[location.hash.slice(1)] ? location.hash.slice(1) : 'vendas';

function desenhar() {
    const nome = abaAtual();
    const aba = ABAS[nome];
    document.getElementById('admin-titulo').textContent = aba.titulo;
    document.getElementById('admin-busca').hidden = !aba.busca;
    novo.hidden = !aba.novo;
    document.querySelectorAll('[data-aba]').forEach(a => {
        const ativa = a.dataset.aba === nome;
        a.classList.toggle('active', ativa);
        if (ativa) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const contagem = pendentes().filter(t => t.prazo <= AdminDB.hoje).length;
    const selo = document.getElementById('sino-contagem');
    selo.textContent = contagem;
    selo.hidden = !contagem;
    aba.desenhar();
    const novas = Catalogo.listarConversas().filter(c => Catalogo.naoLidas(c, 'admin')).length;
    const seloMensagens = document.getElementById('selo-mensagens');
    seloMensagens.textContent = novas;
    seloMensagens.hidden = !novas;
}

painel.addEventListener('click', e => {
    const alvo = e.target.closest('button');
    if (!alvo) return;
    const d = alvo.dataset;
    const venda = id => db.vendas.find(v => v.id === id);
    if (d.avancar) {
        const v = venda(d.avancar);
        AdminDB.mudarEtapa(v, ORDEM_ETAPAS[ORDEM_ETAPAS.indexOf(v.etapa) + 1]);
        persistir();
    } else if (d.editarVenda) {
        formularioVenda(venda(d.editarVenda));
    } else if (d.editarCliente) {
        formularioCliente(AdminDB.cliente(d.editarCliente));
    } else if (d.editarTarefa) {
        formularioTarefa(db.tarefas.find(t => t.id === d.editarTarefa));
    } else if (d.concluir) {
        db.tarefas.find(t => t.id === d.concluir).feita = true;
        persistir();
    } else if (d.filtro) {
        filtroStatus = filtroStatus === d.filtro ? 'todos' : d.filtro;
        desenhar();
    } else if (d.conversa) {
        conversaAberta = d.conversa;
        desenhar();
    } else if (d.excluirConversa) {
        if (!confirm('Excluir esta conversa?')) return;
        Catalogo.excluirConversa(d.excluirConversa);
        conversaAberta = null;
        desenhar();
        avisarChat();
    } else if (d.ordenar) {
        if (ordenacao.campo === d.ordenar) ordenacao.direcao *= -1;
        else Object.assign(ordenacao, { campo: d.ordenar, direcao: 1 });
        desenhar();
    }
});

painel.addEventListener('change', e => {
    if (e.target.id !== 'meta') return;
    const valor = Number(e.target.value);
    if (valor > 0) {
        db.meta = valor;
        persistir();
    } else {
        e.target.value = db.meta;
    }
});

painel.addEventListener('mousemove', e => {
    const alvo = e.target.closest('[data-dica]');
    const cruz = document.getElementById('cruz');
    dica.hidden = !alvo;
    if (cruz) cruz.setAttribute('visibility', alvo?.dataset.x ? 'visible' : 'hidden');
    if (!alvo) return;
    dica.textContent = alvo.dataset.dica;
    dica.style.left = Math.min(e.clientX + 14, innerWidth - dica.offsetWidth - 8) + 'px';
    dica.style.top = e.clientY + 14 + 'px';
    if (cruz && alvo.dataset.x) {
        cruz.setAttribute('x1', alvo.dataset.x);
        cruz.setAttribute('x2', alvo.dataset.x);
    }
});
painel.addEventListener('mouseleave', () => { dica.hidden = true; });

dialogo.addEventListener('click', e => { if (e.target === dialogo) dialogo.close(); });
novo.addEventListener('click', () => ABAS[abaAtual()].novo?.());
busca.addEventListener('input', desenhar);
document.getElementById('admin-sino').addEventListener('click', mostrarPendencias);
document.getElementById('admin-sair').addEventListener('click', () => {
    Catalogo.sairAdmin();
    location.href = Catalogo.PAGINA_PERFIL;
});
window.addEventListener('hashchange', () => {
    busca.value = '';
    desenhar();
});

// Novas dúvidas chegam enquanto o painel está aberto em outra aba; o rascunho da resposta é mantido
window.addEventListener('storage', e => {
    if (e.key !== Catalogo.CHAVE_MENSAGENS || dialogo.open) return;
    const campo = document.getElementById('resposta');
    const rascunho = campo?.value;
    const focado = document.activeElement === campo;
    desenhar();
    const novo = document.getElementById('resposta');
    if (novo && rascunho) novo.value = rascunho;
    if (novo && focado) novo.focus();
});

if (Catalogo.ehAdmin()) desenhar();
else location.replace(Catalogo.PAGINA_PERFIL);
