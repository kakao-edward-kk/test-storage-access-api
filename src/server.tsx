import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'

export const fetch = createStartHandler(defaultStreamHandler)
