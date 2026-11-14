import { proxyGygGateway } from './_proxy.js'

export default async function handler(request) {
  return proxyGygGateway(request)
}
