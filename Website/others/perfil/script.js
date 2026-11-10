// Aba de perfil: login, cadastro, visualização, edição e exclusão da conta (dados em js/catalogo.js)
const dados = document.getElementById('perfil-dados');
const form = document.getElementById('perfil-form');
const login = document.getElementById('login-form');
const titulo = document.getElementById('perfil-titulo');
const aviso = document.getElementById('perfil-aviso');
const salvar = document.getElementById('perfil-salvar');
const cancelar = document.getElementById('perfil-cancelar');
const camposSenha = document.getElementById('campos-senha');
const erroLogin = document.getElementById('erro-login');
const botaoEntrar = document.getElementById('login-entrar');
const CAMPOS = ['nome', 'cpf', 'nascimento', 'email', 'telefone', 'senha', 'confirmar'];
const parametros = new URLSearchParams(location.search);

const formatarCpf = c => c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
const formatarTelefone = t => t.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');

function exibir(secao) {
    [dados, form, login].forEach(s => { s.hidden = s !== secao; });
}

function mostrarErros(erros = {}) {
    [...CAMPOS, 'geral'].forEach(campo => {
        document.getElementById('erro-' + campo).textContent = erros[campo] || '';
        if (campo !== 'geral') form.elements[campo].setAttribute('aria-invalid', Boolean(erros[campo]));
    });
    const primeiro = CAMPOS.find(campo => erros[campo]);
    if (primeiro) form.elements[primeiro].focus();
}

function mostrarPerfil(p) {
    document.getElementById('ver-nome').textContent = p.nome;
    document.getElementById('ver-cpf').textContent = formatarCpf(p.cpf);
    document.getElementById('ver-nascimento').textContent = Catalogo.data(p.nascimento);
    document.getElementById('ver-email').textContent = p.email;
    document.getElementById('ver-telefone').textContent = '+55 ' + formatarTelefone(p.telefone);
    exibir(dados);
}

function mostrarLogin() {
    login.reset();
    erroLogin.textContent = '';
    exibir(login);
}

function mostrarFormulario(p) {
    form.reset();
    mostrarErros();
    titulo.textContent = p ? 'Editar perfil' : 'Criar conta';
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
    else mostrarPerfil(perfil);
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
    mostrarLogin();
});
document.getElementById('perfil-excluir').addEventListener('click', () => {
    if (!confirm('Excluir sua conta? Seus dados serão apagados deste navegador.')) return;
    Catalogo.excluirPerfil();
    mostrarLogin();
});

const perfilLogado = Catalogo.lerPerfil();
if (Catalogo.ehAdmin()) location.replace(Catalogo.PAGINA_ADMIN);
else if (perfilLogado) mostrarPerfil(perfilLogado);
else if (parametros.get('modo') === 'cadastro') mostrarFormulario(null);
else mostrarLogin();
