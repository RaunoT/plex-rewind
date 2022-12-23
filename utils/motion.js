const animateSlideUp = {
  initial: {
    opacity: 0,
    translateY: '50px',
  },
  animate: {
    opacity: 1,
    translateY: 0,
  },
}

const animateFadeIn = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
}

export { animateSlideUp, animateFadeIn }
