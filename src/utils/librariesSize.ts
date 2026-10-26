export type LibrariesSize = {
  size: number
  // Some library has content but reported no size, so `size` is a lower bound.
  isPartial: boolean
}

type LibrarySize = {
  size?: number | null
  hasItems: boolean
}

export function sumLibrariesSize(libraries: LibrarySize[]): LibrariesSize {
  let size = 0
  let isPartial = false

  for (const library of libraries) {
    if (library.size) {
      size += library.size
    } else if (library.hasItems) {
      isPartial = true
    }
  }

  return { size, isPartial }
}
