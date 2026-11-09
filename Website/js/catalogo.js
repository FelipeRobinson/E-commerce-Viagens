const Catalogo = (() => {
    // Caminho até a pasta Website/, descoberto a partir deste próprio arquivo
    const BASE = document.currentScript.src.replace(/js\/catalogo\.js.*$/, '');
    const CHAVE_CARRINHO = 'oceanun-carrinho';

    // ---------- Formatação ----------
    const moeda = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const data = iso => { const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}`; };
    const periodo = p => `${data(p.dataIda)} a ${data(p.dataVolta)}`;
    const noites = p => Math.round((new Date(p.dataVolta) - new Date(p.dataIda)) / 864e5);
    const img = p => BASE + p.imagem;
    const normalizar = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    // ---------- Consultas ----------
    const todos = () => [...PACOTES];
    const porId = id => PACOTES.find(p => p.id === id);
    const destaques = () => PACOTES.filter(p => p.destaque);
    const destinos = () => [...new Set(PACOTES.map(p => p.destino))].sort();
    const servicos = () => [...new Set(PACOTES.flatMap(p => p.servicos))].sort();

    /* Filtros aceitos (todos opcionais):
       { texto, destino, servico, pessoas, valorMax, dataInicio, dataFim, destaque } */
    function buscar(f = {}) {
        return PACOTES.filter(p => {
            if (f.texto) {
                const alvo = normalizar([p.navio, p.destino, p.embarque, p.descricao,
                    ...p.servicos, ...(p.tags || [])].join(' '));
                if (!normalizar(f.texto).split(/\s+/).every(t => alvo.includes(t))) return false;
            }
            if (f.destino && normalizar(p.destino) !== normalizar(f.destino)) return false;
            if (f.servico && !p.servicos.includes(f.servico)) return false;
            if (f.pessoas && p.pessoas < Number(f.pessoas)) return false;
            if (f.valorMax && p.valor > Number(f.valorMax)) return false;
            if (f.dataInicio && p.dataIda < f.dataInicio) return false;
            if (f.dataFim && p.dataVolta > f.dataFim) return false;
            if (f.destaque && !p.destaque) return false;
            return true;
        });
    }

    // ---------- Carrinho (localStorage) ----------
    function lerCarrinho() {
        try { return JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) || []; } catch { return []; }
    }
    function salvarCarrinho(ids) {
        try { localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(ids)); } catch {}
        atualizarContador();
    }
    const adicionar = id => salvarCarrinho([...lerCarrinho(), id]);
    function remover(id) {
        const ids = lerCarrinho();
        ids.splice(ids.indexOf(id), 1);
        salvarCarrinho(ids);
    }
    const itensCarrinho = () => lerCarrinho().map(porId).filter(Boolean);

    function atualizarContador() {
        const link = document.querySelector('a[aria-label="Carrinho"]');
        if (!link) return;
        let badge = link.querySelector('.cart-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            link.appendChild(badge);
        }
        const n = lerCarrinho().length;
        badge.textContent = n;
        badge.style.display = n ? '' : 'none';
    }

    // ---------- Renderização ----------
    // Card resumido da página inicial: imagem, nome, embarque, data e "Contratar Pacote"
    function cardCompacto(p) {
        const el = document.createElement('article');
        el.className = 'card compacto';
        el.innerHTML = `
            <img src="${img(p)}" alt="Navio ${p.navio}">
            <div class="card-info">
                <h3><i class="fa-solid fa-ship"></i> ${p.navio}</h3>
                <p>Embarque e desembarque: ${p.embarque}</p>
                <p class="data">Data: ${periodo(p)}</p>
                <button class="btn amarelo add-to-cart">Contratar Pacote</button>
            </div>`;
        const btn = el.querySelector('.add-to-cart');
        btn.addEventListener('click', () => {
            adicionar(p.id);
            btn.textContent = 'Adicionado!';
            btn.classList.add('adicionado');
            setTimeout(() => { btn.textContent = 'Contratar Pacote'; btn.classList.remove('adicionado'); }, 1500);
        });
        return el;
    }

    function card(p) {
        const el = document.createElement('article');
        el.className = 'card';
        el.innerHTML = `
            <img src="${img(p)}" alt="Navio ${p.navio}">
            <div class="card-info">
                <h3>${p.navio}</h3>
                <p>Destino: ${p.destino} · Embarque: ${p.embarque}</p>
                <p class="data">Data: ${periodo(p)} (${noites(p)} noites)</p>
                <p class="servicos">${p.servicos.join(' · ')}</p>
                <p>Para até ${p.pessoas} pessoa${p.pessoas > 1 ? 's' : ''}</p>
                <p class="preco">${moeda(p.valor)}</p>
                <button class="btn amarelo add-to-cart">Adicionar ao Carrinho</button>
            </div>`;
        const btn = el.querySelector('.add-to-cart');
        btn.addEventListener('click', () => {
            adicionar(p.id);
            btn.textContent = 'Adicionado!';
            btn.classList.add('adicionado');
            setTimeout(() => { btn.textContent = 'Adicionar ao Carrinho'; btn.classList.remove('adicionado'); }, 1500);
        });
        return el;
    }

    function renderizar(container, lista, { compacto = false } = {}) {
        if (typeof container === 'string') container = document.querySelector(container);
        if (!container) return;
        container.innerHTML = '';
        if (!lista.length) {
            container.innerHTML = '<p class="sem-resultados">Nenhum pacote encontrado com esses filtros.</p>';
            return;
        }
        lista.forEach(p => container.appendChild(compacto ? cardCompacto(p) : card(p)));
    }

    // Menu principal: item "Imperdíveis" com submenu dos pacotes em destaque
    function montarMenu() {
        const menu = document.querySelector('nav .menu');
        if (!menu || menu.querySelector('.imperdiveis')) return;
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = BASE + 'imperdiveis.css';
        document.head.appendChild(css);
        const li = document.createElement('li');
        li.className = 'imperdiveis';
        const url = BASE + 'others/pacotes/index.html';
        li.innerHTML = `<a href="${url}?destaque=1">Imperdíveis <i class="fa-solid fa-fire"></i></a>
            <ul class="submenu">${destaques().map(p =>
                `<li><a href="${url}?q=${encodeURIComponent(p.navio)}">
                    <strong>${p.navio}</strong><small>${periodo(p)} · ${moeda(p.valor)}</small></a></li>`).join('')}
            </ul>`;
        menu.appendChild(li);
    }

    // Barra de pesquisa do topo -> página de pacotes com ?q=
    function ligarPesquisa() {
        const form = document.querySelector('nav form.pesquisa');
        if (!form) return;
        form.addEventListener('submit', e => {
            e.preventDefault();
            const q = form.querySelector('input').value.trim();
            location.href = BASE + 'others/pacotes/index.html' + (q ? '?q=' + encodeURIComponent(q) : '');
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        montarMenu();
        ligarPesquisa();
        atualizarContador();
        const chat = document.createElement('script');
        chat.src = BASE + 'js/chat.js';
        document.body.appendChild(chat);
    });

    return { BASE, moeda, data, periodo, noites, img, todos, porId, destaques, destinos, servicos,
             buscar, renderizar, card, adicionar, remover, itensCarrinho, lerCarrinho };
})();
