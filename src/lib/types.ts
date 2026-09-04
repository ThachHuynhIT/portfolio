// Project Types
export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  image: string;
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured?: boolean;
}

// Blog Post Types
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
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
}

// Contact Form Types
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Navigation Types
export interface NavLink {
  id: string;
  label: string;
  href: string;
}

// Social Link Types
export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
}

// Site Config Types
export interface SiteAuthor {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  email: string;
  location: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  url: string;
  ogImage: string;
  author: SiteAuthor;
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
  description?: string;
  category: string;
  tags: string[];
  image: string;
  beforeImage?: string;
  mediaType?: "image" | "video";
  videoUrl?: string;
  aspectRatio?: "portrait" | "landscape" | "square";
  featured?: boolean;
  date: string;
  location?: string;
  camera?: PhotoCameraExif;
  editing?: PhotoEditingInfo;
  order?: number;
}

