import * as SwitchPrimitive from '@radix-ui/react-switch'

type Props = {
  id: string
  name: string
}

export default function Switch({ id, name }: Props) {
  return (
    <SwitchPrimitive.Root
      className='relative h-6 w-12 rounded-full border-black bg-neutral-400 aria-checked:bg-neutral-500'
      id={id}
      name={name}
    >
      <SwitchPrimitive.Thumb className='absolute inset-y-0 left-0.5 my-auto size-5 rounded-full bg-white transition data-[state=checked]:translate-x-6' />
    </SwitchPrimitive.Root>
  )
}
