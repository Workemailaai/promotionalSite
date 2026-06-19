import { bindHorizontalWheel } from './scroll-wheel.js';

const ADVANTAGES_TOUCH_MAX_WIDTH = 1439;

let destroyAdvantagesCarousel = null;
let advantagesCarouselMode = '';

// Проверка touch-scroll режима «Преимущества»
const isAdvantagesTouchScrollMode = () => window.matchMedia(`(max-width: ${ADVANTAGES_TOUCH_MAX_WIDTH}px)`).matches;

// Режим карусели «Преимущества» по ширине экрана
const getAdvantagesCarouselMode = () => (isAdvantagesTouchScrollMode() ? 'touch' : 'transform');

// Карусель «Преимущества» через transform — ноутбук и десктоп
const createAdvantagesTransformCarousel = () => {
  const viewport = document.querySelector('.advantages__viewport');
  const track = document.querySelector('.advantages__grid');
  const prevButton = document.querySelector('.advantages__arrow--prev');
  const nextButton = document.querySelector('.advantages__arrow--next');

  if (!viewport || !track || !prevButton || !nextButton) {
    return null;
  }

  const cards = track.querySelectorAll('.advantages__card');

  if (!cards.length) {
    return null;
  }

  track.style.transform = '';
  track.style.transition = '';

  let currentOffset = 0;
  let autoScrollDirection = 1;
  let isAutoScrollPaused = false;
  let autoScrollFrameId = null;
  let autoScrollResumeTimerId = null;
  let autoScrollPreviousTime = null;
  const autoScrollSpeedPxPerMs = 0.028;
  const autoScrollPauseMs = 1000;

  // Ширина карточки плюс промежуток между карточками
  const getScrollStep = () => {
    const trackStyles = window.getComputedStyle(track);
    const gapValue = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

    return cards[0].offsetWidth + gapValue;
  };

  // Максимальное смещение до конца ленты
  const getMaxOffset = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

  // Обновление состояния стрелок на границах прокрутки
  const updateControls = () => {
    const maxOffset = getMaxOffset();
    const isAtStart = currentOffset <= 0;
    const isAtEnd = currentOffset >= maxOffset - 1;

    prevButton.classList.toggle('advantages__arrow--disabled', isAtStart);
    nextButton.classList.toggle('advantages__arrow--disabled', isAtEnd);
    prevButton.disabled = isAtStart;
    nextButton.disabled = isAtEnd;
  };

  // Применение смещения через transform
  const applyOffset = (shouldAnimate = false) => {
    const maxOffset = getMaxOffset();

    currentOffset = Math.max(0, Math.min(currentOffset, maxOffset));
    track.style.transition = shouldAnimate ? 'transform 0.4s ease' : 'none';
    track.style.transform = `translate3d(-${currentOffset}px, 0, 0)`;
    updateControls();
  };

  // Пауза автопрокрутки после ручного управления
  const pauseAutoScroll = () => {
    isAutoScrollPaused = true;

    if (autoScrollResumeTimerId) {
      clearTimeout(autoScrollResumeTimerId);
    }

    autoScrollResumeTimerId = setTimeout(() => {
      isAutoScrollPaused = false;
      autoScrollPreviousTime = null;
    }, autoScrollPauseMs);
  };

  // Автопрокрутка вправо до конца, затем влево до начала
  const animateAutoScroll = (timestamp) => {
    if (!isAutoScrollPaused) {
      const maxOffset = getMaxOffset();

      if (maxOffset > 0) {
        if (autoScrollPreviousTime === null) {
          autoScrollPreviousTime = timestamp;
        }

        const deltaMs = timestamp - autoScrollPreviousTime;
        autoScrollPreviousTime = timestamp;
        currentOffset += autoScrollDirection * autoScrollSpeedPxPerMs * deltaMs;

        if (currentOffset >= maxOffset) {
          currentOffset = maxOffset;
          autoScrollDirection = -1;
        } else if (currentOffset <= 0) {
          currentOffset = 0;
          autoScrollDirection = 1;
        }

        applyOffset(false);
      }
    } else {
      autoScrollPreviousTime = null;
    }

    autoScrollFrameId = requestAnimationFrame(animateAutoScroll);
  };

  // Сдвиг ленты на одну карточку
  const scrollByStep = (direction) => {
    pauseAutoScroll();
    currentOffset += direction * getScrollStep();
    applyOffset(true);
  };

  const onPrevClick = () => {
    scrollByStep(-1);
  };

  const onNextClick = () => {
    scrollByStep(1);
  };

  // Пауза автопрокрутки при касании
  const onTouchStart = () => {
    pauseAutoScroll();
  };

  const unbindWheel = bindHorizontalWheel(viewport, (deltaY) => {
    pauseAutoScroll();
    currentOffset += deltaY;
    applyOffset(false);
  });

  prevButton.addEventListener('click', onPrevClick);
  nextButton.addEventListener('click', onNextClick);
  viewport.addEventListener('touchstart', onTouchStart, { passive: true });

  const onResize = () => {
    applyOffset(false);
  };

  window.addEventListener('resize', onResize);
  applyOffset(false);

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isReducedMotion) {
    autoScrollFrameId = requestAnimationFrame(animateAutoScroll);
  }

  return () => {
    prevButton.removeEventListener('click', onPrevClick);
    nextButton.removeEventListener('click', onNextClick);
    viewport.removeEventListener('touchstart', onTouchStart);
    unbindWheel();
    window.removeEventListener('resize', onResize);

    if (autoScrollFrameId) {
      cancelAnimationFrame(autoScrollFrameId);
      autoScrollFrameId = null;
    }

    if (autoScrollResumeTimerId) {
      clearTimeout(autoScrollResumeTimerId);
      autoScrollResumeTimerId = null;
    }

    track.style.transform = '';
    track.style.transition = '';
    prevButton.classList.remove('advantages__arrow--disabled');
    nextButton.classList.remove('advantages__arrow--disabled');
    prevButton.disabled = false;
    nextButton.disabled = false;
  };
};

