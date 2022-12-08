function Card({ children, className }) {
  return (
    <article className={`p-8 rounded-3xl ${className}`}>{children}</article>
  )
}

export default Card
