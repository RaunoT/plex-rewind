export default function Card({ children }) {
  return (
    <article className="px-6 sm:px-8 pt-8 pb-3 sm:pb-5 rounded-3xl w-full min-h-[75vh] flex flex-col bg-gradient">
      {children}
    </article>
  )
}
