import { RPCHandler } from '@orpc/server/message-port'
import { onError } from '@orpc/server'
import { appRouter } from './router'

export const orpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error)
    })
  ]
})
