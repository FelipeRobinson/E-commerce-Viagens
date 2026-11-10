// Assistente automático do site. Carregado em todas as páginas por catalogo.js.
// Não usa servidor: as respostas vêm de regras simples e dos dados de pacotes-db.js.
// No modo "equipe", a dúvida vai para a aba Mensagens do painel administrativo.
(() => {
    const BASE = Catalogo.BASE;
    const CHAVE = 'oceanun-chat';
    const CHAVE_MODO = 'oceanun-chat-modo';
    const MAX_MENSAGENS = 40;
    const LINK = {
        pacotes: BASE + 'others/pacotes/index.html',
        carrinho: BASE + 'others/carrinho/index.html',
        orcamento: BASE + 'others/orcamento/index.html',
        ajuda: BASE + 'others/perfil/ajuda/index.html',
        whatsapp: Catalogo.CONTATO.whatsapp
    };
    const OPCOES = ['Pacotes imperdíveis', 'Mais baratos', 'Quais destinos?', 'Falar com atendente'];

    // Palavras comuns que não ajudam a encontrar um pacote
    const IGNORAR = new Set(('ate mil reais menos mais abaixo maximo quero queria gostaria preciso procuro busco tem tens voce voces para pra por com sem uma uns umas ' +
        'dos das que qual quais como onde quando quanto custa ver mostrar mostre favor ola bom boa dia tarde noite ' +
        'viagem viagens viajar ir cruzeiro cruzeiros navio navios pacote pacotes porto saindo destino destinos embarque pessoa pessoas').split(' '));

    const normalizar = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const ids = lista => lista.slice(0, 3).map(p => p.id);

    let historico = [];
    try { historico = JSON.parse(sessionStorage.getItem(CHAVE)) || []; } catch {}

    function salvar() {
        historico = historico.slice(-MAX_MENSAGENS);
        try { sessionStorage.setItem(CHAVE, JSON.stringify(historico)); } catch {}
    }

    // ---------- Respostas ----------
    function valorMaximo(t) {
        const m = t.match(/(?:ate|menos de|abaixo de|maximo(?: de)?)\s*(?:r\$\s*)?(\d[\d.]*)\s*(mil)?/);
        if (!m) return null;
        return Number(m[1].replace(/\./g, '')) * (m[2] ? 1000 : 1);
    }

    function buscarPorPalavras(t) {
        const palavras = t.split(/[^a-z0-9]+/).filter(p => p.length >= 3 && !IGNORAR.has(p));
        if (!palavras.length) return [];
        const pontos = new Map();
        palavras.forEach(p => Catalogo.buscar({ texto: p }).forEach(x => pontos.set(x, (pontos.get(x) || 0) + 1)));
        return [...pontos.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
    }

    function responder(mensagem) {
        const t = normalizar(mensagem);
        const tem = re => re.test(t);

        if (tem(/atendente|humano|whatsapp|falar com|telefone|contato|equipe|duvida/)) return {
            texto: 'Você pode mandar sua dúvida para a nossa equipe aqui mesmo no site ou falar pelo WhatsApp:',
            links: [{ rotulo: 'Enviar dúvida pelo site', acao: 'equipe' }, { rotulo: 'Abrir WhatsApp', url: LINK.whatsapp }]
        };
        if (tem(/carrinho/)) {
            const n = Catalogo.lerCarrinho().length;
            return {
                texto: n ? `Você tem ${n} pacote${n > 1 ? 's' : ''} no carrinho.` : 'Seu carrinho está vazio por enquanto.',
                links: [{ rotulo: 'Ir para o carrinho', url: LINK.carrinho }]
            };
        }
        if (tem(/orcamento|personalizad/)) return {
            texto: 'Você pode pedir um orçamento sob medida neste formulário:',
            links: [{ rotulo: 'Solicitar orçamento', url: LINK.orcamento }]
        };
        if (tem(/pagamento|pagar|parcel|cartao|boleto|pix|reembolso|cancelar|cancelamento|document|passaporte|visto|bagagem|mala/)) return {
            texto: 'Reunimos as orientações sobre reservas, pagamentos, documentação e bagagens na Central de Ajuda.',
            links: [{ rotulo: 'Abrir Central de Ajuda', url: LINK.ajuda }, { rotulo: 'Falar no WhatsApp', url: LINK.whatsapp }]
        };
        if (tem(/imperdive|destaque|promo|oferta/)) return {
            texto: 'Estes são os nossos imperdíveis:',
            pacotes: ids(Catalogo.destaques()),
            links: [{ rotulo: 'Ver todos', url: LINK.pacotes + '?destaque=1' }]
        };
        if (tem(/barat|economic/)) return {
            texto: 'Os pacotes com menor preço agora:',
            pacotes: ids(Catalogo.todos().sort((a, b) => a.valor - b.valor))
        };

        const max = valorMaximo(t);
        const achados = buscarPorPalavras(max ? t.replace(/\d[\d.]*/g, '') : t);
        if (max) {
            const base = achados.length ? achados : Catalogo.todos();
            const lista = base.filter(p => p.valor <= max).sort((a, b) => a.valor - b.valor);
            return lista.length
                ? { texto: `Encontrei ${lista.length} opção(ões) até ${Catalogo.moeda(max)}:`, pacotes: ids(lista) }
                : { texto: `Não encontrei pacotes até ${Catalogo.moeda(max)}. Quer pedir um orçamento?`,
                    links: [{ rotulo: 'Solicitar orçamento', url: LINK.orcamento }] };
        }
        if (achados.length) return {
            texto: achados.length > 3 ? `Encontrei ${achados.length} pacotes. Os mais relevantes:` : 'Olha o que encontrei:',
            pacotes: ids(achados),
            links: achados.length > 3 ? [{ rotulo: 'Ver todos os pacotes', url: LINK.pacotes }] : []
        };
        if (tem(/destino|onde|lugar/)) return {
            texto: `Temos pacotes para: ${Catalogo.destinos().join(', ')}. Digite um deles para ver as opções.`
        };
        if (tem(/\b(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/)) return {
            texto: 'Olá! Me diga um destino, um navio ou um valor, como "até 3 mil".', opcoes: OPCOES
        };
        if (tem(/obrigad|valeu/)) return { texto: 'Por nada! Boa viagem.', opcoes: OPCOES };

        return {
            texto: 'Não entendi. Tente um destino, um navio, um serviço como "piscina" ou um valor como "até 3 mil".',
            opcoes: OPCOES
        };
    }

    // ---------- Interface ----------
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = BASE + 'css/chat.css';
    document.head.appendChild(css);

    function criar(tag, classe, texto) {
        const el = document.createElement(tag);
        if (classe) el.className = classe;
        if (texto !== undefined) el.textContent = texto;
        return el;
    }

    let botao = document.getElementById('chat');
    if (!botao) {
        botao = criar('button');
        botao.id = 'chat';
        botao.setAttribute('aria-label', 'ChatBot');
        botao.innerHTML = '<i class="fa-solid fa-comments"></i>';
        document.body.appendChild(botao);
    }
    const selo = criar('span', 'chat-selo');
    selo.hidden = true;
    botao.append(selo);

    // Para o administrador, o botão leva às mensagens dos clientes
    if (Catalogo.ehAdmin()) {
        botao.setAttribute('aria-label', 'Mensagens dos clientes');
        botao.addEventListener('click', () => { location.href = Catalogo.PAGINA_ADMIN + '#mensagens'; });
        const atualizarSeloAdmin = () => {
            const n = Catalogo.listarConversas().filter(c => Catalogo.naoLidas(c, 'admin')).length;
            selo.textContent = n;
            selo.hidden = !n;
        };
        window.addEventListener('storage', atualizarSeloAdmin);
        window.addEventListener('hashchange', atualizarSeloAdmin);
        botao.addEventListener('oceanun-mensagens', atualizarSeloAdmin);
        atualizarSeloAdmin();
        return;
    }
    botao.setAttribute('aria-expanded', 'false');

    let modo = 'bot';
    try { modo = sessionStorage.getItem(CHAVE_MODO) || 'bot'; } catch {}

    const painel = criar('section', 'chat-painel');
    painel.hidden = true;
    painel.setAttribute('role', 'dialog');
    painel.setAttribute('aria-label', 'Conversa com o assistente Oceanun');
    painel.innerHTML = `
        <header class="chat-topo">
            <div>
                <strong>Oceanun</strong>
                <small class="chat-subtitulo"></small>
            </div>
            <button type="button" class="chat-modo"><i class="fa-solid"></i></button>
            <button type="button" class="chat-limpar" aria-label="Nova conversa" title="Nova conversa"><i class="fa-solid fa-rotate-right"></i></button>
            <button type="button" class="chat-fechar" aria-label="Fechar conversa" title="Fechar"><i class="fa-solid fa-xmark"></i></button>
        </header>
        <div class="chat-mensagens" aria-live="polite"></div>
        <form class="chat-envio">
            <input type="text" placeholder="Escreva sua mensagem" aria-label="Mensagem" maxlength="200" autocomplete="off">
            <button type="submit" aria-label="Enviar"><i class="fa-solid fa-paper-plane"></i></button>
        </form>`;
    document.body.appendChild(painel);

    const areaMensagens = painel.querySelector('.chat-mensagens');
    const form = painel.querySelector('form');
    const campo = form.querySelector('input');

    function cartao(id) {
        const p = Catalogo.porId(id);
        if (!p) return null;
        const el = criar('article', 'chat-pacote');
        const foto = criar('img');
        foto.src = Catalogo.img(p);
        foto.alt = 'Navio ' + p.navio;
        const info = criar('div');
        info.append(
            criar('strong', '', p.navio),
            criar('small', '', `${p.destino} · ${Catalogo.periodo(p)}`),
            criar('span', 'chat-preco', Catalogo.moeda(p.valor))
        );
        const adicionar = criar('button', 'chat-adicionar', 'Adicionar');
        adicionar.type = 'button';
        adicionar.addEventListener('click', () => {
            Catalogo.adicionar(p.id);
            adicionar.textContent = 'Adicionado!';
            adicionar.disabled = true;
            setTimeout(() => { adicionar.textContent = 'Adicionar'; adicionar.disabled = false; }, 1500);
        });
        info.append(adicionar);
        el.append(foto, info);
        return el;
    }

    function desenharMensagem(m) {
        const linha = criar('div', 'chat-linha ' + m.de);
        linha.append(criar('p', 'chat-balao', m.texto));
        (m.pacotes || []).map(cartao).filter(Boolean).forEach(c => linha.append(c));
        if (m.links && m.links.length) {
            const links = criar('div', 'chat-links');
            m.links.forEach(l => {
                if (l.acao === 'equipe') {
                    const b = criar('button', '', l.rotulo);
                    b.type = 'button';
                    b.addEventListener('click', () => mudarModo('equipe'));
                    links.append(b);
                    return;
                }
                const a = criar('a', '', l.rotulo);
                a.href = l.url;
                if (l.url === LINK.whatsapp) { a.target = '_blank'; a.rel = 'noopener'; }
                links.append(a);
            });
            linha.append(links);
        }
        areaMensagens.append(linha);
    }

    function desenharOpcoes() {
        areaMensagens.querySelector('.chat-opcoes')?.remove();
        const ultima = historico[historico.length - 1];
        if (!ultima || !ultima.opcoes) return;
        const area = criar('div', 'chat-opcoes');
        ultima.opcoes.forEach(texto => {
            const b = criar('button', '', texto);
            b.type = 'button';
            b.addEventListener('click', () => enviar(texto));
            area.append(b);
        });
        areaMensagens.append(area);
    }

    const rolar = () => { areaMensagens.scrollTop = areaMensagens.scrollHeight; };

    function registrar(m) {
        historico.push(m);
        salvar();
        desenharMensagem(m);
        desenharOpcoes();
        rolar();
    }

    let pensando = false;
    function enviar(texto) {
        if (pensando) return;
        pensando = true;
        registrar({ de: 'usuario', texto });
        const digitando = criar('div', 'chat-digitando');
        digitando.setAttribute('aria-label', 'Digitando');
        digitando.innerHTML = '<span></span><span></span><span></span>';
        areaMensagens.append(digitando);
        rolar();
        setTimeout(() => {
            digitando.remove();
            registrar({ de: 'bot', ...responder(texto) });
            pensando = false;
        }, 500);
    }

    // ---------- Conversa com a equipe ----------
    const botaoModo = painel.querySelector('.chat-modo');
    const botaoLimpar = painel.querySelector('.chat-limpar');

    function atualizarSelo() {
        const n = Catalogo.naoLidas(Catalogo.minhaConversa(), 'cliente');
        const visivel = n > 0 && !(estaAberto() && modo === 'equipe');
        selo.textContent = n;
        selo.hidden = !visivel;
    }

    function desenharEquipe() {
        const conversa = Catalogo.minhaConversa();
        areaMensagens.innerHTML = '';
        desenharMensagem({ de: 'bot', texto: 'Escreva sua dúvida e a equipe Oceanun responde por aqui. Fique à vontade para voltar depois para ver a resposta.' });
        (conversa ? conversa.mensagens : []).forEach(m => desenharMensagem({ de: m.de === 'cliente' ? 'usuario' : 'bot', texto: m.texto }));
        if (conversa && estaAberto() && Catalogo.naoLidas(conversa, 'cliente')) Catalogo.marcarLida(conversa.id, 'cliente');
        atualizarSelo();
        rolar();
    }

    function mudarModo(novo) {
        modo = novo;
        try { sessionStorage.setItem(CHAVE_MODO, modo); } catch {}
        iniciar();
        campo.focus();
    }

    function iniciar() {
        const equipe = modo === 'equipe';
        painel.querySelector('.chat-subtitulo').textContent = equipe ? 'Dúvidas com a equipe' : 'Assistente automático';
        painel.setAttribute('aria-label', equipe ? 'Conversa com a equipe Oceanun' : 'Conversa com o assistente Oceanun');
        botaoModo.setAttribute('aria-label', equipe ? 'Voltar ao assistente automático' : 'Enviar dúvida para a equipe');
        botaoModo.title = botaoModo.getAttribute('aria-label');
        botaoModo.querySelector('i').className = 'fa-solid ' + (equipe ? 'fa-robot' : 'fa-headset');
        botaoLimpar.hidden = equipe;
        campo.placeholder = equipe ? 'Escreva sua dúvida para a equipe' : 'Escreva sua mensagem';
        campo.maxLength = equipe ? 500 : 200;
        if (equipe) { desenharEquipe(); return; }
        areaMensagens.innerHTML = '';
        historico.forEach(desenharMensagem);
        if (!historico.length) {
            registrar({
                de: 'bot',
                texto: 'Olá! Sou o assistente automático da Oceanun. Posso ajudar a encontrar o seu próximo cruzeiro.',
                opcoes: OPCOES
            });
        } else {
            desenharOpcoes();
        }
    }

    const estaAberto = () => painel.classList.contains('aberto');
    let timerFechar;

    function alternar(abrir) {
        clearTimeout(timerFechar);
        if (abrir) {
            painel.hidden = false;
            void painel.offsetWidth; // aplica o estado inicial para a transição de abertura rodar
            painel.classList.add('aberto');
            // Se a equipe respondeu, abre direto na conversa com ela
            if (Catalogo.naoLidas(Catalogo.minhaConversa(), 'cliente') && modo !== 'equipe') mudarModo('equipe');
            else if (modo === 'equipe') desenharEquipe();
        } else {
            painel.classList.remove('aberto');
            timerFechar = setTimeout(() => { painel.hidden = true; }, 180); // mesma duração do fechamento no chat.css
        }
        botao.setAttribute('aria-expanded', String(abrir));
        atualizarSelo();
        const icone = botao.querySelector('i');
        icone.classList.toggle('fa-comments', !abrir);
        icone.classList.toggle('fa-xmark', abrir);
        if (abrir) { rolar(); campo.focus(); } else { botao.focus(); }
    }

    botao.addEventListener('click', () => alternar(!estaAberto()));
    painel.querySelector('.chat-fechar').addEventListener('click', () => alternar(false));
    painel.querySelector('.chat-limpar').addEventListener('click', () => {
        if (pensando) return;
        historico = [];
        salvar();
        iniciar();
        campo.focus();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && estaAberto()) alternar(false);
    });
    botaoModo.addEventListener('click', () => mudarModo(modo === 'equipe' ? 'bot' : 'equipe'));
    form.addEventListener('submit', e => {
        e.preventDefault();
        const texto = campo.value.trim();
        if (!texto || pensando) return;
        campo.value = '';
        if (modo !== 'equipe') { enviar(texto); return; }
        if (Catalogo.enviarDuvida(texto)) desenharEquipe();
        else desenharMensagem({ de: 'bot', texto: 'Não foi possível enviar sua dúvida neste navegador. Tente pelo WhatsApp.' });
    });

    // Respostas da equipe chegam mesmo com o site aberto em outra aba
    window.addEventListener('storage', e => {
        if (e.key !== Catalogo.CHAVE_MENSAGENS) return;
        if (modo === 'equipe' && estaAberto()) desenharEquipe();
        else atualizarSelo();
    });

    iniciar();
    atualizarSelo();
})();
