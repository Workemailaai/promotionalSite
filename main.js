// Порог touch-scroll — планшет и мобилка без кнопок карусели
const TOUCH_SCROLL_MAX_WIDTH = 1439;

// Классы позиционирования колоды «Сценарии»
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

// Проверка режима touch-scroll вместо карусели/колоды
const isTouchScrollMode = () => window.matchMedia(`(max-width: ${TOUCH_SCROLL_MAX_WIDTH}px)`).matches;

// Функция очистки карусели «Преимущества»
let destroyAdvantagesCarousel = null;

// Функция очистки колоды «Сценарии»
let destroyCasesDeck = null;

// Функция очистки синхронизации точек со скроллом «Сценарии»
let destroyCasesScrollDots = null;

// Текущий брейкпоинт колоды «Сценарии» для переинициализации при смене ширины
let casesDeckBreakpoint = '';

// Создание карусели карточек в блоке «Преимущества» (только с 1440px)
const createAdvantagesCarousel = () => {
  // Контейнер с обрезкой видимой области
  const viewport = document.querySelector('.advantages__viewport');
  // Лента карточек, которую сдвигаем
  const track = document.querySelector('.advantages__grid');
  // Кнопка прокрутки влево
  const prevButton = document.querySelector('.advantages__arrow--prev');
  // Кнопка прокрутки вправо
  const nextButton = document.querySelector('.advantages__arrow--next');

  if (!viewport || !track || !prevButton || !nextButton) {
    return null;
  }

  // Список карточек для расчёта шага прокрутки
  const cards = track.querySelectorAll('.advantages__card');

  if (!cards.length) {
    return null;
  }

  // Текущее смещение ленты в пикселях
  let currentOffset = 0;

  // Ширина одной карточки плюс промежуток между ними
  const getScrollStep = () => {
    const trackStyles = window.getComputedStyle(track);
    const gapValue = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

    return cards[0].offsetWidth + gapValue;
  };

  // Максимально допустимое смещение до конца ленты
  const getMaxOffset = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

  // Обновление состояния стрелок на границах прокрутки
  const updateControls = () => {
    const maxOffset = getMaxOffset();
    const isAtStart = currentOffset <= 0;
    const isAtEnd = currentOffset >= maxOffset;

    prevButton.classList.toggle('advantages__arrow--disabled', isAtStart);
    nextButton.classList.toggle('advantages__arrow--disabled', isAtEnd);
    prevButton.disabled = isAtStart;
    nextButton.disabled = isAtEnd;
  };

  // Применение смещения к ленте карточек
  const applyOffset = () => {
    const maxOffset = getMaxOffset();

    currentOffset = Math.max(0, Math.min(currentOffset, maxOffset));
    track.style.transform = `translateX(-${currentOffset}px)`;
    updateControls();
  };

  // Сдвиг ленты на одну карточку в заданном направлении
  const scrollByStep = (direction) => {
    currentOffset += direction * getScrollStep();
    applyOffset();
  };

  // Обработчик клика по кнопке «назад»
  const onPrevClick = () => {
    scrollByStep(-1);
  };

  // Обработчик клика по кнопке «вперёд»
  const onNextClick = () => {
    scrollByStep(1);
  };

  prevButton.addEventListener('click', onPrevClick);
  nextButton.addEventListener('click', onNextClick);
  window.addEventListener('resize', applyOffset);
  applyOffset();

  return () => {
    prevButton.removeEventListener('click', onPrevClick);
    nextButton.removeEventListener('click', onNextClick);
    window.removeEventListener('resize', applyOffset);
    track.style.transform = '';
    prevButton.classList.remove('advantages__arrow--disabled');
    nextButton.classList.remove('advantages__arrow--disabled');
    prevButton.disabled = false;
    nextButton.disabled = false;
  };
};

