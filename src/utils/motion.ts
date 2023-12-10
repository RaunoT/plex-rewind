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
    opacity: 0,
    y: 50,
  },
  show: (showDelay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: showDelay,
    },
  }),
  scaleDown: (scaleDelay: number) => ({
    opacity: 0.5,
    fontSize: '20px',
    transition: {
      delay: scaleDelay,
    },
  }),
}
