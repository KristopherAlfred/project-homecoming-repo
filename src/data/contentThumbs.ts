export const contentThumbs: Record<
  string,
  { src: string; isVideo?: boolean; isImage?: boolean }
> = {
  studio: { src: "/content/studio.jpg", isVideo: true },
  drop: { src: "/content/drop.jpg", isVideo: true },
  tour: { src: "/content/tour.jpg", isImage: true },
  qa: { src: "/content/qa.jpg" },
  audio: { src: "/content/audio.jpg" },
};
