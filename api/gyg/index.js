import { proxyGygGateway } from './_proxy.js'

/** GET/POST /api/gyg → Edge status (reachability). */
export default async function handler(request) {
  return proxyGygGateway(request, '/api/gyg/status')
}