// Карусель «Преимущества» с нативным скроллом — планшет и телефон
const createAdvantagesTouchCarousel = () => {
  const viewport = document.querySelector('.advantages__viewport');
  const track = document.querySelector('.advantages__grid');
  const prevButton = document.querySelector('.advantages__arrow--prev');
  const nextButton = document.querySelector('.advantages__arrow--next');

  if (!viewport || !track || !prevButton || !nextButton) {
    return null;
  }

  const cards = track.querySelectorAll('.advantages__card');

  if (!cards.length) {
    return null;
  }

  track.style.transform = '';
  track.style.transition = '';
  viewport.scrollLeft = 0;
  track.scrollLeft = 0;

  const scrollElement = viewport;

  let currentOffset = 0;
  let autoScrollDirection = 1;
  let isAutoScrollPaused = false;
  let isUserTouching = false;
  let autoScrollFrameId = null;
  let autoScrollResumeTimerId = null;
  let autoScrollPreviousTime = null;
  const autoScrollSpeedPxPerMs = 0.028;
  const autoScrollPauseMs = 1500;

  // Ширина карточки плюс промежуток между карточками
  const getScrollStep = () => {
    const trackStyles = window.getComputedStyle(track);
    const gapValue = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

    return cards[0].offsetWidth + gapValue;
  };

  // Максимальное смещение до конца ленты
  const getMaxOffset = () => Math.max(0, scrollElement.scrollWidth - scrollElement.clientWidth);

  // Обновление состояния стрелок на границах прокрутки
  const updateControls = () => {
    const maxOffset = getMaxOffset();
    const isAtStart = currentOffset <= 0;
    const isAtEnd = currentOffset >= maxOffset - 1;

    prevButton.classList.toggle('advantages__arrow--disabled', isAtStart);
    nextButton.classList.toggle('advantages__arrow--disabled', isAtEnd);
    prevButton.disabled = isAtStart;
    nextButton.disabled = isAtEnd;
  };

  // Применение смещения через scrollLeft
  const applyOffset = (shouldAnimate = false) => {
    const maxOffset = getMaxOffset();

    currentOffset = Math.max(0, Math.min(currentOffset, maxOffset));

    if (shouldAnimate) {
      scrollElement.scrollTo({ left: currentOffset, behavior: 'smooth' });
    } else {
      scrollElement.scrollLeft = currentOffset;
    }

    updateControls();
  };

  // Пауза автопрокрутки после ручного управления
  const pauseAutoScroll = () => {
    isAutoScrollPaused = true;

    if (autoScrollResumeTimerId) {
      clearTimeout(autoScrollResumeTimerId);
    }

    autoScrollResumeTimerId = setTimeout(() => {
      isAutoScrollPaused = false;
      autoScrollPreviousTime = null;
    }, autoScrollPauseMs);
  };

  // Автопрокрутка вправо до конца, затем влево до начала
  const animateAutoScroll = (timestamp) => {
    if (!isAutoScrollPaused && !isUserTouching) {
      const maxOffset = getMaxOffset();

      if (maxOffset > 0) {
        if (autoScrollPreviousTime === null) {
          autoScrollPreviousTime = timestamp;
        }

        const deltaMs = timestamp - autoScrollPreviousTime;
        autoScrollPreviousTime = timestamp;
        currentOffset += autoScrollDirection * autoScrollSpeedPxPerMs * deltaMs;

        if (currentOffset >= maxOffset) {
          currentOffset = maxOffset;
          autoScrollDirection = -1;
        } else if (currentOffset <= 0) {
          currentOffset = 0;
          autoScrollDirection = 1;
        }

        applyOffset(false);
      }
    } else {
      autoScrollPreviousTime = null;
    }

    autoScrollFrameId = requestAnimationFrame(animateAutoScroll);
  };

  // Сдвиг ленты на одну карточку
  const scrollByStep = (direction) => {
    pauseAutoScroll();
    currentOffset += direction * getScrollStep();
    applyOffset(true);
  };

  const onPrevClick = () => {
    scrollByStep(-1);
  };

  const onNextClick = () => {
    scrollByStep(1);
  };

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartScrollLeft = 0;
  let isHorizontalTouch = null;
  const touchDirectionThreshold = 8;

  // Начало touch-свайпа
  const onTouchStart = (event) => {
    if (!event.touches[0]) {
      return;
    }

    isUserTouching = true;
    isHorizontalTouch = null;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchStartScrollLeft = scrollElement.scrollLeft;
    pauseAutoScroll();
  };

  // Ручной свайп ленты для iOS
  const onTouchMove = (event) => {
    if (!isUserTouching || !event.touches[0]) {
      return;
    }

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const deltaX = touchStartX - currentX;
    const deltaY = touchStartY - currentY;

    if (isHorizontalTouch === null) {
      if (Math.abs(deltaX) < touchDirectionThreshold && Math.abs(deltaY) < touchDirectionThreshold) {
        return;
      }

      isHorizontalTouch = Math.abs(deltaX) >= Math.abs(deltaY);

      if (!isHorizontalTouch) {
        isUserTouching = false;
        return;
      }
    }

    scrollElement.scrollLeft = touchStartScrollLeft + deltaX;
    currentOffset = scrollElement.scrollLeft;
    updateControls();
    event.preventDefault();
  };

  // Завершение touch-свайпа
  const onTouchEnd = () => {
    currentOffset = scrollElement.scrollLeft;
    isHorizontalTouch = null;
    isUserTouching = false;
    pauseAutoScroll();
    updateControls();
  };

  const unbindWheel = bindHorizontalWheel(scrollElement, (deltaY) => {
    pauseAutoScroll();
    currentOffset += deltaY;
    applyOffset(false);
  });

  prevButton.addEventListener('click', onPrevClick);
  nextButton.addEventListener('click', onNextClick);
  scrollElement.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  scrollElement.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  scrollElement.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
  scrollElement.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });

  const onResize = () => {
    applyOffset(false);
  };

  window.addEventListener('resize', onResize);
  applyOffset(false);

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isReducedMotion) {
    autoScrollFrameId = requestAnimationFrame(animateAutoScroll);
  }

  return () => {
    prevButton.removeEventListener('click', onPrevClick);
    nextButton.removeEventListener('click', onNextClick);
    scrollElement.removeEventListener('touchstart', onTouchStart, { capture: true });
    scrollElement.removeEventListener('touchmove', onTouchMove, { capture: true });
    scrollElement.removeEventListener('touchend', onTouchEnd, { capture: true });
    scrollElement.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    unbindWheel();
    window.removeEventListener('resize', onResize);

    if (autoScrollFrameId) {
      cancelAnimationFrame(autoScrollFrameId);
      autoScrollFrameId = null;
    }

    if (autoScrollResumeTimerId) {
      clearTimeout(autoScrollResumeTimerId);
      autoScrollResumeTimerId = null;
    }

    scrollElement.scrollLeft = 0;
    track.style.transform = '';
    track.style.transition = '';
    prevButton.classList.remove('advantages__arrow--disabled');
    nextButton.classList.remove('advantages__arrow--disabled');
    prevButton.disabled = false;
    nextButton.disabled = false;
  };
};

// Переключение карусели «Преимущества» по брейкпоинту
export const setupAdvantagesCarousel = () => {
  const nextMode = getAdvantagesCarouselMode();

  if (destroyAdvantagesCarousel && advantagesCarouselMode === nextMode) {
    return;
  }

  advantagesCarouselMode = nextMode;

  if (destroyAdvantagesCarousel) {
    destroyAdvantagesCarousel();
    destroyAdvantagesCarousel = null;
  }

  destroyAdvantagesCarousel = nextMode === 'touch'
    ? createAdvantagesTouchCarousel()
    : createAdvantagesTransformCarousel();
};
