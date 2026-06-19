import { bindHorizontalWheel } from './scroll-wheel.js';

const CASES_CARD_STATE_CLASSES = [
  'cases__card--top',
  'cases__card--middle',
  'cases__card--back',
  'cases__card--exit-down',
  'cases__card--exit-up',
  'cases__card--instant',
];

// Сброс состояния карточки из режима колоды
const resetCasesCardState = (card) => {
  card.classList.remove(...CASES_CARD_STATE_CLASSES);
  card.removeAttribute('aria-hidden');
};

let destroyCasesDeck = null;
let destroyCasesScrollDots = null;
let casesDeckBreakpoint = '';

// Колода карточек «Сценарии» — планшет и десктоп
const createCasesDeck = () => {
  const carousel = document.querySelector('.cases__carousel');

  if (!carousel) {
    return null;
  }

  const stack = carousel.querySelector('.cases__stack');
  const prevButton = carousel.querySelector('.cases__arrow--prev');
  const nextButton = carousel.querySelector('.cases__arrow--next');
  const dots = carousel.querySelectorAll('.cases__dot');

  if (!stack || !prevButton || !nextButton || !dots.length) {
    return null;
  }

  const cards = [...stack.querySelectorAll('.cases__card')];

  if (cards.length < 2) {
    return null;
  }

  let stackOrder = [2, 1, 0];
  let isAnimating = false;
  const exitDurationMs = 450;

  // Расстановка карточек в стопке
  const applyStackPositions = () => {
    const positionClasses = ['cases__card--back', 'cases__card--middle', 'cases__card--top'];

    cards.forEach((card, cardIndex) => {
      resetCasesCardState(card);

      const positionIndex = stackOrder.indexOf(cardIndex);

      card.classList.add(positionClasses[positionIndex]);

      if (positionIndex < 2) {
        card.setAttribute('aria-hidden', 'true');
      }
    });
  };

  // Обновление активной точки пагинации
  const updateDots = () => {
    const activeSlideIndex = stackOrder[stackOrder.length - 1];

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('cases__dot--active', dotIndex === activeSlideIndex);
    });
  };

  // Завершение шага колоды после анимации вылета
  const finishDeckStep = (nextOrder) => {
    stackOrder = nextOrder;

    cards.forEach((card) => {
      card.classList.remove('cases__card--exit-down', 'cases__card--exit-up');
      card.classList.add('cases__card--instant');
    });

    applyStackPositions();

    requestAnimationFrame(() => {
      cards.forEach((card) => {
        card.classList.remove('cases__card--instant');
      });
    });

    updateDots();
    isAnimating = false;
  };

  // Поднятие карточек в стопке во время вылета верхней
  const promoteStackBelow = (direction) => {
    const backIndex = stackOrder[0];
    const middleIndex = stackOrder[1];
    const middleCard = cards[middleIndex];
    const backCard = cards[backIndex];

    if (direction === 1) {
      middleCard.classList.remove('cases__card--middle');
      middleCard.classList.add('cases__card--top');
      middleCard.removeAttribute('aria-hidden');

      backCard.classList.remove('cases__card--back');
      backCard.classList.add('cases__card--middle');
      backCard.setAttribute('aria-hidden', 'true');

      return;
    }

    backCard.classList.remove('cases__card--back');
    backCard.classList.add('cases__card--top');
    backCard.removeAttribute('aria-hidden');
  };

  // Анимация смены верхней карточки
  const animateDeckStep = (direction) => {
    if (isAnimating) {
      return;
    }

    isAnimating = true;

    const topCardIndex = stackOrder[stackOrder.length - 1];
    const topCard = cards[topCardIndex];
    const exitClass = direction === 1 ? 'cases__card--exit-down' : 'cases__card--exit-up';
    const nextOrder = direction === 1
      ? [stackOrder[2], stackOrder[0], stackOrder[1]]
      : [stackOrder[1], stackOrder[2], stackOrder[0]];

    topCard.classList.add(exitClass);
    promoteStackBelow(direction);

    let isStepCompleted = false;

    // Единая точка завершения анимации вылета
    const completeStep = () => {
      if (isStepCompleted) {
        return;
      }

      isStepCompleted = true;
      topCard.removeEventListener('transitionend', onExitEnd);
      finishDeckStep(nextOrder);
    };

    const onExitEnd = (event) => {
      if (event.propertyName !== 'transform') {
        return;
      }

      completeStep();
    };

    topCard.addEventListener('transitionend', onExitEnd);

    window.setTimeout(() => {
      completeStep();
    }, exitDurationMs + 50);
  };

  const onPrevClick = () => {
    animateDeckStep(-1);
  };

  const onNextClick = () => {
    animateDeckStep(1);
  };

  let touchStartX = 0;
  let pointerStartX = 0;
  let isPointerActive = false;

  // Начало touch-свайпа по колоде
  const onTouchStart = (event) => {
    if (!event.touches[0]) {
      return;
    }

    touchStartX = event.touches[0].clientX;
  };

  // Завершение touch-свайпа по колоде
  const onTouchEnd = (event) => {
    if (!event.changedTouches[0]) {
      return;
    }

    const touchDelta = event.changedTouches[0].clientX - touchStartX;

    if (Math.abs(touchDelta) < 50) {
      return;
    }

    animateDeckStep(touchDelta < 0 ? 1 : -1);
  };

  // Направление шага к выбранному слайду
  const getDirectionToSlide = (targetIndex) => {
    const activeIndex = stackOrder[stackOrder.length - 1];

    if (targetIndex === activeIndex) {
      return 0;
    }

    const forwardSteps = (targetIndex - activeIndex + cards.length) % cards.length;
    const backwardSteps = (activeIndex - targetIndex + cards.length) % cards.length;

    return forwardSteps <= backwardSteps ? 1 : -1;
  };

  const onDotClick = (event) => {
    const dotIndex = [...dots].indexOf(event.currentTarget);
    const direction = getDirectionToSlide(dotIndex);

    if (direction === 0 || isAnimating) {
      return;
    }

    animateDeckStep(direction);
  };

  // Начало pointer-свайпа мышью
  const onPointerDown = (event) => {
    if (isAnimating || event.pointerType === 'touch') {
      return;
    }

    isPointerActive = true;
    pointerStartX = event.clientX;
    stack.setPointerCapture(event.pointerId);
  };

  // Завершение pointer-свайпа мышью
  const onPointerUp = (event) => {
    if (!isPointerActive || event.pointerType === 'touch') {
      return;
    }

    isPointerActive = false;

    const pointerDelta = event.clientX - pointerStartX;

    if (Math.abs(pointerDelta) < 50) {
      return;
    }

    animateDeckStep(pointerDelta < 0 ? 1 : -1);
  };

  prevButton.addEventListener('click', onPrevClick);
  nextButton.addEventListener('click', onNextClick);
  stack.addEventListener('touchstart', onTouchStart, { passive: true });
  stack.addEventListener('touchend', onTouchEnd, { passive: true });
  stack.addEventListener('pointerdown', onPointerDown);
  stack.addEventListener('pointerup', onPointerUp);
  stack.addEventListener('pointercancel', onPointerUp);
  dots.forEach((dot) => {
    dot.addEventListener('click', onDotClick);
  });
  applyStackPositions();
  updateDots();

  return () => {
    prevButton.removeEventListener('click', onPrevClick);
    nextButton.removeEventListener('click', onNextClick);
    stack.removeEventListener('touchstart', onTouchStart);
    stack.removeEventListener('touchend', onTouchEnd);
    stack.removeEventListener('pointerdown', onPointerDown);
    stack.removeEventListener('pointerup', onPointerUp);
    stack.removeEventListener('pointercancel', onPointerUp);
    dots.forEach((dot) => {
      dot.removeEventListener('click', onDotClick);
    });
    cards.forEach((card) => {
      resetCasesCardState(card);
    });
    dots.forEach((dot) => {
      dot.classList.remove('cases__dot--active');
    });
    isAnimating = false;
  };
};

