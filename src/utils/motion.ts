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
    y: 50,
  },
  show: {
    y: 0,
  },
  scaleDown: (scaleDelay: number) => ({
    opacity: 0.5,
    fontSize: '20px',
    transition: {
      delay: scaleDelay,
    },
  }),
}
