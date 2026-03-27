export type NodeLikeResponse = {
  statusCode: number;
  setHeader: (name: string, value: string | string[]) => void;
  end: (chunk?: Uint8Array | Buffer | string | null) => void;
};

export const applyFetchResponseHeaders = (
  res: Pick<NodeLikeResponse, 'setHeader'>,
  response: Response
): void => {
  const responseHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookies = responseHeaders.getSetCookie?.() || [];
  if (setCookies.length > 0) {
    res.setHeader('set-cookie', setCookies);
  } else {
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('set-cookie', setCookie);
    }
  }

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      return;
    }

    res.setHeader(key, value);
  });
};

export const writeFetchResponse = async (
  res: NodeLikeResponse,
  response: Response
): Promise<void> => {
  res.statusCode = response.status;
  applyFetchResponseHeaders(res, response);

  if (response.status === 204 || response.status === 304) {
    res.end();
    return;
  }

  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
};
