import { setupAdvantagesCarousel } from './advantages-carousel.js';
import { setupCasesDeck } from './cases-carousel.js';

// Инициализация интерактивных блоков с учётом текущего брейкпоинта
const setupResponsiveCarousels = () => {
  setupAdvantagesCarousel();
  setupCasesDeck();
};

window.addEventListener('resize', setupResponsiveCarousels);
setupResponsiveCarousels();
