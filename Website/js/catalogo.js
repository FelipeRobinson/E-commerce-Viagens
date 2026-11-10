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
    const CONTATO = {
        whatsapp: 'https://wa.me/5519978194930',
        telefone: '(19) 97819-4930',
        instagram: 'https://www.instagram.com/oceanun.ag/',
        usuarioInstagram: '@oceanun.ag'
    };
    const CHAVE_MENSAGENS = 'oceanun-mensagens';
    const CHAVE_VISITANTE = 'oceanun-visitante';
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
        const conta = { ...perfil, criadoEm: new Date().toISOString(), sal, hash };
        return gravarContas([...contas, conta], perfil.email) ? { ok: true, perfil: lerPerfil() } : ERRO_SALVAR;
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
        // Mantém foto, endereço, preferências e senha da conta
        const novas = contas.map(c => c === atual ? { ...c, ...perfil } : c);
        return gravarContas(novas, perfil.email) ? { ok: true, perfil: lerPerfil() } : ERRO_SALVAR;
    }

    // Foto, endereço e preferências de contato da conta logada
    function salvarExtras(extras) {
        const email = emailDaSessao();
        const contas = lerContas();
        const atual = contas.find(c => c.email === email);
        if (!atual) return { ok: false, erros: { geral: 'Entre na sua conta para continuar.' } };
        const erros = {};
        const mudancas = {};
        if ('foto' in extras) {
            if (extras.foto !== null && (!/^data:image\/jpeg;base64,/.test(extras.foto) || extras.foto.length > 400000)) {
                erros.foto = 'Não foi possível usar esta imagem.';
            }
            mudancas.foto = extras.foto;
        }
        if ('endereco' in extras) {
            const e = extras.endereco;
            const endereco = {
                cep: String(e.cep || '').replace(/\D/g, ''),
                rua: String(e.rua || '').trim().slice(0, 120),
                numero: String(e.numero || '').trim().slice(0, 10),
                complemento: String(e.complemento || '').trim().slice(0, 60),
                cidade: String(e.cidade || '').trim().slice(0, 80),
                uf: String(e.uf || '').toUpperCase()
            };
            if (endereco.cep && endereco.cep.length !== 8) erros.cep = 'O CEP deve ter 8 dígitos.';
            if (endereco.uf && !/^[A-Z]{2}$/.test(endereco.uf)) erros.uf = 'Escolha um estado.';
            mudancas.endereco = endereco;
        }
        if ('preferencias' in extras) {
            const p = extras.preferencias;
            mudancas.preferencias = { email: Boolean(p.email), whatsapp: Boolean(p.whatsapp), destino: String(p.destino || '').slice(0, 60) };
        }
        if (Object.keys(erros).length) return { ok: false, erros };
        const novas = contas.map(c => c === atual ? { ...c, ...mudancas } : c);
        if (!gravarContas(novas, email)) return ERRO_SALVAR;
        atualizarAvatarTopo();
        return { ok: true, perfil: lerPerfil() };
    }

    async function alterarSenha(senhaAtual, nova, confirmar) {
        if (!window.crypto?.subtle) return ERRO_SENHA_INDISPONIVEL;
        const email = emailDaSessao();
        const contas = lerContas();
        const conta = contas.find(c => c.email === email);
        if (!conta) return { ok: false, erros: { geral: 'Entre na sua conta para continuar.' } };
        const erros = {};
        if (await gerarHash(String(senhaAtual), conta.sal) !== conta.hash) erros.atual = 'A senha atual está incorreta.';
        if (String(nova).length < 8) erros.nova = 'A nova senha deve ter pelo menos 8 caracteres.';
        else if (nova !== confirmar) erros.confirmar = 'As senhas não são iguais.';
        if (Object.keys(erros).length) return { ok: false, erros };
        const sal = paraHex(crypto.getRandomValues(new Uint8Array(16)));
        const hash = await gerarHash(nova, sal);
        return gravarContas(contas.map(c => c === conta ? { ...c, sal, hash } : c), email) ? { ok: true } : ERRO_SALVAR;
    }

    // Mostra a foto de perfil no ícone "Minha conta" do menu
    function atualizarAvatarTopo() {
        const link = document.querySelector('nav a[aria-label="Minha conta"]');
        if (!link) return;
        const foto = lerPerfil()?.foto;
        let img = link.querySelector('img.avatar-topo');
        // O Font Awesome força display no ícone, então o atributo hidden não basta
        const icone = link.querySelector('i');
        if (icone) icone.style.display = foto ? 'none' : '';
        if (!foto) { img?.remove(); return; }
        if (!img) {
            img = document.createElement('img');
            img.className = 'avatar-topo';
            img.alt = '';
            Object.assign(img.style, { width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fbbf4b' });
            link.appendChild(img);
        }
        img.src = foto;
    }

    function excluirPerfil() {
        const email = emailDaSessao();
        gravarContas(lerContas().filter(c => c.email !== email), null);
    }

    // ---------- Dúvidas enviadas pelo chat (localStorage) ----------
    // Cada visitante ou conta tem uma conversa; o administrador lê e responde no painel.
    function listarConversas() {
        try { return JSON.parse(localStorage.getItem(CHAVE_MENSAGENS)) || []; } catch { return []; }
    }
    function gravarConversas(lista) {
        try { localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify(lista)); return true; } catch { return false; }
    }

    function minhaConversaId() {
        const perfil = lerPerfil();
        if (perfil) return 'conta:' + perfil.email;
        let visitante = 'anonimo';
        try {
            visitante = localStorage.getItem(CHAVE_VISITANTE);
            if (!visitante) {
                visitante = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
                localStorage.setItem(CHAVE_VISITANTE, visitante);
            }
        } catch {}
        return 'visitante:' + visitante;
    }
    const minhaConversa = () => listarConversas().find(c => c.id === minhaConversaId()) || null;

    function adicionarMensagem(id, de, texto, dadosNovaConversa) {
        texto = String(texto).trim().slice(0, 500);
        if (!texto) return false;
        const lista = listarConversas();
        let conversa = lista.find(c => c.id === id);
        if (!conversa) {
            if (!dadosNovaConversa) return false;
            conversa = { id, ...dadosNovaConversa, mensagens: [], lidaAdmin: '', lidaCliente: '' };
            lista.push(conversa);
        }
        const em = new Date().toISOString();
        conversa.mensagens.push({ de, texto, em });
        conversa[de === 'admin' ? 'lidaAdmin' : 'lidaCliente'] = em;
        return gravarConversas(lista);
    }

    function enviarDuvida(texto) {
        const perfil = lerPerfil();
        return adicionarMensagem(minhaConversaId(), 'cliente', texto,
            { nome: perfil ? perfil.nome : 'Visitante', email: perfil ? perfil.email : null, origem: perfil ? 'conta' : 'visitante' });
    }
    const responderConversa = (id, texto) => adicionarMensagem(id, 'admin', texto);

    // lado: 'admin' conta as mensagens do cliente não lidas; 'cliente' conta as respostas não lidas
    function naoLidas(conversa, lado) {
        if (!conversa) return 0;
        const lida = lado === 'admin' ? conversa.lidaAdmin : conversa.lidaCliente;
        return conversa.mensagens.filter(m => (m.de === 'admin') === (lado === 'cliente') && m.em > lida).length;
    }

    function marcarLida(id, lado) {
        const lista = listarConversas();
        const conversa = lista.find(c => c.id === id);
        if (!conversa) return;
        conversa[lado === 'admin' ? 'lidaAdmin' : 'lidaCliente'] = new Date().toISOString();
        gravarConversas(lista);
    }

    const excluirConversa = id => gravarConversas(listarConversas().filter(c => c.id !== id));

    function adicionarConversas(novas) {
        const lista = listarConversas();
        novas.forEach(c => { if (!lista.some(x => x.id === c.id)) lista.push(c); });
        return gravarConversas(lista);
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
            <div class="card-foto">
                <img src="${img(p)}" alt="Navio ${p.navio}">
                <span class="card-noites"><i class="fa-solid fa-moon" aria-hidden="true"></i> ${noites(p)} noites</span>
                <span class="card-preco">${moeda(p.valor)}<small>para até ${p.pessoas} pessoa${p.pessoas > 1 ? 's' : ''}</small></span>
            </div>
            <div class="card-info">
                <h3><i class="fa-solid fa-ship" aria-hidden="true"></i> ${p.navio}</h3>
                <p><i class="fa-solid fa-anchor" aria-hidden="true"></i> Embarque e desembarque: ${p.embarque}</p>
                <p class="data"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${periodo(p)}</p>
                <ul class="card-servicos">${p.servicos.slice(0, 3).map(s => `<li>${s}</li>`).join('')}</ul>
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

    // Rodapé igual em todas as páginas
    function montarRodape() {
        const rodape = document.querySelector('body > footer');
        if (!rodape || rodape.classList.contains('rodape')) return;
        const pagina = caminho => BASE + caminho;
        const externo = 'target="_blank" rel="noopener"';
        rodape.className = 'rodape';
        rodape.innerHTML = `
            <svg class="rodape-onda" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,30 C240,60 480,0 720,24 C960,48 1200,6 1440,30 L1440,60 L0,60 Z"/>
            </svg>
            <div class="rodape-conteudo">
                <div class="rodape-marca">
                    <a href="${pagina('index.html')}" class="rodape-logo">
                        <img src="${pagina('img/image.png')}" alt="">
                        <span>Oceanun</span>
                    </a>
                    <p>Cruzeiros e pacotes de viagem saindo de Santos, com atendimento de perto do primeiro contato ao embarque.</p>
                    <div class="rodape-sociais">
                        <a href="${CONTATO.whatsapp}" ${externo} class="social-whats" aria-label="WhatsApp da Oceanun"><i class="fa-brands fa-whatsapp"></i></a>
                        <a href="${CONTATO.instagram}" ${externo} class="social-insta" aria-label="Instagram da Oceanun"><i class="fa-brands fa-instagram"></i></a>
                    </div>
                </div>
                <div class="rodape-coluna">
                    <h2>Navegue</h2>
                    <ul>
                        <li><a href="${pagina('index.html')}">Início</a></li>
                        <li><a href="${pagina('others/cruzeiros/index.html')}">Cruzeiros</a></li>
                        <li><a href="${pagina('others/pacotes/index.html')}">Pacotes</a></li>
                        <li><a href="${pagina('others/sobre/index.html')}">Conheça a Oceanun</a></li>
                    </ul>
                </div>
                <div class="rodape-coluna">
                    <h2>Atendimento</h2>
                    <ul>
                        <li><a href="${pagina('others/orcamento/index.html')}">Solicite seu orçamento</a></li>
                        <li><a href="${pagina('others/perfil/ajuda/index.html')}">Central de ajuda</a></li>
                        <li><a href="${pagina('others/perfil/index.html')}">Minha conta</a></li>
                        <li><a href="${pagina('others/carrinho/index.html')}">Carrinho</a></li>
                    </ul>
                </div>
                <div class="rodape-coluna">
                    <h2>Fale com a gente</h2>
                    <ul class="rodape-contato">
                        <li><a href="${CONTATO.whatsapp}" ${externo}><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> ${CONTATO.telefone}</a></li>
                        <li><a href="${CONTATO.instagram}" ${externo}><i class="fa-brands fa-instagram" aria-hidden="true"></i> ${CONTATO.usuarioInstagram}</a></li>
                        <li><i class="fa-solid fa-comments" aria-hidden="true"></i> Chat aqui no site</li>
                    </ul>
                </div>
            </div>
            <div class="rodape-base">
                <p>&copy; 2026 Oceanun. Todos os direitos reservados.</p>
                <button type="button" class="rodape-topo"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i> Voltar ao topo</button>
            </div>`;
        rodape.querySelector('.rodape-topo').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
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
        montarRodape();
        ligarPesquisa();
        atualizarContador();
        atualizarAvatarTopo();
        mostrarPopupCadastro();
        const chat = document.createElement('script');
        chat.src = BASE + 'js/chat.js';
        document.body.appendChild(chat);
    });

    return { BASE, moeda, data, periodo, noites, img, todos, porId, destaques, destinos, servicos,
             buscar, renderizar, card, adicionar, remover, itensCarrinho, lerCarrinho,
             criarPerfil, lerPerfil, atualizarPerfil, excluirPerfil, entrar, sair,
             ehAdmin, sairAdmin, contas, cpfValido, PAGINA_ADMIN, PAGINA_PERFIL,
             CHAVE_MENSAGENS, listarConversas, minhaConversa, enviarDuvida, responderConversa,
             naoLidas, marcarLida, excluirConversa, adicionarConversas,
             salvarExtras, alterarSenha, atualizarAvatarTopo, CONTATO };
})();
