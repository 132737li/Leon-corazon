document.addEventListener('DOMContentLoaded', () => {
    const bouton = document.querySelector('.hamburger');
    const menu = document.querySelector('header nav');

    if (!bouton || !menu) return;

    bouton.addEventListener('click', () => {
        const ouvert = menu.classList.toggle('open');
        bouton.classList.toggle('active', ouvert);
        bouton.setAttribute('aria-expanded', ouvert);
    });

    // Ferme le menu quand on clique sur un lien
    menu.querySelectorAll('a').forEach(lien => {
        lien.addEventListener('click', () => {
            menu.classList.remove('open');
            bouton.classList.remove('active');
            bouton.setAttribute('aria-expanded', 'false');
        });
    });
});