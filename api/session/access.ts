import {
  jsonResponse,
  methodNotAllowedResponse,
  serverErrorResponse,
} from '../_lib/http.ts';

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowedResponse('POST');
    }

    return jsonResponse({
      hasAccess: true,
    });
  } catch (error) {
    console.error('Failed to read access session', error);
    return serverErrorResponse();
  }
}
