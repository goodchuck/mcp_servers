const cookie = {
  uuid: process.env.uuid,
  NAC: process.env.NAC,
};

export async function chzzkFetch(url: string, options: RequestInit) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      host: "api.chzzk.naver.com",
      connection: "keep-alive",
      "cache-control": "no-cache",
      "sec-ch-ua-platform": '"Windows"',
      "sec-ch-ua":
        '"Not(ABrand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
      pragma: "no-cache",
      "sec-ch-ua-mobile": "?0",
      "front-client-platform-type": "PC",
      deviceid: "92e7c3e3-5ca8-4d4e-a2e5-cbffbf2fc230",
      "front-client-product-type": "web",
      accept: "application/json, text/plain, */*",
      "if-modified-since": "Mon, 26 Jul 1997 050000 GMT",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      // origin: 'https//chzzk.naver.com',
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https//chzzk.naver.com/live/64d76089fba26b180d9c9e48a32600d9",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      cookie: cookie.uuid + ";" + cookie.NAC,
    },
    ...options,
  });
  return response;
}
