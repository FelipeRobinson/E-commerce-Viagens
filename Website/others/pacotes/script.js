// Busca/filtro de pacotes. Os filtros também podem vir pela URL:
//   ?q=texto  &destino=  &servico=  &inicio=AAAA-MM-DD  &pessoas=  &max=  &destaque=1
const form = document.getElementById('filtros');

// Preenche as opções com o que existe na biblioteca
Catalogo.destinos().forEach(d => form.destino.add(new Option(d, d)));
Catalogo.servicos().forEach(s => form.servico.add(new Option(s, s)));

// Aplica os parâmetros da URL no formulário
const params = new URLSearchParams(location.search);
for (const [k, v] of params) {
    const campo = form.elements[k];
    if (!campo) continue;
    if (campo.type === 'checkbox') campo.checked = v === '1';
    else campo.value = v;
}

function aplicar() {
    const lista = Catalogo.buscar({
        texto: form.q.value.trim(),
        destino: form.destino.value,
        servico: form.servico.value,
        dataInicio: form.inicio.value,
        pessoas: form.pessoas.value,
        valorMax: form.max.value,
        destaque: form.destaque.checked
    });
    Catalogo.renderizar('#cards', lista);
    document.getElementById('contagem').textContent =
        `${lista.length} pacote${lista.length === 1 ? '' : 's'} encontrado${lista.length === 1 ? '' : 's'}`;
}

form.addEventListener('input', aplicar);
form.addEventListener('submit', e => { e.preventDefault(); aplicar(); });
form.addEventListener('reset', () => setTimeout(aplicar));
aplicar();
