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

// Funcionalidade de Adicionar ao Carrinho
document.addEventListener('DOMContentLoaded', () => {
    const cartButtons = document.querySelectorAll('.add-to-cart');
    const cartCountElement = document.getElementById('cart-count');
    let cartCount = 0;

    cartButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the item name from the sibling h3
            const itemName = button.closest('.card-info').querySelector('h3').innerText;

            cartCount++;
            updateCartUI();

            // Visual feedback
            const originalText = button.innerText;
            button.innerText = 'Adicionado!';
            button.style.backgroundColor = '#4CAF50'; // Green
            button.style.color = 'white';

            setTimeout(() => {
                button.innerText = originalText;
                button.style.backgroundColor = '';
                button.style.color = '';
            }, 1500);

            console.log(`Added ${itemName} to cart. Total items: ${cartCount}`);
        });
    });

    function updateCartUI() {
        if (cartCountElement) {
            cartCountElement.innerText = cartCount;
        }
    }
});