// Touch-scroll и точки пагинации «Сценарии» — mobile
const createCasesScrollDots = () => {
  const carousel = document.querySelector('.cases__carousel');

  if (!carousel) {
    return null;
  }

  const stack = carousel.querySelector('.cases__stack');
  const dots = carousel.querySelectorAll('.cases__dot');

  if (!stack || !dots.length) {
    return null;
  }

  const cards = stack.querySelectorAll('.cases__card');

  if (!cards.length) {
    return null;
  }

  // Активная точка по карточке у левого края ленты
  const updateActiveDot = () => {
    const stackRect = stack.getBoundingClientRect();
    let activeIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, cardIndex) => {
      const cardRect = card.getBoundingClientRect();
      const distance = Math.abs(cardRect.left - stackRect.left);

      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = cardIndex;
      }
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('cases__dot--active', dotIndex === activeIndex);
    });
  };

  const onDotClick = (event) => {
    const dotIndex = [...dots].indexOf(event.currentTarget);
    const targetCard = cards[dotIndex];

    if (!targetCard) {
      return;
    }

    targetCard.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  };

  dots.forEach((dot) => {
    dot.addEventListener('click', onDotClick);
  });

  stack.addEventListener('scroll', updateActiveDot, { passive: true });
  window.addEventListener('resize', updateActiveDot);

  const unbindWheel = bindHorizontalWheel(stack, (deltaY) => {
    stack.scrollLeft += deltaY;
  });

  updateActiveDot();

  return () => {
    stack.removeEventListener('scroll', updateActiveDot);
    window.removeEventListener('resize', updateActiveDot);
    unbindWheel();
    dots.forEach((dot) => {
      dot.removeEventListener('click', onDotClick);
    });
    dots.forEach((dot) => {
      dot.classList.remove('cases__dot--active');
    });

    if (dots[0]) {
      dots[0].classList.add('cases__dot--active');
    }
  };
};

// Проверка touch-scroll режима «Сценарии»
const isCasesTouchScrollMode = () => window.matchMedia('(max-width: 833px)').matches;

// Брейкпоинт колоды «Сценарии»
const getCasesDeckBreakpoint = () => {
  if (window.matchMedia('(min-width: 834px)').matches) {
    return 'wide';
  }

  return '';
};

// Переключение «Сценарии» между колодой и touch-scroll
export const setupCasesDeck = () => {
  const stack = document.querySelector('.cases__stack');

  if (isCasesTouchScrollMode()) {
    casesDeckBreakpoint = '';

    if (destroyCasesDeck) {
      destroyCasesDeck();
      destroyCasesDeck = null;
    }

    if (stack) {
      stack.querySelectorAll('.cases__card').forEach(resetCasesCardState);
    }

    if (!destroyCasesScrollDots) {
      destroyCasesScrollDots = createCasesScrollDots();
    }

    return;
  }

  if (destroyCasesScrollDots) {
    destroyCasesScrollDots();
    destroyCasesScrollDots = null;
  }

  const nextBreakpoint = getCasesDeckBreakpoint();

  if (destroyCasesDeck && casesDeckBreakpoint === nextBreakpoint) {
    return;
  }

  casesDeckBreakpoint = nextBreakpoint;

  if (destroyCasesDeck) {
    destroyCasesDeck();
    destroyCasesDeck = null;
  }

  destroyCasesDeck = createCasesDeck();
};
