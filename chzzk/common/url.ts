export const MAIN_API_URL = 'https://api.chzzk.naver.com';
export const CLIP_URL = 'https://chzzk.naver.com/clips';

export const getClipUrl = (chzzkChannelId: string) => {
  return `${CLIP_URL}/${chzzkChannelId}`;
};
