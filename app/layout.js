import './globals.css'

export const metadata = {
  title: 'Z | Lead Intelligence - Assistente de Vendas',
  description: 'Assistente de vendas inteligente para gestão de leads. Busque, analise e crie abordagens personalizadas com IA.',
  keywords: 'leads, vendas, CRM, inteligência artificial, assistente, gestão de leads',
  authors: [{ name: 'Z Lead Intelligence' }],
  openGraph: {
    title: 'Z | Lead Intelligence',
    description: 'Assistente de vendas inteligente para gestão de leads',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%2310b981' rx='20' width='100' height='100'/><text y='.9em' x='50%' text-anchor='middle' font-size='70' fill='white' font-weight='bold'>Z</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  )
}
