import { z } from "zod";
import { MAIN_API_URL } from "../common/url.js";
import { chzzkFetch } from "../common/chzzk-fetch.js";

export const LiveSortTypeSchema = z.enum(["POPULAR", "LATEST", "RECOMMEND"]);
export type LiveSortType = z.infer<typeof LiveSortTypeSchema>;
export const SearchLiveSchema = z.object({
  size: z.number().describe("검색할 라이브 수"),
  sortType: LiveSortTypeSchema.describe("정렬 타입"),
});

export async function getChzzkLives({
  size,
  sortType = "POPULAR",
  apiPath = "v1",
}: {
  size: number;
  sortType?: LiveSortType;
  apiPath?: string;
}) {
  const url = `${MAIN_API_URL}/service/${apiPath}/lives?size=${size}&sortType=${sortType}`;
  const response = await chzzkFetch(url, {});
  const body = await response.json();
  return body;
}
