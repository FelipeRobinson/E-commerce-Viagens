document.addEventListener('DOMContentLoaded', () => {
    const cartButtons = document.querySelectorAll('.add-to-cart');
    const cartCountElement = document.getElementById('cart-count');
    let cartCount = 0;

    cartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pacoteName = button.closest('.card-info').querySelector('.pacote-name').innerText;

            cartCount++;
            updateCartUI();

            button.innerText = 'Adicionado!';
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';

            setTimeout(() => {
                button.innerText = 'Adicionar ao Carrinho';
                button.style.backgroundColor = '';
                button.style.color = '';
            }, 1500);

            console.log(`Added ${pacoteName} to cart. Total items: ${cartCount}`);
        });
    });

    function updateCartUI() {
        if (cartCountElement) {
            cartCountElement.innerText = cartCount;
        }
    }
});
