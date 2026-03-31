export const metadata = {
  title: 'Background Remover',
  description: 'Remove image background for free',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </head>
      <body style={{margin: 0}}>{children}</body>
    </html>
  )
}
