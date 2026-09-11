// Project Types
export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  // Vietnamese multilingual fields
  title_vi?: string;
  description_vi?: string;
  longDescription_vi?: string;
  image: string;
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured?: boolean;
  published?: boolean;
}

// Blog Post Types
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  // Vietnamese multilingual fields
  title_vi?: string;
  excerpt_vi?: string;
  content_vi?: string;
  date: string;
  category: string;
  tags: string[];
  readTime: string;
  content: string;
}

// Skill Types
export interface Skill {
  id: string;
  name: string;
  icon: string;
  category: "frontend" | "backend" | "tools" | "design";
  level: number; // 1-100
  published?: boolean;
}

// Contact Form Types
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Navigation Types
export interface NavSubLink {
  id: string;
  label: string; // English / Default
  label_vi?: string; // Vietnamese
  href: string;
  order?: number;
  published?: boolean;
}

export interface NavLink {
  id: string;
  label: string; // English / Default
  label_vi?: string; // Vietnamese
  href: string;
  order?: number;
  published?: boolean;
  children?: NavSubLink[];
}

// Social Link Types
export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  published?: boolean;
}

// Site Config Types
export interface SiteAuthor {
  name: string;
  title: string;
  title_vi?: string;
  bio: string;
  bio_vi?: string;
  avatar: string;
  email: string;
  location: string;
  location_vi?: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  title_vi?: string;
  description: string;
  description_vi?: string;
  url: string;
  ogImage: string;
  resumeUrl: string | null;
  author: SiteAuthor;
  sectionsContent?: SiteSectionsContent;
}

// Homepage section copy overrides (JSON-editable in admin; each field maps
// 1:1 to a src/locales/{en,vi}.ts key of the same dotted path). All optional —
// an unset field falls back to the locale default via useTranslation()'s t().
export interface HeroSectionContent {
  available?: string;
  available_vi?: string;
  greetingPrefix?: string;
  greetingPrefix_vi?: string;
  bio?: string;
  bio_vi?: string;
  viewWork?: string;
  viewWork_vi?: string;
  viewCV?: string;
  viewCV_vi?: string;
}

export interface AboutStatContent {
  label?: string;
  label_vi?: string;
  value?: string;
  value_vi?: string;
}

export interface AboutSectionContent {
  badge?: string;
  badge_vi?: string;
  titlePrefix?: string;
  titlePrefix_vi?: string;
  titleHighlight?: string;
  titleHighlight_vi?: string;
  role?: string;
  role_vi?: string;
  bioP1?: string;
  bioP1_vi?: string;
  bioP2?: string;
  bioP2_vi?: string;
  bioP3?: string;
  bioP3_vi?: string;
  // Fixed 4-slot array, order matches locale keys: years, projects, clients, tech.
  stats?: [AboutStatContent, AboutStatContent, AboutStatContent, AboutStatContent];
}

export interface SkillsSectionContent {
  badge?: string;
  badge_vi?: string;
  titlePrefix?: string;
  titlePrefix_vi?: string;
  titleHighlight?: string;
  titleHighlight_vi?: string;
  subtitle?: string;
  subtitle_vi?: string;
  categories?: {
    frontend?: string;
    frontend_vi?: string;
    backend?: string;
    backend_vi?: string;
    tools?: string;
    tools_vi?: string;
    design?: string;
    design_vi?: string;
  };
}

export interface ProjectsSectionContent {
  badge?: string;
  badge_vi?: string;
  titlePrefix?: string;
  titlePrefix_vi?: string;
  titleHighlight?: string;
  titleHighlight_vi?: string;
  subtitle?: string;
  subtitle_vi?: string;
  viewLive?: string;
  viewLive_vi?: string;
  sourceCode?: string;
  sourceCode_vi?: string;
  featuredBadge?: string;
  featuredBadge_vi?: string;
  closeModal?: string;
  closeModal_vi?: string;
  viewAll?: string;
  viewAll_vi?: string;
}

