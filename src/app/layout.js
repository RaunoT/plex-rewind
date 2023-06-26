import '@/styles/globals.css'

export const metadata = {
  themeColor: '#312e81',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className='text-white bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900 min-height-screen'>
        <main className='flex flex-col items-center px-4 py-8 overflow-x-hidden pt-36 min-height-screen sm:justify-center sm:pt-0'>
          {children}
        </main>
      </body>
    </html>
  )
}
