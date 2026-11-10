// Aba de perfil: login, cadastro e painel da conta (dados em js/catalogo.js)
const dados = document.getElementById('perfil-dados');
const form = document.getElementById('perfil-form');
const login = document.getElementById('login-form');
const avatarTopo = document.querySelector('.profile-avatar');
const titulo = document.getElementById('perfil-titulo');
const aviso = document.getElementById('perfil-aviso');
const salvar = document.getElementById('perfil-salvar');
const cancelar = document.getElementById('perfil-cancelar');
const camposSenha = document.getElementById('campos-senha');
const erroLogin = document.getElementById('erro-login');
const botaoEntrar = document.getElementById('login-entrar');
const formEndereco = document.getElementById('form-endereco');
const formPreferencias = document.getElementById('form-preferencias');
const formSenha = document.getElementById('form-senha');
const fotoArquivo = document.getElementById('foto-arquivo');
const fotoStatus = document.getElementById('foto-status');
const botaoPasta = document.getElementById('foto-pasta');
const botaoRemover = document.getElementById('foto-remover');
const CAMPOS = ['nome', 'cpf', 'nascimento', 'email', 'telefone', 'senha', 'confirmar'];
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const parametros = new URLSearchParams(location.search);

const formatarCpf = c => c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
const formatarTelefone = t => t.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
const formatarCep = c => c.replace(/(\d{5})(\d{3})/, '$1-$2');
const mesAno = iso => new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

UFS.forEach(uf => formEndereco.elements.uf.add(new Option(uf, uf)));
Catalogo.destinos().forEach(d => formPreferencias.elements.destino.add(new Option(d, d)));

function exibir(secao) {
    [dados, form, login].forEach(s => { s.hidden = s !== secao; });
    avatarTopo.hidden = secao === dados;
}

function mostrarErros(erros = {}) {
    [...CAMPOS, 'geral'].forEach(campo => {
        document.getElementById('erro-' + campo).textContent = erros[campo] || '';
        if (campo !== 'geral') form.elements[campo].setAttribute('aria-invalid', Boolean(erros[campo]));
    });
    const primeiro = CAMPOS.find(campo => erros[campo]);
    if (primeiro) form.elements[primeiro].focus();
}

// Erros e confirmação dos formulários do painel
function retorno(formulario, erros = {}, mensagem = '') {
    formulario.querySelectorAll('[data-erro]').forEach(el => { el.textContent = erros[el.dataset.erro] || ''; });
    formulario.querySelectorAll('input, select').forEach(el => el.setAttribute('aria-invalid', Boolean(erros[el.name])));
    const salvo = formulario.querySelector('.salvo');
    salvo.textContent = mensagem;
    if (mensagem) setTimeout(() => { if (salvo.textContent === mensagem) salvo.textContent = ''; }, 3000);
}

// ---------- Painel ----------
function mostrarFoto(p) {
    const img = document.getElementById('avatar-img');
    img.hidden = !p.foto;
    if (p.foto) img.src = p.foto;
    document.getElementById('avatar-icone').hidden = Boolean(p.foto);
    botaoRemover.hidden = !p.foto;
    botaoPasta.hidden = !p.foto || !('showDirectoryPicker' in window);
}

function completude(p) {
    const itens = [
        [Boolean(p.foto), 'adicione uma foto'],
        [Boolean(p.endereco?.cep && p.endereco?.cidade), 'preencha seu endereço'],
        [Boolean(p.preferencias), 'escolha suas preferências de contato']
    ];
    const pct = Math.round((2 + itens.filter(([ok]) => ok).length) / (2 + itens.length) * 100);
    const faltando = itens.filter(([ok]) => !ok).map(([, dica]) => dica);
    return { pct, dica: faltando.length ? 'Para completar: ' + faltando.join(', ') + '.' : 'Tudo preenchido. Obrigado!' };
}

