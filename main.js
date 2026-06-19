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

// Порог touch-scroll для «Преимущества» — планшет и телефон
const ADVANTAGES_TOUCH_MAX_WIDTH = 1439;

// Функция очистки карусели «Преимущества»
let destroyAdvantagesCarousel = null;

// Текущий режим карусели «Преимущества» для переинициализации при смене ширины
let advantagesCarouselMode = '';

// Проверка touch-scroll режима «Преимущества»
const isAdvantagesTouchScrollMode = () => window.matchMedia(`(max-width: ${ADVANTAGES_TOUCH_MAX_WIDTH}px)`).matches;

// Режим карусели «Преимущества» по ширине экрана
const getAdvantagesCarouselMode = () => (isAdvantagesTouchScrollMode() ? 'touch' : 'transform');

// Карусель «Преимущества» через transform — ноутбук и десктоп
const createAdvantagesTransformCarousel = () => {
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

  track.style.transform = '';
  track.style.transition = '';
  track.scrollLeft = 0;

  // Текущее смещение ленты в пикселях
  let currentOffset = 0;

  // Направление автопрокрутки: 1 — вправо, -1 — влево
  let autoScrollDirection = 1;

  // Флаг паузы автопрокрутки после ручного управления
  let isAutoScrollPaused = false;

  // Id кадра requestAnimationFrame для автопрокрутки
  let autoScrollFrameId = null;

  // Таймер возобновления автопрокрутки после ручного управления
  let autoScrollResumeTimerId = null;

  // Метка времени предыдущего кадра автопрокрутки
  let autoScrollPreviousTime = null;

  // Скорость автопрокрутки в пикселях за миллисекунду
  const autoScrollSpeedPxPerMs = 0.028;

  // Пауза автопрокрутки после ручного управления, мс
  const autoScrollPauseMs = 1000;

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

  // Пауза автопрокрутки при ручном управлении
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

  // Плавная автопрокрутка: вправо до конца, затем влево до начала
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

  // Сдвиг ленты на одну карточку в заданном направлении
  const scrollByStep = (direction) => {
    pauseAutoScroll();
    currentOffset += direction * getScrollStep();
    applyOffset(true);
  };

  // Обработчик клика по кнопке «назад»
  const onPrevClick = () => {
    scrollByStep(-1);
  };

  // Обработчик клика по кнопке «вперёд»
  const onNextClick = () => {
    scrollByStep(1);
  };

  // Вертикальное колесо прокручивает ленту по горизонтали
  const onWheel = (event) => {
    if (viewport.scrollWidth <= viewport.clientWidth) {
      return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    pauseAutoScroll();
    currentOffset += event.deltaY;
    applyOffset(false);
    event.preventDefault();
  };

  // Пауза автопрокрутки при касании ленты
  const onTouchStart = () => {
    pauseAutoScroll();
  };

  prevButton.addEventListener('click', onPrevClick);
  nextButton.addEventListener('click', onNextClick);
  viewport.addEventListener('touchstart', onTouchStart, { passive: true });
  viewport.addEventListener('wheel', onWheel, { passive: false });

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
    viewport.removeEventListener('wheel', onWheel);
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

  // Сбрасываем transform от старой версии карусели
  track.style.transform = '';
  track.style.transition = '';
  viewport.scrollLeft = 0;
  track.scrollLeft = 0;

  // Контейнер горизонтальной прокрутки — viewport, не лента
  const scrollElement = viewport;

  // Текущее смещение ленты в пикселях
  let currentOffset = 0;

  // Направление автопрокрутки: 1 — вправо, -1 — влево
  let autoScrollDirection = 1;

  // Флаг паузы автопрокрутки после ручного управления
  let isAutoScrollPaused = false;

  // Флаг активного касания — блокирует автопрокрутку на iOS
  let isUserTouching = false;

  // Id кадра requestAnimationFrame для автопрокрутки
  let autoScrollFrameId = null;

  // Таймер возобновления автопрокрутки после ручного управления
  let autoScrollResumeTimerId = null;

  // Метка времени предыдущего кадра автопрокрутки
  let autoScrollPreviousTime = null;

  // Скорость автопрокрутки в пикселях за миллисекунду
  const autoScrollSpeedPxPerMs = 0.028;

  // Пауза автопрокрутки после ручного управления, мс
  const autoScrollPauseMs = 1500;

  // Ширина одной карточки плюс промежуток между ними
  const getScrollStep = () => {
    const trackStyles = window.getComputedStyle(track);
    const gapValue = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

    return cards[0].offsetWidth + gapValue;
  };

  // Максимально допустимое смещение до конца ленты
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

  // Применение смещения через нативный scrollLeft
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

  // Пауза автопрокрутки при ручном управлении
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

  // Плавная автопрокрутка: вправо до конца, затем влево до начала
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

  // Сдвиг ленты на одну карточку в заданном направлении
  const scrollByStep = (direction) => {
    pauseAutoScroll();
    currentOffset += direction * getScrollStep();
    applyOffset(true);
  };

  // Обработчик клика по кнопке «назад»
  const onPrevClick = () => {
    scrollByStep(-1);
  };

  // Обработчик клика по кнопке «вперёд»
  const onNextClick = () => {
    scrollByStep(1);
  };

  // Вертикальное колесо прокручивает ленту по горизонтали
  const onWheel = (event) => {
    if (scrollElement.scrollWidth <= scrollElement.clientWidth) {
      return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    pauseAutoScroll();
    currentOffset += event.deltaY;
    applyOffset(false);
    event.preventDefault();
  };

  // Стартовая X-координата touch
  let touchStartX = 0;

  // Стартовая Y-координата touch
  let touchStartY = 0;

  // scrollLeft на момент начала touch
  let touchStartScrollLeft = 0;

  // Направление жеста: null — ещё не определено, true — горизонтальный
  let isHorizontalTouch = null;

  // Порог определения направления жеста, px
  const touchDirectionThreshold = 8;

  // Обработчик начала touch
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

  // Обработчик движения touch — ручной свайп для iOS
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

  // Обработчик завершения touch
  const onTouchEnd = () => {
    currentOffset = scrollElement.scrollLeft;
    isHorizontalTouch = null;
    isUserTouching = false;
    pauseAutoScroll();
    updateControls();
  };

  prevButton.addEventListener('click', onPrevClick);
  nextButton.addEventListener('click', onNextClick);
  scrollElement.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  scrollElement.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  scrollElement.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
  scrollElement.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
  scrollElement.addEventListener('wheel', onWheel, { passive: false });

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
    scrollElement.removeEventListener('wheel', onWheel);
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

// Функция очистки колоды «Сценарии»
let destroyCasesDeck = null;

// Функция очистки синхронизации точек со скроллом «Сценарии»
let destroyCasesScrollDots = null;

// Текущий брейкпоинт колоды «Сценарии» для переинициализации при смене ширины
let casesDeckBreakpoint = '';

// Создание колоды карточек в блоке «Сценарии» (с 834px)
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

  // Стартовая координата touch для свайпа по колоде
  let touchStartX = 0;

  // Стартовая координата pointer для свайпа мышью
  let pointerStartX = 0;

  // Флаг активного pointer-свайпа
  let isPointerActive = false;

  // Обработчик начала touch-свайпа
  const onTouchStart = (event) => {
    if (!event.touches[0]) {
      return;
    }

    touchStartX = event.touches[0].clientX;
  };

  // Обработчик завершения touch-свайпа
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

  // Направление шага колоды к выбранному слайду
  const getDirectionToSlide = (targetIndex) => {
    const activeIndex = stackOrder[stackOrder.length - 1];

    if (targetIndex === activeIndex) {
      return 0;
    }

    const forwardSteps = (targetIndex - activeIndex + cards.length) % cards.length;
    const backwardSteps = (activeIndex - targetIndex + cards.length) % cards.length;

    return forwardSteps <= backwardSteps ? 1 : -1;
  };

  // Обработчик клика по точке пагинации
  const onDotClick = (event) => {
    const dotIndex = [...dots].indexOf(event.currentTarget);
    const direction = getDirectionToSlide(dotIndex);

    if (direction === 0 || isAnimating) {
      return;
    }

    animateDeckStep(direction);
  };

  // Обработчик начала pointer-свайпа
  const onPointerDown = (event) => {
    if (isAnimating || event.pointerType === 'touch') {
      return;
    }

    isPointerActive = true;
    pointerStartX = event.clientX;
    stack.setPointerCapture(event.pointerId);
  };

  // Обработчик завершения pointer-свайпа
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

// Переключение карусели «Преимущества» с учётом брейкпоинта
const setupAdvantagesCarousel = () => {
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

// Синхронизация точек пагинации со скроллом карточек «Сценарии» (только mobile)
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

  // Обновление активной точки по карточке у левого края ленты
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

  // Прокрутка к карточке по клику на точку
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

  // Обработчик колеса: вертикальный жест прокручивает ленту по горизонтали
  const onWheel = (event) => {
    if (stack.scrollWidth <= stack.clientWidth) {
      return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    stack.scrollLeft += event.deltaY;
    event.preventDefault();
  };

  stack.addEventListener('wheel', onWheel, { passive: false });
  updateActiveDot();

  return () => {
    stack.removeEventListener('scroll', updateActiveDot);
    window.removeEventListener('resize', updateActiveDot);
    stack.removeEventListener('wheel', onWheel);
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

// Проверка режима touch-scroll для блока «Сценарии» (только mobile до 833px)
const isCasesTouchScrollMode = () => window.matchMedia('(max-width: 833px)').matches;

// Определение брейкпоинта колоды «Сценарии» по ширине экрана
const getCasesDeckBreakpoint = () => {
  if (window.matchMedia('(min-width: 834px)').matches) {
    return 'wide';
  }

  return '';
};

// Переключение «Сценарии» между колодой и touch-scroll
const setupCasesDeck = () => {
  // Контейнер стопки для сброса состояния карточек
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

// Инициализация интерактивных блоков с учётом текущего брейкпоинта
const setupResponsiveCarousels = () => {
  setupAdvantagesCarousel();
  setupCasesDeck();
};

window.addEventListener('resize', setupResponsiveCarousels);
setupResponsiveCarousels();
