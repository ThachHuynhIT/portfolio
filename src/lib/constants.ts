import { NavLink, Project, Skill, SocialLink } from "./types";

export const navLinks: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Blog", href: "/blog" },
  { label: "Contra", href: "/contra" },
  { label: "Contact", href: "#contact" },
];

export const socialLinks: SocialLink[] = [
  { name: "GitHub", url: "https://github.com", icon: "github" },
  { name: "LinkedIn", url: "https://linkedin.com", icon: "linkedin" },
  { name: "Twitter", url: "https://twitter.com", icon: "twitter" },
];

export const skills: Skill[] = [
  { name: "React", icon: "⚛️", category: "frontend", level: 95 },
  { name: "Next.js", icon: "▲", category: "frontend", level: 90 },
  { name: "TypeScript", icon: "📘", category: "frontend", level: 92 },
  { name: "Three.js", icon: "🎮", category: "frontend", level: 85 },
  { name: "Tailwind CSS", icon: "🎨", category: "frontend", level: 95 },
  { name: "Node.js", icon: "🟢", category: "backend", level: 88 },
  { name: "Python", icon: "🐍", category: "backend", level: 80 },
  { name: "PostgreSQL", icon: "🐘", category: "backend", level: 82 },
  { name: "MongoDB", icon: "🍃", category: "backend", level: 78 },
  { name: "Docker", icon: "🐳", category: "tools", level: 75 },
  { name: "Git", icon: "📦", category: "tools", level: 90 },
  { name: "Figma", icon: "🎯", category: "design", level: 70 },
];

export const projects: Project[] = [
  {
    id: "1",
    title: "AI-Powered Dashboard",
    description:
      "A real-time analytics dashboard with AI insights and predictive modeling.",
    longDescription:
      "Built with Next.js 14, React Query, and integrated with OpenAI API for intelligent data analysis. Features include real-time charts, custom data visualization, and automated reporting.",
    image: "/projects/dashboard.jpg",
    tags: ["Next.js", "TypeScript", "AI", "TailwindCSS"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com",
    featured: true,
  },
  {
    id: "2",
    title: "3D Product Configurator",
    description:
      "Interactive 3D product customization tool for e-commerce platforms.",
    longDescription:
      "A WebGL-based 3D configurator allowing customers to customize products in real-time. Built with Three.js, React Three Fiber, and integrated with Shopify API.",
    image: "/projects/configurator.jpg",
    tags: ["Three.js", "React", "WebGL", "E-commerce"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com",
    featured: true,
  },
  {
    id: "3",
    title: "Social Media Platform",
    description:
      "Full-stack social platform with real-time messaging and content sharing.",
    longDescription:
      "A complete social media solution featuring real-time messaging via WebSocket, user authentication, content moderation, and infinite scroll feeds.",
    image: "/projects/social.jpg",
    tags: ["React", "Node.js", "Socket.io", "MongoDB"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com",
    featured: false,
  },
  {
    id: "4",
    title: "Crypto Portfolio Tracker",
    description:
      "Real-time cryptocurrency portfolio management with DeFi integrations.",
    longDescription:
      "Track your crypto investments across multiple blockchains with real-time price updates, portfolio analytics, and DeFi yield tracking.",
    image: "/projects/crypto.jpg",
    tags: ["TypeScript", "Web3", "React", "APIs"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com",
    featured: false,
  },
];

export const siteConfig = {
  name: "Developer Portfolio",
  title: "John Doe | Creative Web Developer",
  description:
    "A passionate web developer crafting immersive digital experiences with cutting-edge technologies.",
  url: "https://johndoe.dev",
  ogImage: "/og.jpg",
  author: {
    name: "John Doe",
    title: "Creative Web Developer",
    bio: "I build exceptional digital experiences that live at the intersection of design and technology.",
    avatar: "/avatar.jpg",
    email: "hello@johndoe.dev",
    location: "San Francisco, CA",
  },
};
