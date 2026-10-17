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
