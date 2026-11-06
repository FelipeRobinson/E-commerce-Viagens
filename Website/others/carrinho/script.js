// Carrinho: os itens salvos (ids) são buscados na biblioteca js/pacotes-db.js
const container = document.getElementById('cart-items');
const total = document.getElementById('cart-total');

function desenhar() {
    const itens = Catalogo.itensCarrinho();
    total.textContent = Catalogo.moeda(itens.reduce((s, p) => s + p.valor, 0));
    if (!itens.length) {
        container.innerHTML = '<p class="empty-cart">Seu carrinho está vazio.</p>';
        return;
    }
    container.innerHTML = '';
    itens.forEach(p => {
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <div class="cart-item-info">
                <h3><i class="fa-solid fa-ship"></i> ${p.navio}</h3>
                <p>${p.descricao} Do dia ${Catalogo.data(p.dataIda)} até o dia ${Catalogo.data(p.dataVolta)}.
                   ${p.servicos.join(', ')}. Para até ${p.pessoas} pessoas.</p>
                <p class="preco">${Catalogo.moeda(p.valor)}</p>
                <p>Data: ${Catalogo.periodo(p)}</p>
                <button class="remover"><i class="fa-solid fa-trash"></i> Remover</button>
            </div>
            <img src="${Catalogo.img(p)}" alt="Navio ${p.navio}">`;
        el.querySelector('.remover').addEventListener('click', () => { Catalogo.remover(p.id); desenhar(); });
        container.appendChild(el);
    });
}
desenhar();
