// Seleção do tipo de viagem
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        document.querySelector('.volta').style.display =
            chip.textContent === 'Só ida' ? 'none' : '';
    });
});

// Inverter origem e destino
document.getElementById('swap').addEventListener('click', () => {
    const origem = document.getElementById('origem');
    const destino = document.getElementById('destino');
    [origem.value, destino.value] = [destino.value, origem.value];
});