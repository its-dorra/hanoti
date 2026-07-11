import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/message-port'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { RouterClient } from '@orpc/server'
import type { AppRouter } from '../../../../shared/orpc/router'
const { port1: clientPort, port2: serverPort } = new MessageChannel()

window.postMessage('start-orpc-client', '*', [serverPort])

const link = new RPCLink({
  port: clientPort
})

clientPort.start()

export const orpcClient: RouterClient<AppRouter> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(orpcClient)
