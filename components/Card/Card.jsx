function Card({ children, className }) {
  return (
    <article
      className={`px-8 pt-8 pb-5 rounded-3xl w-3/4 h-[80vh] flex flex-col xl:w-5/12 animate-bg-gradient ${className}`}
    >
      {children}
    </article>
  )
}

export default Card
