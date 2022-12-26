const animateSlideUp = {
  initial: {
    opacity: 0,
    translateY: '50px',
  },
  animate: {
    opacity: 1,
    translateY: 0,
  },
  transition: {
    duration: 0.2,
  },
}

const animateFadeIn = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  transition: {
    duration: 0.8,
  },
}

export { animateSlideUp, animateFadeIn }
