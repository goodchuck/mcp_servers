import { z } from "zod";
import { MAIN_API_URL } from "../common/url.js";
import { chzzkFetch } from "../common/chzzk-fetch.js";

export const SearchClipSchema = z.object({
  chzzkChannelId: z.string().describe("chzzk channel Id"),
  size: z.number().describe("검색할 클립 수"),
  filterType: z.string().describe("필터 타입"),
  orderType: z.enum(["RECENT", "POPULAR"]).describe("정렬 타입"),
});

export const SearchPopularClipSchema = z.object({
  filterType: z.enum(["WITHIN_1_DAY", " WITHIN_7_DAYS"]),
  orderType: z.enum(["RECOMMEND", "POPULAR"]),
});

export const SearchClipResponseSchema = z.object({
  clips: z.array(z.object({})),
});

export async function getChzzkClip({
  chzzkChannelId,
  size,
  filterType = "ALL",
  orderType = "RECENT",
  apiPath = "v1",
}: {
  chzzkChannelId: string;
  size: number;
  filterType: string;
  orderType?: "RECENT" | "POPULAR";
  apiPath?: string;
}) {
  console.log("Executing getChzzkClip", chzzkChannelId);
  const url = `${MAIN_API_URL}/service/${apiPath}/channels/${chzzkChannelId}/clips?filterType=${filterType}&orderType=${orderType}&size=${size}`;
  const response = await chzzkFetch(url, {});
  const body = await response.json();
  //   console.log(body);
  //   console.log(response);
  return body;
}

export async function getChzzkPopularClip({
  filterType = "WITHIN_7_DAYS",
  orderType = "RECOMMEND",
  apiPath = "v1",
}: {
  filterType: string;
  orderType?: "RECOMMEND" | "POPULAR";
  apiPath?: string;
}) {
  const url = `${MAIN_API_URL}/service/${apiPath}/home/recommended/clips?filterType=${filterType}&orderType=${orderType}`;
  const response = await chzzkFetch(url, {});
  const body = await response.json();
  //   console.log(body);
  //   console.log(response);
  return body;
}
