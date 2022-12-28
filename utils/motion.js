const slideDown = {
  initial: {
    opacity: 0,
    y: 50,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
}

const fadeIn = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
}

const animateCardText = {
  initial: {
    opacity: 0,
    y: 50,
  },
  slideIn: {
    opacity: 1,
    y: 0,
  },
  scaleDown: (scaleDelay) => ({
    scale: 0.75,
    transition: {
      delay: scaleDelay,
    },
  }),
  slideOut: {
    opacity: 0,
    y: -50,
  },
}

export { slideDown, fadeIn, animateCardText }
