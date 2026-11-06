// Seleção do tipo de viagem
document.querySelectorAll('.opcao').forEach(opcao => {
    opcao.addEventListener('click', () => {
        document.querySelectorAll('.opcao').forEach(o => o.classList.remove('ativo'));
        opcao.classList.add('ativo');
        document.getElementById('volta').style.display =
            opcao.textContent === 'Só ida' ? 'none' : '';
    });
});

// Inverter origem e destino
document.getElementById('trocar').addEventListener('click', () => {
    const origem = document.getElementById('origem');
    const destino = document.getElementById('destino');
    [origem.value, destino.value] = [destino.value, origem.value];
});

// "Pacotes imperdíveis": vêm da biblioteca js/pacotes-db.js (destaque: true)
Catalogo.renderizar('#cards', Catalogo.destaques());

// Formulário de reserva -> busca na página de pacotes
document.getElementById('form-reserva').addEventListener('submit', e => {
    e.preventDefault();
    const params = new URLSearchParams();
    const destino = document.getElementById('destino').value.trim();
    const ida = document.getElementById('ida').value;
    const viajantes = document.getElementById('viajantes').value;
    if (destino) params.set('q', destino);
    if (ida) params.set('inicio', ida);
    if (viajantes > 1) params.set('pessoas', viajantes);
    window.location.href = 'others/pacotes/index.html?' + params;
});