function mostrarPerfil(p) {
    document.getElementById('hero-nome').textContent = p.nome;
    document.getElementById('hero-email').textContent = p.email;
    document.getElementById('hero-desde').textContent = p.criadoEm ? 'Cliente Oceanun desde ' + mesAno(p.criadoEm) : 'Cliente Oceanun';
    document.getElementById('ver-nome').textContent = p.nome;
    document.getElementById('ver-cpf').textContent = formatarCpf(p.cpf);
    document.getElementById('ver-nascimento').textContent = Catalogo.data(p.nascimento);
    document.getElementById('ver-email').textContent = p.email;
    document.getElementById('ver-telefone').textContent = '+55 ' + formatarTelefone(p.telefone);
    mostrarFoto(p);

    const { pct, dica } = completude(p);
    document.getElementById('completo-pct').textContent = pct + '%';
    document.getElementById('completo-barra').style.width = pct + '%';
    document.getElementById('completo-dica').textContent = dica;
    const conversa = Catalogo.minhaConversa();
    const novas = Catalogo.naoLidas(conversa, 'cliente');
    document.getElementById('resumo-desde').textContent = p.criadoEm ? Catalogo.data(p.criadoEm.slice(0, 10)) : '-';
    document.getElementById('resumo-carrinho').textContent = Catalogo.lerCarrinho().length;
    document.getElementById('resumo-mensagens').textContent = (conversa ? conversa.mensagens.length : 0) + (novas ? ` (${novas} nova${novas > 1 ? 's' : ''})` : '');

    const e = p.endereco || {};
    formEndereco.elements.cep.value = e.cep ? formatarCep(e.cep) : '';
    ['rua', 'numero', 'complemento', 'cidade', 'uf'].forEach(campo => { formEndereco.elements[campo].value = e[campo] || ''; });
    const pref = p.preferencias || {};
    formPreferencias.elements.email.checked = Boolean(pref.email);
    formPreferencias.elements.whatsapp.checked = Boolean(pref.whatsapp);
    formPreferencias.elements.destino.value = pref.destino || '';
    formSenha.reset();
    [formEndereco, formPreferencias, formSenha].forEach(f => retorno(f));
    exibir(dados);
}