// Создание колоды карточек в блоке «Сценарии» (только с 1440px)
const createCasesDeck = () => {
  // Корневой блок карусели сценариев
  const carousel = document.querySelector('.cases__carousel');

  if (!carousel) {
    return null;
  }

  // Контейнер стопки карточек
  const stack = carousel.querySelector('.cases__stack');
  // Кнопка «назад»
  const prevButton = carousel.querySelector('.cases__arrow--prev');
  // Кнопка «вперёд»
  const nextButton = carousel.querySelector('.cases__arrow--next');
  // Индикаторы слайдов
  const dots = carousel.querySelectorAll('.cases__dot');

  if (!stack || !prevButton || !nextButton || !dots.length) {
    return null;
  }

  // Все карточки в стопке
  const cards = [...stack.querySelectorAll('.cases__card')];

  if (cards.length < 2) {
    return null;
  }

  // Порядок индексов: сзади, середина, сверху (сверху — «Школы», индекс 0)
  let stackOrder = [2, 1, 0];
  // Флаг блокировки повторного клика во время анимации
  let isAnimating = false;
  // Длительность анимации вылета (мс), синхронно с CSS transition 0.45s
  const exitDurationMs = 450;

  // Назначение позиций в стопке по текущему порядку
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

  // Завершение шага: сброс позиций колоды после анимации вылета
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

  // Поднятие карточек в стопке, пока верхняя улетает
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

  // Анимация смены верхней карточки в заданном направлении
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

    // Флаг, чтобы шаг завершился только один раз
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

  // Обработчик клика по кнопке «назад»
  const onPrevClick = () => {
    animateDeckStep(-1);
  };

  // Обработчик клика по кнопке «вперёд»
  const onNextClick = () => {
    animateDeckStep(1);
  };

  prevButton.addEventListener('click', onPrevClick);
  nextButton.addEventListener('click', onNextClick);
  applyStackPositions();
  updateDots();

  return () => {
    prevButton.removeEventListener('click', onPrevClick);
    nextButton.removeEventListener('click', onNextClick);
    cards.forEach((card) => {
      resetCasesCardState(card);
    });
    dots.forEach((dot) => {
      dot.classList.remove('cases__dot--active');
    });
    isAnimating = false;
  };
};

// Переключение карусели «Преимущества» между режимами carousel и touch-scroll
const setupAdvantagesCarousel = () => {
  // Лента карточек для сброса inline-стилей
  const track = document.querySelector('.advantages__grid');

  if (isTouchScrollMode()) {
    if (destroyAdvantagesCarousel) {
      destroyAdvantagesCarousel();
      destroyAdvantagesCarousel = null;
    }

    if (track) {
      track.style.transform = '';
    }

    return;
  }

  if (!destroyAdvantagesCarousel) {
    destroyAdvantagesCarousel = createAdvantagesCarousel();
  }
};

// Синхронизация точек пагинации со скроллом карточек «Сценарии» (до 1439px)
const createCasesScrollDots = () => {
  // Корневой блок карусели сценариев
  const carousel = document.querySelector('.cases__carousel');

  if (!carousel) {
    return null;
  }

  // Горизонтальная лента карточек
  const stack = carousel.querySelector('.cases__stack');
  // Индикаторы слайдов
  const dots = carousel.querySelectorAll('.cases__dot');

  if (!stack || !dots.length) {
    return null;
  }

  // Список карточек для определения активной точки
  const cards = stack.querySelectorAll('.cases__card');

  if (!cards.length) {
    return null;
  }

  // Обновление активной точки по положению карточки в видимой области
  const updateActiveDot = () => {
    const stackRect = stack.getBoundingClientRect();
    const stackCenter = stackRect.left + stackRect.width / 2;
    let activeIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, cardIndex) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - stackCenter);

      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = cardIndex;
      }
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('cases__dot--active', dotIndex === activeIndex);
    });
  };

  stack.addEventListener('scroll', updateActiveDot, { passive: true });
  window.addEventListener('resize', updateActiveDot);
  updateActiveDot();

  return () => {
    stack.removeEventListener('scroll', updateActiveDot);
    window.removeEventListener('resize', updateActiveDot);
    dots.forEach((dot) => {
      dot.classList.remove('cases__dot--active');
    });

    if (dots[0]) {
      dots[0].classList.add('cases__dot--active');
    }
  };
};

// Определение брейкпоинта колоды «Сценарии» по ширине экрана
const getCasesDeckBreakpoint = () => {
  if (window.matchMedia('(min-width: 1440px)').matches) {
    return 'wide';
  }

  return '';
};

// Переключение «Сценарии» между колодой и touch-scroll
const setupCasesDeck = () => {
  // Контейнер стопки для сброса состояния карточек
  const stack = document.querySelector('.cases__stack');

  if (isTouchScrollMode()) {
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

// Инициализация интерактивных блоков с учётом текущего брейкпоинта
const setupResponsiveCarousels = () => {
  setupAdvantagesCarousel();
  setupCasesDeck();
};

window.addEventListener('resize', setupResponsiveCarousels);
setupResponsiveCarousels();
