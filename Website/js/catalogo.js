const Catalogo = (() => {
    // Caminho até a pasta Website/, descoberto a partir deste próprio arquivo
    const BASE = document.currentScript.src.replace(/js\/catalogo\.js.*$/, '');
    const CHAVE_CARRINHO = 'oceanun-carrinho';
    const CHAVE_CONTAS = 'oceanun-contas';
    const CHAVE_SESSAO = 'oceanun-sessao';
    const CHAVE_POPUP = 'oceanun-popup-visto';
    const CHAVE_ADMIN = 'oceanun-admin';
    const ADMIN = { usuario: 'admin', senha: 'admin123' };
    const PAGINA_ADMIN = BASE + 'others/admin/index.html';
    const PAGINA_PERFIL = BASE + 'others/perfil/index.html';

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

    // ---------- Perfil (localStorage) ----------
    function cpfValido(cpf) {
        if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
        const digito = n => {
            let soma = 0;
            for (let i = 0; i < n; i++) soma += cpf[i] * (n + 1 - i);
            return (soma * 10 % 11) % 10;
        };
        return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
    }

    // Devolve o perfil padronizado e um objeto { campo: mensagem } com os erros encontrados
    function validarPerfil(dados) {
        const perfil = {
            nome: String(dados.nome || '').trim().replace(/\s+/g, ' '),
            cpf: String(dados.cpf || '').replace(/\D/g, ''),
            nascimento: String(dados.nascimento || ''),
            email: String(dados.email || '').trim().toLowerCase(),
            telefone: String(dados.telefone || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
        };
        const hoje = new Date().toLocaleDateString('en-CA'); // formato AAAA-MM-DD
        const erros = {};
        if (!/^\p{L}+([ '-]\p{L}+)+$/u.test(perfil.nome)) erros.nome = 'Informe nome e sobrenome, usando apenas letras.';
        if (!cpfValido(perfil.cpf)) erros.cpf = 'Informe um CPF válido.';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(perfil.nascimento) || perfil.nascimento < '1900-01-01' || perfil.nascimento >= hoje) {
            erros.nascimento = 'Informe uma data de nascimento válida.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.email)) erros.email = 'Informe um e-mail válido.';
        if (!/^[1-9]{2}\d{8,9}$/.test(perfil.telefone)) erros.telefone = 'Informe o telefone com DDD.';
        return { perfil, erros };
    }

    const ERRO_SALVAR = { ok: false, erros: { geral: 'Não foi possível salvar neste navegador.' } };
    const ERRO_SENHA_INDISPONIVEL = { ok: false, erros: { geral: 'Este navegador não permite proteger a senha nesta página.' } };
    const paraHex = bytes => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');

    async function gerarHash(senha, salHex) {
        const sal = new Uint8Array(salHex.match(/../g).map(h => parseInt(h, 16)));
        const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: 210000 }, chave, 256);
        return paraHex(new Uint8Array(bits));
    }

    function lerContas() {
        try { return JSON.parse(localStorage.getItem(CHAVE_CONTAS)) || []; } catch { return []; }
    }
    function gravarContas(contas, emailSessao) {
        try {
            localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas));
            if (emailSessao) localStorage.setItem(CHAVE_SESSAO, emailSessao);
            else localStorage.removeItem(CHAVE_SESSAO);
            return true;
        } catch { return false; }
    }
    function emailDaSessao() {
        try { return localStorage.getItem(CHAVE_SESSAO); } catch { return null; }
    }

    // E-mail e CPF não podem repetir entre contas
    function errosDeDuplicidade(perfil, contas) {
        const erros = {};
        if (contas.some(c => c.email === perfil.email)) erros.email = 'Este e-mail já está cadastrado.';
        if (contas.some(c => c.cpf === perfil.cpf)) erros.cpf = 'Este CPF já está cadastrado.';
        return erros;
    }

    // Conta logada, sem os dados da senha
    function lerPerfil() {
        const conta = lerContas().find(c => c.email === emailDaSessao());
        if (!conta) return null;
        const { sal, hash, ...perfil } = conta;
        return perfil;
    }

    async function criarPerfil(dados) {
        if (!window.crypto?.subtle) return ERRO_SENHA_INDISPONIVEL;
        const { perfil, erros } = validarPerfil(dados);
        const contas = lerContas();
        Object.assign(erros, errosDeDuplicidade(perfil, contas));
        if (String(dados.senha || '').length < 8) erros.senha = 'A senha deve ter pelo menos 8 caracteres.';
        else if (dados.senha !== dados.confirmar) erros.confirmar = 'As senhas não são iguais.';
        if (Object.keys(erros).length) return { ok: false, erros };

        const sal = paraHex(crypto.getRandomValues(new Uint8Array(16)));
        const hash = await gerarHash(dados.senha, sal);
        return gravarContas([...contas, { ...perfil, sal, hash }], perfil.email) ? { ok: true, perfil } : ERRO_SALVAR;
    }

    // A sessão de administrador termina quando o navegador é fechado
    function ehAdmin() {
        try { return sessionStorage.getItem(CHAVE_ADMIN) === '1'; } catch { return false; }
    }
    function sairAdmin() {
        try { sessionStorage.removeItem(CHAVE_ADMIN); } catch {}
    }

    // Contas cadastradas no site, sem os dados da senha
    const contas = () => lerContas().map(({ sal, hash, ...perfil }) => perfil);

    async function entrar(email, senha) {
        if (String(email).trim().toLowerCase() === ADMIN.usuario && senha === ADMIN.senha) {
            try {
                sessionStorage.setItem(CHAVE_ADMIN, '1');
            } catch { return ERRO_SALVAR; }
            sair();
            return { ok: true, admin: true };
        }
        if (!window.crypto?.subtle) return ERRO_SENHA_INDISPONIVEL;
        const contas = lerContas();
        const conta = contas.find(c => c.email === String(email).trim().toLowerCase());
        if (!conta || await gerarHash(senha, conta.sal) !== conta.hash) {
            return { ok: false, erros: { geral: 'E-mail ou senha incorretos.' } };
        }
        return gravarContas(contas, conta.email) ? { ok: true, perfil: lerPerfil() } : ERRO_SALVAR;
    }

    function sair() {
        try { localStorage.removeItem(CHAVE_SESSAO); } catch {}
    }

    function atualizarPerfil(dados) {
        const emailAtual = emailDaSessao();
        const contas = lerContas();
        const atual = contas.find(c => c.email === emailAtual);
        if (!atual) return { ok: false, erros: { geral: 'Entre na sua conta para continuar.' } };
        const { perfil, erros } = validarPerfil(dados);
        Object.assign(erros, errosDeDuplicidade(perfil, contas.filter(c => c !== atual)));
        if (Object.keys(erros).length) return { ok: false, erros };
        const novas = contas.map(c => c === atual ? { ...perfil, sal: c.sal, hash: c.hash } : c);
        return gravarContas(novas, perfil.email) ? { ok: true, perfil } : ERRO_SALVAR;
    }

    function excluirPerfil() {
        const email = emailDaSessao();
        gravarContas(lerContas().filter(c => c.email !== email), null);
    }

    // Convite para cadastro: aparece uma vez por sessão e pode ser dispensado
    function mostrarPopupCadastro() {
        if (lerPerfil() || ehAdmin() || /\/others\/perfil\/(index\.html)?$/.test(location.pathname)) return;
        try {
            if (sessionStorage.getItem(CHAVE_POPUP)) return;
            sessionStorage.setItem(CHAVE_POPUP, '1');
        } catch {}

        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = BASE + 'css/popup-cadastro.css';
        document.head.appendChild(css);

        const voltar = 'voltar=' + encodeURIComponent(location.href);
        const popup = document.createElement('dialog');
        popup.className = 'popup-cadastro';
        popup.setAttribute('aria-labelledby', 'popup-cadastro-titulo');
        popup.innerHTML = `
            <div class="popup-conteudo">
                <button type="button" class="popup-fechar" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
                <h2 id="popup-cadastro-titulo">Cadastre-se na Oceanun</h2>
                <p>Crie seu perfil para salvar seus dados.</p>
                <a class="popup-principal" autofocus href="${PAGINA_PERFIL}?modo=cadastro&${voltar}">Criar conta</a>
                <a class="popup-entrar" href="${PAGINA_PERFIL}?${voltar}">Já tenho conta</a>
                <button type="button" class="popup-depois">Agora não</button>
            </div>`;
        popup.querySelectorAll('.popup-fechar, .popup-depois').forEach(b => b.addEventListener('click', () => popup.close()));
        popup.addEventListener('click', e => { if (e.target === popup) popup.close(); });
        popup.addEventListener('close', () => popup.remove());
        document.body.appendChild(popup);
        popup.showModal();
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
        css.href = BASE + 'css/imperdiveis.css';
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
        mostrarPopupCadastro();
        const chat = document.createElement('script');
        chat.src = BASE + 'js/chat.js';
        document.body.appendChild(chat);
    });

    return { BASE, moeda, data, periodo, noites, img, todos, porId, destaques, destinos, servicos,
             buscar, renderizar, card, adicionar, remover, itensCarrinho, lerCarrinho,
             criarPerfil, lerPerfil, atualizarPerfil, excluirPerfil, entrar, sair,
             ehAdmin, sairAdmin, contas, cpfValido, PAGINA_ADMIN, PAGINA_PERFIL };
})();