export interface ContactSectionContent {
  badge?: string;
  badge_vi?: string;
  titlePrefix?: string;
  titlePrefix_vi?: string;
  titleHighlight?: string;
  titleHighlight_vi?: string;
  subtitle?: string;
  subtitle_vi?: string;
  nameLabel?: string;
  nameLabel_vi?: string;
  namePlaceholder?: string;
  namePlaceholder_vi?: string;
  emailLabel?: string;
  emailLabel_vi?: string;
  emailPlaceholder?: string;
  emailPlaceholder_vi?: string;
  subjectLabel?: string;
  subjectLabel_vi?: string;
  subjectPlaceholder?: string;
  subjectPlaceholder_vi?: string;
  messageLabel?: string;
  messageLabel_vi?: string;
  messagePlaceholder?: string;
  messagePlaceholder_vi?: string;
  sendButton?: string;
  sendButton_vi?: string;
  sendingButton?: string;
  sendingButton_vi?: string;
  successTitle?: string;
  successTitle_vi?: string;
  successMessage?: string;
  successMessage_vi?: string;
  errorGeneric?: string;
  errorGeneric_vi?: string;
  errorRateLimited?: string;
  errorRateLimited_vi?: string;
  unconnectedNotice?: string;
  unconnectedNotice_vi?: string;
  mailtoPrefix?: string;
  mailtoPrefix_vi?: string;
  mailtoLinkText?: string;
  mailtoLinkText_vi?: string;
  mailtoSuffix?: string;
  mailtoSuffix_vi?: string;
  emailInfo?: string;
  emailInfo_vi?: string;
  locationInfo?: string;
  locationInfo_vi?: string;
  availabilityInfo?: string;
  availabilityInfo_vi?: string;
  workHours?: string;
  workHours_vi?: string;
  openForProjects?: string;
  openForProjects_vi?: string;
  validation?: {
    nameMin?: string;
    nameMin_vi?: string;
    emailValid?: string;
    emailValid_vi?: string;
    subjectMin?: string;
    subjectMin_vi?: string;
    messageMin?: string;
    messageMin_vi?: string;
  };
}

export interface SiteSectionsContent {
  hero?: HeroSectionContent;
  about?: AboutSectionContent;
  skills?: SkillsSectionContent;
  projects?: ProjectsSectionContent;
  contact?: ContactSectionContent;
}

// Photography / Visual Media Types
export interface PhotoCameraExif {
  make?: string;
  model?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
}

export interface PhotoEditingInfo {
  software?: string;
  colorGrade?: string;
  notes?: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  title_vi?: string;
  description?: string;
  description_vi?: string;
  location?: string;
  location_vi?: string;
  category: string;
  tags: string[];
  image: string;
  beforeImage?: string;
  mediaType?: "image" | "video";
  videoUrl?: string;
  aspectRatio?: "portrait" | "landscape" | "square";
  featured?: boolean;
  published?: boolean;
  date: string;
  camera?: PhotoCameraExif;
  editing?: PhotoEditingInfo;
  order?: number;
  albumId?: string;
}

export interface PhotoAlbum {
  id: string;
  title: string;
  title_vi?: string;
  slug: string;
  description?: string;
  description_vi?: string;
  coverImage: string;
  coverPhotoId?: string;
  photoIds: string[];
  order?: number;
  featured?: boolean;
  published?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Media Management Types
export type MediaCategory = "music" | "photo" | "project" | "blog" | "site" | "couple" | "general";

export interface MediaAsset {
  id: string;
  publicId: string;
  filename: string;
  url: string;
  secureUrl: string;
  category: MediaCategory;
  subType?: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  resourceType: "image" | "video" | "raw";
  tags: string[];
  createdAt: string;
}

// Couple & Memories Types
export interface CouplePhotoMemory {
  id: string;
  title: string;
  description?: string;
  image: string;
  date: string;
  location?: string;
  category?: string;
  featured?: boolean;
  published?: boolean;
  order?: number;
}

export interface CoupleBirthday {
  id?: string;
  name: string;
  date: string;
  emoji: string;
  zodiac: string;
  published?: boolean;
}

export interface CoupleSpecialDate {
  id?: string;
  name: string;
  date: string;
  emoji: string;
  published?: boolean;
}

export interface CoupleTimelineMemory {
  id?: string;
  date: string;
  title: string;
  description: string;
  emoji?: string;
  image?: string;
  published?: boolean;
}

export interface CoupleBucketItem {
  id?: string;
  text: string;
  emoji: string;
  done: boolean;
  published?: boolean;
}

export interface CoupleLoveLetter {
  id?: string;
  from: string;
  content: string;
  date: string;
  published?: boolean;
}

export interface CoupleFavorite {
  id?: string;
  category: string;
  title: string;
  description: string;
  emoji: string;
  published?: boolean;
}

export interface CoupleData {
  person1: string;
  person2: string;
  anniversary: string;
  footerQuote: string;
  birthdays: CoupleBirthday[];
  specialDates: CoupleSpecialDate[];
  memories: CoupleTimelineMemory[];
  photos: CouplePhotoMemory[];
  bucketList: CoupleBucketItem[];
  loveLetters: CoupleLoveLetter[];
  favorites: CoupleFavorite[];
}



