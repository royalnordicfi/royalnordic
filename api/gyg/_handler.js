import { proxyGygGateway } from './_proxy.js'

/** Build a Web Handler bound to a canonical gateway pathname. */
export function gygHandler(pathname) {
  return async function handler(request) {
    return proxyGygGateway(request, pathname)
  }
}