// ---------- Foto de perfil ----------
// A imagem é recortada em quadrado e reduzida para 256 px antes de ser guardada
async function prepararFoto(arquivo) {
    if (!/^image\/(png|jpeg|webp)$/.test(arquivo.type)) throw new Error('Use uma imagem PNG, JPG ou WEBP.');
    if (arquivo.size > 10 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 10 MB.');
    const imagem = await createImageBitmap(arquivo);
    const lado = Math.min(imagem.width, imagem.height);
    const tela = document.createElement('canvas');
    tela.width = tela.height = 256;
    tela.getContext('2d').drawImage(imagem, (imagem.width - lado) / 2, (imagem.height - lado) / 2, lado, lado, 0, 0, 256, 256);
    imagem.close();
    const blob = await new Promise(resolve => tela.toBlob(resolve, 'image/jpeg', 0.85));
    return { dataUrl: tela.toDataURL('image/jpeg', 0.85), blob };
}

// A pasta escolhida fica lembrada (IndexedDB) para as próximas gravações
const BANCO_PASTA = 'oceanun-pasta-perfil';
function bancoPasta(modo, valor) {
    return new Promise((resolve, reject) => {
        const pedido = indexedDB.open(BANCO_PASTA, 1);
        pedido.onupgradeneeded = () => pedido.result.createObjectStore('pastas');
        pedido.onerror = () => reject(pedido.error);
        pedido.onsuccess = () => {
            const loja = pedido.result.transaction('pastas', modo).objectStore('pastas');
            const acao = modo === 'readonly' ? loja.get('perfil') : loja.put(valor, 'perfil');
            acao.onsuccess = () => resolve(acao.result);
            acao.onerror = () => reject(acao.error);
        };
    });
}

// Aceita a própria pasta perfil, a pasta img ou a pasta Website
async function chegarEmPerfil(pasta) {
    if (pasta.name === 'perfil') return pasta;
    if (pasta.name === 'img') return pasta.getDirectoryHandle('perfil', { create: true });
    if (pasta.name === 'Website') return (await pasta.getDirectoryHandle('img', { create: true })).getDirectoryHandle('perfil', { create: true });
    return null;
}

async function pastaAutorizada(pedirAoUsuario) {
    let pasta = null;
    try { pasta = await bancoPasta('readonly'); } catch {}
    if (pasta) {
        let permissao = await pasta.queryPermission({ mode: 'readwrite' });
        if (permissao !== 'granted' && pedirAoUsuario) permissao = await pasta.requestPermission({ mode: 'readwrite' });
        if (permissao === 'granted') return pasta;
        if (!pedirAoUsuario) return null;
    }
    if (!pedirAoUsuario) return null;
    const escolhida = await chegarEmPerfil(await window.showDirectoryPicker({ id: 'oceanun-perfil', mode: 'readwrite' }));
    if (!escolhida) throw new Error('Escolha a pasta Website/img/perfil do projeto.');
    try { await bancoPasta('readwrite', escolhida); } catch {}
    return escolhida;
}

const nomeArquivo = p => 'foto-' + p.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.jpg';
let ultimoBlob = null;

async function gravarNaPasta(pedirAoUsuario) {
    if (!('showDirectoryPicker' in window) || !ultimoBlob) return false;
    const pasta = await pastaAutorizada(pedirAoUsuario);
    if (!pasta) return false;
    const nome = nomeArquivo(Catalogo.lerPerfil());
    const escritor = await (await pasta.getFileHandle(nome, { create: true })).createWritable();
    await escritor.write(ultimoBlob);
    await escritor.close();
    fotoStatus.textContent = `Foto gravada em img/perfil/${nome}.`;
    return true;
}

async function blobDaFotoSalva() {
    const foto = Catalogo.lerPerfil()?.foto;
    return foto ? (await fetch(foto)).blob() : null;
}

document.getElementById('foto-escolher').addEventListener('click', () => fotoArquivo.click());
fotoArquivo.addEventListener('change', async () => {
    const arquivo = fotoArquivo.files[0];
    fotoArquivo.value = '';
    if (!arquivo) return;
    try {
        const { dataUrl, blob } = await prepararFoto(arquivo);
        const resultado = Catalogo.salvarExtras({ foto: dataUrl });
        if (!resultado.ok) throw new Error(resultado.erros.foto || resultado.erros.geral);
        ultimoBlob = blob;
        mostrarPerfil(resultado.perfil);
        fotoStatus.textContent = 'Foto atualizada.';
        // Se a pasta já foi autorizada antes, grava a cópia sem perguntar de novo
        try { await gravarNaPasta(false); } catch {}
    } catch (erro) {
        fotoStatus.textContent = erro.message || 'Não foi possível usar esta imagem.';
    }
});

botaoPasta.addEventListener('click', async () => {
    try {
        ultimoBlob = ultimoBlob || await blobDaFotoSalva();
        if (!await gravarNaPasta(true)) fotoStatus.textContent = 'A gravação na pasta não foi autorizada.';
    } catch (erro) {
        if (erro.name !== 'AbortError') fotoStatus.textContent = erro.message || 'Não foi possível gravar na pasta.';
    }
});

botaoRemover.addEventListener('click', async () => {
    const nome = nomeArquivo(Catalogo.lerPerfil());
    const resultado = Catalogo.salvarExtras({ foto: null });
    if (!resultado.ok) return;
    ultimoBlob = null;
    mostrarPerfil(resultado.perfil);
    fotoStatus.textContent = 'Foto removida.';
    try {
        const pasta = await pastaAutorizada(false);
        if (pasta) await pasta.removeEntry(nome);
    } catch {}
});

// ---------- Formulários do painel ----------
formEndereco.addEventListener('submit', e => {
    e.preventDefault();
    const resultado = Catalogo.salvarExtras({ endereco: Object.fromEntries(new FormData(formEndereco)) });
    if (!resultado.ok) { retorno(formEndereco, resultado.erros); return; }
    mostrarPerfil(resultado.perfil);
    retorno(formEndereco, {}, 'Endereço salvo.');
});

formPreferencias.addEventListener('submit', e => {
    e.preventDefault();
    const f = formPreferencias.elements;
    const resultado = Catalogo.salvarExtras({ preferencias: { email: f.email.checked, whatsapp: f.whatsapp.checked, destino: f.destino.value } });
    if (!resultado.ok) return;
    mostrarPerfil(resultado.perfil);
    retorno(formPreferencias, {}, 'Preferências salvas.');
});

formSenha.addEventListener('submit', async e => {
    e.preventDefault();
    const f = formSenha.elements;
    const botao = formSenha.querySelector('button[type=submit]');
    botao.disabled = true;
    const resultado = await Catalogo.alterarSenha(f.atual.value, f.nova.value, f.confirmar.value);
    botao.disabled = false;
    if (!resultado.ok) { retorno(formSenha, resultado.erros); return; }
    formSenha.reset();
    retorno(formSenha, {}, 'Senha alterada.');
});

document.getElementById('abrir-chat').addEventListener('click', () => document.getElementById('chat')?.click());

// ---------- Login, cadastro e edição ----------
function mostrarLogin() {
    login.reset();
    erroLogin.textContent = '';
    exibir(login);
}

function mostrarFormulario(p) {
    form.reset();
    mostrarErros();
    titulo.textContent = p ? 'Editar dados pessoais' : 'Criar conta';
    salvar.textContent = p ? 'Salvar alterações' : 'Criar conta';
    aviso.hidden = Boolean(p);
    camposSenha.hidden = Boolean(p);
    cancelar.hidden = !p;
    if (p) {
        form.elements.nome.value = p.nome;
        form.elements.cpf.value = formatarCpf(p.cpf);
        form.elements.nascimento.value = p.nascimento;
        form.elements.email.value = p.email;
        form.elements.telefone.value = formatarTelefone(p.telefone);
    }
    exibir(form);
}

// Depois de entrar ou cadastrar, volta para a página de onde veio o popup (só do próprio site)
function concluirAcesso(perfil) {
    const voltar = parametros.get('voltar');
    if (voltar && voltar.startsWith(Catalogo.BASE)) location.href = voltar;
    else {
        Catalogo.atualizarAvatarTopo();
        mostrarPerfil(perfil);
    }
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    const valores = Object.fromEntries(new FormData(form));
    if (Catalogo.lerPerfil()) {
        const resultado = Catalogo.atualizarPerfil(valores);
        if (resultado.ok) mostrarPerfil(resultado.perfil);
        else mostrarErros(resultado.erros);
        return;
    }
    salvar.disabled = true;
    const resultado = await Catalogo.criarPerfil(valores);
    salvar.disabled = false;
    if (resultado.ok) concluirAcesso(resultado.perfil);
    else mostrarErros(resultado.erros);
});

