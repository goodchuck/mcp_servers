import { z } from "zod";
import { MAIN_API_URL } from "../common/url.js";
import { chzzkFetch } from "../common/chzzk-fetch.js";

export const VideoSortTypeSchema = z.enum(["POPULAR", "LATEST"]);
export type VideoSortType = z.infer<typeof VideoSortTypeSchema>;

export const SearchVideoSchema = z.object({
  size: z.number().describe("검색할 비디오 수"),
  sortType: VideoSortTypeSchema.describe("정렬 타입"),
});

export async function getChzzkVideos({
  size,
  sortType = "POPULAR",
  apiPath = "v1",
}: {
  size: number;
  sortType?: VideoSortType;
  apiPath?: string;
}) {
  const url = `${MAIN_API_URL}/service/${apiPath}/home/videos?size=${size}&sortType=${sortType}`;
  const response = await chzzkFetch(url, {});
  const body = await response.json();
  return body;
}
