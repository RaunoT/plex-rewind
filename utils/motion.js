export const slideDown = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  show: {
    opacity: 1,
    y: 0,
  },
}

export const fadeIn = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
  },
}

export const animateCardText = {
  hidden: {
    //FIXME: opacity: 0 broken on initial render
    opacity: 1,
    y: 50,
  },
  show: {
    opacity: 1,
    y: 0,
  },
  scaleDown: (scaleDelay) => ({
    opacity: 0.5,
    scale: 0.6,
    transition: {
      delay: scaleDelay,
    },
  }),
}