login.addEventListener('submit', async e => {
    e.preventDefault();
    botaoEntrar.disabled = true;
    const resultado = await Catalogo.entrar(login.elements.email.value, login.elements.senha.value);
    botaoEntrar.disabled = false;
    if (resultado.admin) location.href = Catalogo.PAGINA_ADMIN;
    else if (resultado.ok) concluirAcesso(resultado.perfil);
    else erroLogin.textContent = resultado.erros.geral;
});

document.getElementById('ir-cadastro').addEventListener('click', () => mostrarFormulario(null));
document.getElementById('ir-login').addEventListener('click', mostrarLogin);
document.getElementById('perfil-editar').addEventListener('click', () => mostrarFormulario(Catalogo.lerPerfil()));
cancelar.addEventListener('click', () => mostrarPerfil(Catalogo.lerPerfil()));
document.getElementById('perfil-sair').addEventListener('click', () => {
    Catalogo.sair();
    Catalogo.atualizarAvatarTopo();
    fotoStatus.textContent = '';
    mostrarLogin();
});
document.getElementById('perfil-excluir').addEventListener('click', () => {
    if (!confirm('Excluir sua conta? Seus dados serão apagados deste navegador.')) return;
    Catalogo.excluirPerfil();
    Catalogo.atualizarAvatarTopo();
    mostrarLogin();
});

const perfilLogado = Catalogo.lerPerfil();
if (Catalogo.ehAdmin()) location.replace(Catalogo.PAGINA_ADMIN);
else if (perfilLogado) mostrarPerfil(perfilLogado);
else if (parametros.get('modo') === 'cadastro') mostrarFormulario(null);
else mostrarLogin();
