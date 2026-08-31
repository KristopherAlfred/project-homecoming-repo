export type ContentItem = {
  title: string;
  type: string;
  status: string;
  published: string;
  views: string;
  engagement: string;
  thumb: string;
  channel?: string;
};

export const socialContent: ContentItem[] = [
  { title: "Tour countdown — IG Story", type: "Story", status: "Published", published: "Jun 2, 4:20 PM", views: "86K", engagement: "12.4%", thumb: "drop", channel: "Instagram" },
  { title: "Practice facility reel", type: "Reel", status: "Published", published: "Jun 1, 1:15 PM", views: "214K", engagement: "18.2%", thumb: "studio", channel: "TikTok" },
  { title: "Game day fit check", type: "Post", status: "Scheduled", published: "Jun 4, 10:00 AM", views: "—", engagement: "—", thumb: "tour", channel: "Instagram" },
  { title: "Fan shoutout thread", type: "Post", status: "Published", published: "May 30, 9:30 PM", views: "42K", engagement: "9.8%", thumb: "qa", channel: "X" },
];

export const newsContent: ContentItem[] = [
  { title: "Fan Q&A Recap Article", type: "Article", status: "Published", published: "May 29, 11:45 AM", views: "98K", engagement: "28.4%", thumb: "qa" },
  { title: "Tour dates press release", type: "Press", status: "Published", published: "May 27, 8:00 AM", views: "64K", engagement: "—", thumb: "tour" },
  { title: "Partnership announcement", type: "Article", status: "Draft", published: "—", views: "—", engagement: "—", thumb: "drop" },
  { title: "Season recap feature", type: "Feature", status: "Published", published: "May 24, 2:00 PM", views: "112K", engagement: "22.1%", thumb: "studio" },
];

export const videoContent: ContentItem[] = [
  { title: "Behind the Scenes — Studio Session", type: "Video", status: "Published", published: "Jun 2, 2:14 PM", views: "284K", engagement: "41.2%", thumb: "studio" },
  { title: "Inner Circle Exclusive Drop", type: "Video", status: "Published", published: "May 31, 6:30 PM", views: "412K", engagement: "52.8%", thumb: "drop" },
  { title: "Tour Announcement Teaser", type: "Video", status: "Scheduled", published: "Jun 3, 9:00 AM", views: "—", engagement: "—", thumb: "tour" },
  { title: "Mic'd up — practice highlights", type: "Video", status: "Published", published: "May 28, 7:00 PM", views: "198K", engagement: "35.6%", thumb: "qa" },
];

export const musicContent: ContentItem[] = [
  { title: "New Single — Acoustic Version", type: "Audio", status: "Published", published: "May 28, 8:00 PM", views: "156K", engagement: "36.1%", thumb: "audio" },
  { title: "Tour Hype Playlist", type: "Playlist", status: "Published", published: "May 25, 12:00 PM", views: "89K", engagement: "24.3%", thumb: "drop" },
  { title: "Unreleased snippet — Inner Circle", type: "Audio", status: "Scheduled", published: "Jun 6, 6:00 PM", views: "—", engagement: "—", thumb: "studio" },
  { title: "Studio session freestyle", type: "Audio", status: "Draft", published: "—", views: "—", engagement: "—", thumb: "audio" },
];

export const eventsContent: ContentItem[] = [
  { title: "Inner Circle meet & greet — Portland", type: "Event", status: "Scheduled", published: "Jun 15, 6:00 PM", views: "2.4K RSVPs", engagement: "—", thumb: "tour" },
  { title: "Signed jersey giveaway", type: "Giveaway", status: "Active", published: "Jun 1, 12:00 PM", views: "18.2K entries", engagement: "44.1%", thumb: "drop" },
  { title: "VIP listening party", type: "Event", status: "Published", published: "May 26, 8:00 PM", views: "840 attended", engagement: "—", thumb: "studio" },
  { title: "Flash merch drop — 24hr window", type: "Giveaway", status: "Closed", published: "May 20, 9:00 AM", views: "31K entries", engagement: "38.7%", thumb: "qa" },
];
