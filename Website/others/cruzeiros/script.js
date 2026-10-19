document.addEventListener('DOMContentLoaded', () => {
    const cartButtons = document.querySelectorAll('.add-to-cart');
    const cartCountElement = document.getElementById('cart-count');
    let cartCount = 0;

    cartButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the cruise name from the sibling h3
            const cruiseName = button.closest('.card-info').querySelector('.cruise-name').innerText;

            cartCount++;
            updateCartUI();

            // Visual feedback
            button.innerText = 'Adicionado!';
            button.style.backgroundColor = '#4CAF50'; // Green
            button.style.color = 'white';

            setTimeout(() => {
                button.innerText = 'Adicionar ao Carrinho';
                button.style.backgroundColor = '';
                button.style.color = '';
            }, 1500);

            console.log(`Added ${cruiseName} to cart. Total items: ${cartCount}`);
        });
    });

    function updateCartUI() {
        if (cartCountElement) {
            cartCountElement.innerText = cartCount;
        }
    }
});
