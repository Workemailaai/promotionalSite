// Привязка вертикального колеса к горизонтальной прокрутке элемента
export const bindHorizontalWheel = (element, onVerticalWheel) => {
  const onWheel = (event) => {
    if (element.scrollWidth <= element.clientWidth) {
      return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    onVerticalWheel(event.deltaY);
    event.preventDefault();
  };

  element.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    element.removeEventListener('wheel', onWheel);
  };
};
