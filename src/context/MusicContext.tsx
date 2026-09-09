"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  duration: number;
  audioUrl: string;
  thumbnailUrl?: string | null;
  genre?: string | null;
  playCount: number;
  lyrics?: string | null;
}

export type VisualizerStyle = "bars" | "wave" | "pulsar";
export type TabView = "player" | "charts" | "favorites" | "queue" | "info" | "lyrics";
export type DeckMode = "vinyl" | "lyrics";
export type RepeatMode = "none" | "all" | "one";
export type EqPreset = "flat" | "bass_boost" | "vocal" | "electronic" | "chill";

export interface AudioMetrics {
  bass: number;
  mid: number;
  treble: number;
  avgVolume: number;
}

export interface RoomMember {
  id: string;
  name: string;
  isHost: boolean;
  color: string;
  lastActive: number;
}

export interface LiveReaction {
  id: string;
  emoji: string;
  sender: string;
  createdAt: number;
  x: number;
}

export interface RoomMessage {
  id: string;
  sender: string;
  text: string;
  color: string;
  createdAt: number;
}

export interface MusicRoom {
  code: string;
  hostId: string;
  hostName: string;
  trackId: string;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  members: RoomMember[];
  reactions: LiveReaction[];
  messages: RoomMessage[];
}

export interface AmbientSoundsState {
  rain: boolean;
  rainVolume: number;
  fire: boolean;
  fireVolume: number;
  vinyl: boolean;
  vinylVolume: number;
}

export interface SleepTimerState {
  minutes: number | null; // null = off, 0 = end of current track, or number of minutes
  remainingSeconds: number | null;
  endTime: number | null;
}

interface MusicContextType {
  // Track & List
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  currentTrack: Track | null;
  currentIndex: number;
  filteredTracks: Track[];
  genres: string[];

  // Playback State
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  isLoading: boolean;
  hasStartedPlayback: boolean;

  // View & UI State
  visualizerStyle: VisualizerStyle;
  isZenMode: boolean;
  activeTab: TabView;
  deckMode: DeckMode;
  setDeckMode: (mode: DeckMode) => void;
  isPlayerCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  likedTrackIds: Set<string>;
  searchQuery: string;
  selectedGenre: string;
  showOnlyLiked: boolean;
  sortBy: "default" | "title" | "plays" | "duration";

  // Equalizer & Sleep Timer
  eqPreset: EqPreset;
  setEqPreset: (preset: EqPreset) => void;
  sleepTimer: SleepTimerState;
  setSleepTimerMinutes: (minutes: number | null) => void;

  // Real-time Web Audio API
  audioFrequencyData: number[];
  audioMetrics: AudioMetrics;

