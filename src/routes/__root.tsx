/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { ReactNode } from 'react'
import { Nav } from '~/components/Nav'
import { getSession } from '../../server/auth'
import globalCss from '~/styles/global.css?url'
import appCss from '~/styles/app.css?url'

const fetchUser = createServerFn({ method: 'GET' }).handler(async () => {
  return await getSession()
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [
      { rel: 'stylesheet', href: globalCss },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  beforeLoad: async () => {
    const user = await fetchUser()
    return { user }
  },
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  const { user } = Route.useRouteContext()
  return (
    <>
      <Nav user={user} />
      <Outlet />
    </>
  )
}
