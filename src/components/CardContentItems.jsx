import CardContentItem from './CardContentItem'

export default async function CardContentItems({ items, type, serverId }) {
  return (
    <ul className='grid mt-4 overflow-hidden lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-3 sm:mt-6 lg:gap-x-8 gap-y-3 sm:gap-y-5'>
      {items.map((itemData, i) => (
        <CardContentItem
          data={itemData}
          i={i}
          key={i}
          type={type}
          serverId={serverId}
        />
      ))}
    </ul>
  )
}