  // Shared Room Features
  room: MusicRoom | null;
  myMemberId: string | null;
  myMemberName: string;
  isRoomModalOpen: boolean;
  isRoomChatOpen: boolean;
  prefilledRoomCode: string;
  setPrefilledRoomCode: (code: string) => void;
  setIsRoomModalOpen: (open: boolean) => void;
  setIsRoomChatOpen: (open: boolean) => void;
  createRoom: (code: string, nickname: string) => Promise<{ success: boolean; error?: string }>;
  joinRoom: (code: string, nickname: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => Promise<void>;
  sendReaction: (emoji: string) => void;
  sendChatMessage: (text: string) => void;

  // Ambient Sounds in Zen Mode
  ambientSounds: AmbientSoundsState;
  toggleAmbientSound: (type: "rain" | "fire" | "vinyl") => void;
  setAmbientSoundVolume: (type: "rain" | "fire" | "vinyl", volume: number) => void;

  // Actions
  playTrackByIndex: (index: number) => void;
  playTrackById: (id: string) => void;
  togglePlay: () => Promise<void>;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (timeInSeconds: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMute: () => void;
  setIsShuffle: React.Dispatch<React.SetStateAction<boolean>>;
  cycleRepeat: () => void;
  cycleSpeed: () => void;
  setPlaybackRate: (rate: number) => void;
  setVisualizerStyle: (style: VisualizerStyle) => void;
  setIsZenMode: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: (tab: TabView) => void;
  setIsPlayerCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  togglePlayerCollapsed: () => void;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLike: (trackId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedGenre: (genre: string) => void;
  setShowOnlyLiked: React.Dispatch<React.SetStateAction<boolean>>;
  setSortBy: (sort: "default" | "title" | "plays" | "duration") => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

const DEFAULT_TRACKS: Track[] = [
  {
    id: "demo-1",
    title: "Midnight City Lights",
    artist: "Cyber Lofi Lounge",
    album: "Neon Dreams Vol. 1",
    duration: 198,
    audioUrl: "https://res.cloudinary.com/demo/video/upload/sample.mp3",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
    genre: "Synthwave",
    playCount: 1240,
    lyrics: `[00:02.00] 🎧 Cyber Lofi Lounge — Midnight City Lights
[00:08.50] Neon reflections shimmering on wet asphalt
[00:15.00] Quiet streets under the purple twilight sky
[00:23.20] Midnight coffee steam drifting in the cool air
[00:31.00] Lines of code flowing through the monitor screen
[00:39.50] Deep focus, chill vibrations and endless dreams
[00:48.00] Bass drops softly like raindrops on the glass
[00:56.50] Synth waves pulsing with the heartbeat of the night
[01:06.00] Lost in the soundtrack of digital memories
[01:16.20] Stars shining bright above the cyber skyline
[01:27.00] Keep moving forward, let the harmony guide your soul
[01:38.00] Neon dreams keep drifting into the dawn...`,
  },
  {
    id: "demo-2",
    title: "Cosmic Rain & Focus",
    artist: "Ambient Code Studio",
    album: "Deep Work Sessions",
    duration: 245,
    audioUrl: "https://res.cloudinary.com/demo/video/upload/sample.mp3",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    genre: "Ambient",
    playCount: 890,
    lyrics: `[00:04.00] 🌧️ Ambient Code Studio — Cosmic Rain & Focus
[00:12.00] Gentle raindrops whispering against the window
[00:22.50] Soft electronic pulses soothing the busy mind
[00:34.00] A peaceful sanctuary created for deep work
[00:46.00] Breathe in clarity, exhale the distractions
[00:58.50] Harmonic resonance lifting creative thoughts
[01:12.00] Flow state unlocked in the cosmic rain soundscape
[01:28.00] Quiet moments of inspiration and tranquility...`,
  },
];

export function MusicProvider({
  children,
  initialTracks = [],
}: {
  children: React.ReactNode;
  initialTracks?: Track[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const playCountLoggedRef = useRef<string | null>(null);

  // Equalizer BiquadFilterNodes
  const eqFiltersRef = useRef<{
    low?: BiquadFilterNode;
    midLow?: BiquadFilterNode;
    mid?: BiquadFilterNode;
    midHigh?: BiquadFilterNode;
    high?: BiquadFilterNode;
  }>({});

  // Web Audio Synthesizer Nodes for Ambient Sounds in Zen Mode
  const ambientNodesRef = useRef<{
    rainSource?: AudioBufferSourceNode;
    rainGain?: GainNode;
    fireSource?: AudioBufferSourceNode;
    fireGain?: GainNode;
    vinylSource?: AudioBufferSourceNode;
    vinylGain?: GainNode;
  }>({});

  // BroadcastChannel for instant local cross-tab sync
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Tracks State
  const [tracks, setTracks] = useState<Track[]>(() => {
    if (initialTracks && initialTracks.length > 0) {
      return initialTracks.map((t) => ({
        ...t,
        lyrics: t.lyrics || `[00:02.00] 🎵 ${t.title} - ${t.artist}\n[00:08.50] Hi-Res Audio Lounge\n[00:16.00] Enjoy the soundtrack and vibes...\n[00:26.00] Deep focus and relaxation...`,
      }));
    }
    return DEFAULT_TRACKS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);

  // Equalizer & Sleep Timer
  const [eqPreset, setEqPresetState] = useState<EqPreset>("flat");
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    minutes: null,
    remainingSeconds: null,
    endTime: null,
  });

  // View & UI State
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>("bars");
  const [isZenMode, setIsZenMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>("charts");
  const [deckMode, setDeckMode] = useState<DeckMode>("vinyl");
  const [isPlayerCollapsed, setIsPlayerCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Shared Room State
  const [room, setRoom] = useState<MusicRoom | null>(null);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [myMemberName, setMyMemberName] = useState("Listener");
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isRoomChatOpen, setIsRoomChatOpen] = useState(false);
  const [prefilledRoomCode, setPrefilledRoomCode] = useState("");

  // Ambient Sounds in Zen Mode State
  const [ambientSounds, setAmbientSounds] = useState<AmbientSoundsState>({
    rain: false,
    rainVolume: 0.5,
    fire: false,
    fireVolume: 0.5,
    vinyl: false,
    vinylVolume: 0.4,
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [showOnlyLiked, setShowOnlyLiked] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "title" | "plays" | "duration">("default");

  // Liked tracks
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // Web Audio frequency data
  const [audioFrequencyData, setAudioFrequencyData] = useState<number[]>(() =>
    Array(36).fill(0)
  );
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    bass: 0,
    mid: 0,
    treble: 0,
    avgVolume: 0,
  });

  // Hydrate preferences from LocalStorage
  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem("portfolio_music_likes");
      if (savedLikes) setLikedTrackIds(new Set(JSON.parse(savedLikes)));

      const savedVol = localStorage.getItem("portfolio_music_vol");
      if (savedVol) setVolumeState(parseFloat(savedVol));

      const savedCollapsed = localStorage.getItem("portfolio_music_collapsed");
      if (savedCollapsed) setIsPlayerCollapsed(savedCollapsed === "true");

      const savedVisualizer = localStorage.getItem("portfolio_music_visualizer");
      if (savedVisualizer && ["bars", "wave", "pulsar"].includes(savedVisualizer)) {
        setVisualizerStyle(savedVisualizer as VisualizerStyle);
      }

      const savedEq = localStorage.getItem("portfolio_music_eq");
      if (savedEq && ["flat", "bass_boost", "vocal", "electronic", "chill"].includes(savedEq)) {
        setEqPresetState(savedEq as EqPreset);
      }

      const savedName = localStorage.getItem("portfolio_music_username");
      if (savedName) setMyMemberName(savedName);
    } catch {
      // ignore
    }
  }, []);

  // Update initialTracks if passed later from page — only replace demo tracks
  useEffect(() => {
    if (initialTracks && initialTracks.length > 0) {
      setTracks((prev) => {
        // Only replace if we're still showing demo tracks
        if (prev.length === 0 || (prev.length <= 2 && prev[0].id.startsWith("demo-"))) {
          return initialTracks.map((t) => ({
            ...t,
            lyrics: t.lyrics || `[00:02.00] 🎵 ${t.title} - ${t.artist}\n[00:08.50] Hi-Res Audio Lounge\n[00:16.00] Enjoy the soundtrack and vibes...\n[00:26.00] Deep focus and relaxation...`,
          }));
        }
        return prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentTrack = tracks[currentIndex] || tracks[0] || null;

  // Initialize Web Audio API Context with 5-Band Parametric Equalizer
  const initAudioContext = useCallback(() => {
    if (!audioRef.current) return;
    if (audioCtxRef.current) {
      // Resume if suspended
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();

      // Create 5-band EQ filters
      const low = ctx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 80;

      const midLow = ctx.createBiquadFilter();
      midLow.type = "peaking";
      midLow.frequency.value = 300;
      midLow.Q.value = 1.0;

      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 1.0;

      const midHigh = ctx.createBiquadFilter();
      midHigh.type = "peaking";
      midHigh.frequency.value = 4000;
      midHigh.Q.value = 1.0;

      const high = ctx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 12000;

      eqFiltersRef.current = { low, midLow, mid, midHigh, high };

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      if (!sourceNodeRef.current && audioRef.current) {
        try {
          const source = ctx.createMediaElementSource(audioRef.current);
          // Chain: source -> low -> midLow -> mid -> midHigh -> high -> analyser -> destination
          source.connect(low);
          low.connect(midLow);
          midLow.connect(mid);
          mid.connect(midHigh);
          midHigh.connect(high);
          high.connect(analyser);
          analyser.connect(ctx.destination);
          sourceNodeRef.current = source;
        } catch {
          // already connected
        }
      }

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
      // ignore
    }
  }, []);

  // Apply Equalizer Preset gains
  const applyEqPreset = useCallback((preset: EqPreset) => {
    setEqPresetState(preset);
    try {
      localStorage.setItem("portfolio_music_eq", preset);
    } catch {
      // ignore
    }

    const { low, midLow, mid, midHigh, high } = eqFiltersRef.current;
    if (!low || !midLow || !mid || !midHigh || !high) return;

    let l = 0, ml = 0, m = 0, mh = 0, h = 0;
    if (preset === "bass_boost") {
      l = 6; ml = 3; m = 0; mh = 1; h = 2;
    } else if (preset === "vocal") {
      l = -2; ml = 0; m = 4; mh = 3; h = 1;
    } else if (preset === "electronic") {
      l = 5; ml = 2; m = -1; mh = 3; h = 5;
    } else if (preset === "chill") {
      l = 3; ml = 2; m = 0; mh = -2; h = -4;
    }

    const ctx = audioCtxRef.current;
    const t = ctx ? ctx.currentTime : 0;
    low.gain.setTargetAtTime(l, t, 0.1);
    midLow.gain.setTargetAtTime(ml, t, 0.1);
    mid.gain.setTargetAtTime(m, t, 0.1);
    midHigh.gain.setTargetAtTime(mh, t, 0.1);
    high.gain.setTargetAtTime(h, t, 0.1);
  }, []);

  // Sleep Timer Controller
  const setSleepTimerMinutes = useCallback((minutes: number | null) => {
    if (minutes === null) {
      setSleepTimer({ minutes: null, remainingSeconds: null, endTime: null });
      return;
    }

    if (minutes === 0) {
      // End of track mode
      setSleepTimer({ minutes: 0, remainingSeconds: null, endTime: null });
      return;
    }

    const now = Date.now();
    const durationMs = minutes * 60 * 1000;
    setSleepTimer({
      minutes,
      remainingSeconds: minutes * 60,
      endTime: now + durationMs,
    });
  }, []);

  // Sleep Timer Countdown Loop
  useEffect(() => {
    if (!sleepTimer.endTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((sleepTimer.endTime! - Date.now()) / 1000));
      setSleepTimer((prev) => ({ ...prev, remainingSeconds: remaining }));

      if (remaining <= 0) {
        clearInterval(interval);
        // Fade out volume and pause
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          setIsPlaying(false);
        }
        setSleepTimer({ minutes: null, remainingSeconds: null, endTime: null });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer.endTime]);

  // Procedural Web Audio Ambient Sound Generator (Rain, Fire, Vinyl Crackle)
  const initAmbientSynth = useCallback(
    (type: "rain" | "fire" | "vinyl", active: boolean, vol: number) => {
      initAudioContext();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const keySource = `${type}Source` as keyof typeof ambientNodesRef.current;
      const keyGain = `${type}Gain` as keyof typeof ambientNodesRef.current;

      if (!active) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ambientNodesRef.current[keySource] as any)?.stop();
        } catch {
          // ignore
        }
        ambientNodesRef.current[keySource] = undefined;
        return;
      }

      if (ambientNodesRef.current[keySource]) {
        const gain = ambientNodesRef.current[keyGain] as GainNode;
        if (gain) gain.gain.setTargetAtTime(vol * 0.4, ctx.currentTime, 0.1);
        return;
      }

      try {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === "rain") {
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
            b6 = white * 0.115926;
          }
        } else if (type === "fire") {
          let last = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.02 * white) / 1.02;
            const pop = Math.random() > 0.996 ? (Math.random() * 2 - 1) * 0.8 : 0;
            data[i] = last * 0.6 + pop;
          }
        } else {
          for (let i = 0; i < bufferSize; i++) {
            const white = (Math.random() * 2 - 1) * 0.02;
            const pop = Math.random() > 0.9985 ? (Math.random() * 2 - 1) * 0.5 : 0;
            data[i] = white + pop;
          }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(vol * 0.35, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ambientNodesRef.current[keySource] = source as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ambientNodesRef.current[keyGain] = gainNode as any;
      } catch {
        // ignore
      }
    },
    [initAudioContext]
  );

  const toggleAmbientSound = useCallback(
    (type: "rain" | "fire" | "vinyl") => {
      setAmbientSounds((prev) => {
        const nextActive = !prev[type];
        const vol = prev[`${type}Volume` as keyof AmbientSoundsState] as number;
        initAmbientSynth(type, nextActive, vol);
        return { ...prev, [type]: nextActive };
      });
    },
    [initAmbientSynth]
  );

  const setAmbientSoundVolume = useCallback(
    (type: "rain" | "fire" | "vinyl", vol: number) => {
      setAmbientSounds((prev) => {
        const nextVol = Math.max(0, Math.min(1, vol));
        if (prev[type]) {
          initAmbientSynth(type, true, nextVol);
        }
        return { ...prev, [`${type}Volume`]: nextVol };
      });
    },
    [initAmbientSynth]
  );

  // Animation Loop for Real-time Audio Analysis
  useEffect(() => {
    let lastTime = 0;
    const NUM_BARS = 36;
    const frequencyArray = new Uint8Array(64);

    const updateAudioData = (time: number) => {
      animFrameRef.current = requestAnimationFrame(updateAudioData);

      if (time - lastTime < 24) return;
      lastTime = time;

      if (!isPlaying || !audioRef.current) {
        setAudioFrequencyData((prev) => {
          if (prev.every((v) => v <= 1)) return prev;
          return prev.map((v) => Math.max(0, v * 0.85 - 1));
        });
        setAudioMetrics((prev) => ({
          bass: Math.max(0, prev.bass * 0.85),
          mid: Math.max(0, prev.mid * 0.85),
          treble: Math.max(0, prev.treble * 0.85),
          avgVolume: Math.max(0, prev.avgVolume * 0.85),
        }));
        return;
      }

      const analyser = analyserRef.current;
      let hasRealData = false;

      if (analyser && audioCtxRef.current && audioCtxRef.current.state === "running") {
        analyser.getByteFrequencyData(frequencyArray);
        for (let i = 0; i < frequencyArray.length; i++) {
          if (frequencyArray[i] > 0) {
            hasRealData = true;
            break;
          }
        }
      }

      if (hasRealData) {
        const bars: number[] = [];
        let bassSum = 0;
        let midSum = 0;
        let trebleSum = 0;
        let totalSum = 0;

        for (let i = 0; i < NUM_BARS; i++) {
          const binIndex = Math.min(Math.floor((i / NUM_BARS) * 48), frequencyArray.length - 1);
          const rawVal = frequencyArray[binIndex] || 0;
          const percent = Math.min(100, Math.round((rawVal / 255) * 100));
          bars.push(percent);

          totalSum += rawVal;
          if (binIndex < 5) bassSum += rawVal;
          else if (binIndex < 20) midSum += rawVal;
          else trebleSum += rawVal;
        }

        const bass = Math.min(1, bassSum / (5 * 255));
        const mid = Math.min(1, midSum / (15 * 255));
        const treble = Math.min(1, trebleSum / (28 * 255));
        const avgVolume = Math.min(1, totalSum / (NUM_BARS * 255));

        setAudioFrequencyData(bars);
        setAudioMetrics({ bass, mid, treble, avgVolume });
      } else {
        const t = (audioRef.current?.currentTime || 0) * 4;
        const currentVol = isMuted ? 0 : volume;
        const bars: number[] = [];
        let bassSum = 0;

        for (let i = 0; i < NUM_BARS; i++) {
          const wave1 = Math.sin(t + i * 0.4);
          const wave2 = Math.cos(t * 1.5 - i * 0.3);
          const wave3 = Math.sin(t * 0.7 + i * 0.8);
          const combined = Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
          const height = Math.min(95, Math.max(10, combined * 100 * currentVol));
          bars.push(Math.round(height));
          if (i < 6) bassSum += height;
        }

        const bass = Math.min(1, (bassSum / (6 * 100)) * currentVol);
        setAudioFrequencyData(bars);
        setAudioMetrics({
          bass,
          mid: bass * 0.8,
          treble: bass * 0.6,
          avgVolume: bass * 0.75,
        });
      }
    };

    animFrameRef.current = requestAnimationFrame(updateAudioData);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isMuted, volume]);

  // Sync audio element source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.audioUrl;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;
    setCurrentTime(0);
    setDuration(currentTrack.duration || 0);
    setIsLoading(true);
    playCountLoggedRef.current = null;

    if (isPlaying) {
      initAudioContext();
      audio
        .play()
        .then(() => setIsLoading(false))
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentTrack?.id]);

  // Volume & rate sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  // Actions
  const toggleLike = useCallback((id: string) => {
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("portfolio_music_likes", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Broadcast Room Playback Sync
  const syncRoomPlayback = useCallback(
    (trackId: string, playing: boolean, time: number) => {
      if (!room || !myMemberId) return;

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: "SYNC_PLAYBACK",
          trackId,
          isPlaying: playing,
          currentTime: time,
          senderId: myMemberId,
        });
      }

      fetch(`/api/music/rooms/${room.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync",
          memberId: myMemberId,
          trackId,
          isPlaying: playing,
          currentTime: time,
        }),
      }).catch(() => {});
    },
    [room, myMemberId]
  );

  const playTrackByIndex = useCallback(
    (index: number) => {
      initAudioContext();
      setHasStartedPlayback(true);
      const targetTrack = tracks[index];
      if (index === currentIndex && isPlaying) {
        togglePlay();
        return;
      }
      setCurrentIndex(index);
      setIsPlaying(true);
      const audio = audioRef.current;
      if (audio && index === currentIndex) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }

      if (room && targetTrack) {
        syncRoomPlayback(targetTrack.id, true, 0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, isPlaying, initAudioContext, room, syncRoomPlayback, tracks]
  );

  const playTrackById = useCallback(
    (id: string) => {
      const idx = tracks.findIndex((t) => t.id === id);
      if (idx !== -1) {
        playTrackByIndex(idx);
      }
    },
    [tracks, playTrackByIndex]
  );

  const togglePlay = useCallback(async () => {
    initAudioContext();
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (room) syncRoomPlayback(currentTrack.id, false, audio.currentTime);
    } else {
      try {
        setHasStartedPlayback(true);
        await audio.play();
        setIsPlaying(true);
        if (room) syncRoomPlayback(currentTrack.id, true, audio.currentTime);
      } catch (err) {
        console.error("Audio playback error:", err);
        setIsPlaying(false);
      }
    }
  }, [isPlaying, currentTrack, initAudioContext, room, syncRoomPlayback]);

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    initAudioContext();
    setHasStartedPlayback(true);
    let nextIdx: number;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * tracks.length);
    } else {
      nextIdx = (currentIndex + 1) % tracks.length;
    }
    setCurrentIndex(nextIdx);
    setIsPlaying(true);
    if (room && tracks[nextIdx]) {
      syncRoomPlayback(tracks[nextIdx].id, true, 0);
    }
  }, [isShuffle, tracks, currentIndex, initAudioContext, room, syncRoomPlayback]);

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    initAudioContext();
    setHasStartedPlayback(true);
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      if (room && currentTrack) syncRoomPlayback(currentTrack.id, isPlaying, 0);
      return;
    }
    const prevIdx = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prevIdx);
    setIsPlaying(true);
    if (room && tracks[prevIdx]) {
      syncRoomPlayback(tracks[prevIdx].id, true, 0);
    }
  }, [tracks, currentIndex, initAudioContext, currentTrack, isPlaying, room, syncRoomPlayback]);

  const seekTo = useCallback(
    (newTime: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      setHasStartedPlayback(true);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      if (room && currentTrack) {
        syncRoomPlayback(currentTrack.id, isPlaying, newTime);
      }
    },
    [room, currentTrack, isPlaying, syncRoomPlayback]
  );

  const handleEnded = useCallback(() => {
    if (sleepTimer.minutes === 0) {
      // Sleep timer set to end of current track
      setIsPlaying(false);
      setSleepTimer({ minutes: null, remainingSeconds: null, endTime: null });
      return;
    }

    if (repeatMode === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } else if (repeatMode === "all" || currentIndex < tracks.length - 1) {
      nextTrack();
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, currentIndex, tracks.length, nextTrack, sleepTimer.minutes]);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    setIsMuted(false);
    try {
      localStorage.setItem("portfolio_music_vol", clamped.toString());
    } catch {
      // ignore
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "none" ? "all" : m === "all" ? "one" : "none"));
  }, []);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    setPlaybackRate((r) => {
      const nextIdx = (speeds.indexOf(r) + 1) % speeds.length;
      return speeds[nextIdx];
    });
  }, []);

  const handleSetVisualizer = useCallback((style: VisualizerStyle) => {
    setVisualizerStyle(style);
    try {
      localStorage.setItem("portfolio_music_visualizer", style);
    } catch {
      // ignore
    }
  }, []);

  const togglePlayerCollapsed = useCallback(() => {
    setIsPlayerCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("portfolio_music_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM ACTIONS & REAL-TIME SYNCHRONIZATION
  // ─────────────────────────────────────────────────────────────────────────────
  const createRoom = useCallback(
    async (code: string, nickname: string) => {
      try {
        const res = await fetch("/api/music/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            hostName: nickname.trim(),
            trackId: currentTrack?.id || "",
            isPlaying,
            currentTime,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Failed to create room" };
        }

        setRoom(data.room);
        setMyMemberId(data.memberId);
        setMyMemberName(nickname.trim());
        try {
          localStorage.setItem("portfolio_music_username", nickname.trim());
        } catch {
          // ignore
        }
        return { success: true };
      } catch (err) {
        console.error("Create room error:", err);
        return { success: false, error: "Network error creating room" };
      }
    },
    [currentTrack, isPlaying, currentTime]
  );

  const joinRoom = useCallback(
    async (code: string, nickname: string) => {
      try {
        const cleanCode = code.trim().toUpperCase();
        const res = await fetch(`/api/music/rooms/${cleanCode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "join",
            memberName: nickname.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Room not found or invalid" };
        }

        setRoom(data.room);
        setMyMemberId(data.memberId);
        setMyMemberName(nickname.trim());

        try {
          localStorage.setItem("portfolio_music_username", nickname.trim());
        } catch {
          // ignore
        }

        if (data.room.trackId) {
          const idx = tracks.findIndex((t) => t.id === data.room.trackId);
          if (idx !== -1) {
            setCurrentIndex(idx);
            setIsPlaying(data.room.isPlaying);
            if (audioRef.current) {
              audioRef.current.currentTime = data.room.currentTime;
              if (data.room.isPlaying) audioRef.current.play().catch(() => {});
            }
          }
        }

        return { success: true };
      } catch (err) {
        console.error("Join room error:", err);
        return { success: false, error: "Network error joining room" };
      }
    },
    [tracks]
  );

  const leaveRoom = useCallback(async () => {
    if (!room || !myMemberId) return;
    try {
      await fetch(`/api/music/rooms/${room.code}?memberId=${myMemberId}`, {
        method: "DELETE",
      });
    } catch {
      // ignore
    }
    setRoom(null);
    setMyMemberId(null);
  }, [room, myMemberId]);

  const sendReaction = useCallback(
    (emoji: string) => {
      if (!room || !myMemberId) return;

      const newReaction: LiveReaction = {
        id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        emoji,
        sender: myMemberName,
        createdAt: Date.now(),
        x: Math.floor(Math.random() * 80) + 10,
      };

      setRoom((prev) => (prev ? { ...prev, reactions: [...prev.reactions, newReaction] } : null));

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: "NEW_REACTION",
          reaction: newReaction,
        });
      }

      fetch(`/api/music/rooms/${room.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reaction",
          memberId: myMemberId,
          memberName: myMemberName,
          emoji,
        }),
      }).catch(() => {});
    },
    [room, myMemberId, myMemberName]
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!room || !myMemberId || !text.trim()) return;

      const newMessage: RoomMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: myMemberName,
        text: text.trim(),
        color: "#06b6d4",
        createdAt: Date.now(),
      };

      setRoom((prev) => (prev ? { ...prev, messages: [...prev.messages, newMessage] } : null));

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: "NEW_MESSAGE",
          message: newMessage,
        });
      }

      fetch(`/api/music/rooms/${room.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          memberId: myMemberId,
          memberName: myMemberName,
          text,
        }),
      }).catch(() => {});
    },
    [room, myMemberId, myMemberName]
  );

  // BroadcastChannel setup for instant cross-tab sync
  useEffect(() => {
    if (!room) {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
      return;
    }

    const channel = new BroadcastChannel(`portfolio_music_room_${room.code}`);
    broadcastChannelRef.current = channel;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.onmessage = (event: MessageEvent<any>) => {
      const { type, trackId, isPlaying: channelPlaying, currentTime: channelTime, senderId, reaction, message } = event.data;

      if (type === "SYNC_PLAYBACK" && senderId !== myMemberId) {
        if (trackId) {
          const idx = tracks.findIndex((t) => t.id === trackId);
          if (idx !== -1 && idx !== currentIndex) {
            setCurrentIndex(idx);
          }
        }
        setIsPlaying(channelPlaying);
        const audio = audioRef.current;
        if (audio) {
          if (Math.abs(audio.currentTime - channelTime) > 2) {
            audio.currentTime = channelTime;
          }
          if (channelPlaying) audio.play().catch(() => {});
          else audio.pause();
        }
      } else if (type === "NEW_REACTION" && reaction) {
        setRoom((prev) => (prev ? { ...prev, reactions: [...prev.reactions, reaction] } : null));
      } else if (type === "NEW_MESSAGE" && message) {
        setRoom((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : null));
      }
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [room?.code, myMemberId, tracks, currentIndex]);

  // Periodic Room Polling Sync (every 2.5s)
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/music/rooms/${room.code}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.room) {
          setRoom(data.room);

          const isHost = data.room.hostId === myMemberId;
          if (!isHost && data.room.trackId) {
            const idx = tracks.findIndex((t) => t.id === data.room.trackId);
            if (idx !== -1 && idx !== currentIndex) {
              setCurrentIndex(idx);
            }
            if (data.room.isPlaying !== isPlaying) {
              setIsPlaying(data.room.isPlaying);
              if (audioRef.current) {
                if (data.room.isPlaying) audioRef.current.play().catch(() => {});
                else audioRef.current.pause();
              }
            }
            if (audioRef.current && Math.abs(audioRef.current.currentTime - data.room.currentTime) > 3) {
              audioRef.current.currentTime = data.room.currentTime;
            }
          }
        }
      } catch {
        // ignore
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [room?.code, myMemberId, tracks, currentIndex, isPlaying]);

  // Compute unique genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      if (t.genre && t.genre.trim()) set.add(t.genre.trim());
    });
    return ["All", ...Array.from(set)];
  }, [tracks]);

  // Filtered & sorted tracks list
  const filteredTracks = useMemo(() => {
    let list = tracks.filter((t) => {
      const matchSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.album && t.album.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.genre && t.genre.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGenre =
        selectedGenre === "All" ||
        (t.genre && t.genre.toLowerCase() === selectedGenre.toLowerCase());

      const matchLiked = !showOnlyLiked || likedTrackIds.has(t.id);

      return matchSearch && matchGenre && matchLiked;
    });

    if (sortBy === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "plays") {
      list = [...list].sort((a, b) => b.playCount - a.playCount);
    } else if (sortBy === "duration") {
      list = [...list].sort((a, b) => b.duration - a.duration);
    }

    return list;
  }, [tracks, searchQuery, selectedGenre, showOnlyLiked, likedTrackIds, sortBy]);

  return (
    <MusicContext.Provider
      value={{
        tracks,
        setTracks,
        currentTrack,
        currentIndex,
        filteredTracks,
        genres,

        isPlaying,
        currentTime,
        duration,
        buffered,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        playbackRate,
        isLoading,
        hasStartedPlayback,

        eqPreset,
        setEqPreset: applyEqPreset,
        sleepTimer,
        setSleepTimerMinutes,

        visualizerStyle,
        isZenMode,
        activeTab,
        deckMode,
        setDeckMode,
        isPlayerCollapsed,
        isMobileSidebarOpen,
        likedTrackIds,
        searchQuery,
        selectedGenre,
        showOnlyLiked,
        sortBy,

        audioFrequencyData,
        audioMetrics,

        room,
        myMemberId,
        myMemberName,
        isRoomModalOpen,
        isRoomChatOpen,
        prefilledRoomCode,
        setPrefilledRoomCode,
        setIsRoomModalOpen,
        setIsRoomChatOpen,
        createRoom,
        joinRoom,
        leaveRoom,
        sendReaction,
        sendChatMessage,

        ambientSounds,
        toggleAmbientSound,
        setAmbientSoundVolume,

        playTrackByIndex,
        playTrackById,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        setIsMuted,
        toggleMute,
        setIsShuffle,
        cycleRepeat,
        cycleSpeed,
        setPlaybackRate,
        setVisualizerStyle: handleSetVisualizer,
        setIsZenMode,
        setActiveTab,
        setIsPlayerCollapsed,
        togglePlayerCollapsed,
        setIsMobileSidebarOpen,
        toggleLike,
        setSearchQuery,
        setSelectedGenre,
        setShowOnlyLiked,
        setSortBy,
      }}
    >
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onProgress={() => {
          if (audioRef.current && audioRef.current.buffered.length > 0 && duration > 0) {
            const end = audioRef.current.buffered.end(audioRef.current.buffered.length - 1);
            setBuffered((end / duration) * 100);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={handleEnded}
        onCanPlay={() => {
          setIsLoading(false);
          // Only auto-play if we were already in playing state (e.g. track switch)
          if (isPlaying && audioRef.current?.paused) {
            audioRef.current?.play().catch(() => {});
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
      />

      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
