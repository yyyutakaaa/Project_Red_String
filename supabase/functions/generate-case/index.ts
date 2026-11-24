// generate-case is retired: every case in the game is hand-written. The function stays deployed only to
// answer old clients with 410 Gone, and it makes no model calls.
import { errorResponse, originRejected, preflight } from '../_shared/http.ts';

Deno.serve((req: Request): Response => {
  if (req.method === 'OPTIONS') return preflight(req);
  if (originRejected(req)) return errorResponse(req, 403, 'forbidden_origin', 'Origin not allowed.');
  return errorResponse(req, 410, 'gone', 'New cases are no longer written on request. Every case is in the case files.');
});
