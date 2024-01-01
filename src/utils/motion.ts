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

export const animateRewindStat = {
  hidden: {
    opacity: 1, // TODO: opacity: 0 broken on initial render
    y: 50,
  },
  show: {
    opacity: 1,
    y: 0,
  },
  scaleDown: {
    opacity: 0.5,
    fontSize: "20px",
    lineHeight: "22px",
  },
}
