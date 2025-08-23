"use client";

import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useRef, useState } from "react";

interface PuzzlePiece {
  id: number;
  correctPosition: number;
  currentPosition: number | null;
  imageUrl: string;
}

interface PiecePosition {
  x: number;
  y: number;
  rotation: number;
}

interface DraggablePieceProps {
  piece: PuzzlePiece;
  isInCorrectPosition: boolean;
  fixedSize?: number; // Add optional fixed size prop
}

const MAX_PIECE_SIZE = 180;
const MAX_PIECE_SIZE_SMALL = 120;
const REFERENCE_MESSAGE = "Save the memory!";
const LARGE_SCREEN_THRESHOLD = 600;
const DEFAULT_PADDING = 48;
const GRID_SIZE = 3;

// Additional constants for magic numbers
const CONTAINER_PADDING = 16;
const PIECE_MARGIN = 15;
const GRID_EXTRA_PADDING = 32;
const PIECE_ROTATION_RANGE = 30;
const MAX_POSITION_ATTEMPTS = 100;
const MAX_DISPLACED_ATTEMPTS = 50;
const DRAG_ACTIVATION_DISTANCE = 8;
const TOUCH_ACTIVATION_DELAY = 100;
const TOUCH_ACTIVATION_TOLERANCE = 8;
const TIMER_UPDATE_INTERVAL = 1000;
const PIECE_OPACITY_DRAGGING = 0.5;
const PIECE_OPACITY_NORMAL = 1;
const TRANSITION_DURATION = 300;

// Shared container sizing for consistent dimensions
const SHARED_CONTAINER_MIN_WIDTH = 200;
const SHARED_CONTAINER_MIN_HEIGHT = 200;
const SHARED_CONTAINER_MAX_WIDTH_HORIZONTAL = 600;
const SHARED_CONTAINER_MAX_WIDTH_VERTICAL = 500;
const SHARED_CONTAINER_MAX_HEIGHT = "80vh";

// Reference image sizing
const REF_IMAGE_CONTENT_MAX_HEIGHT_HORIZONTAL = "calc(" + SHARED_CONTAINER_MAX_HEIGHT + " - 64px)";
const REF_IMAGE_CONTENT_MAX_WIDTH_VERTICAL = SHARED_CONTAINER_MAX_WIDTH_VERTICAL - 32 + "px";

// UI messages and texts
const PUZZLE_COMPLETE_TITLE = "🎉 Puzzle Complete! 🎉";
const PUZZLE_COMPLETE_MESSAGE = "Congratulations! You solved the jigsaw puzzle!";
const TOTAL_TIME_LABEL = "Total time:";
const PLAY_AGAIN_BUTTON = "Play Again";
const DROP_HERE_TEXT = "Drop here";
const IMAGE_ALT_TEXT = "Reference";
const PLACEHOLDER_IMAGE = "/placeholder.svg";

// CSS classes
const BORDER_CORRECT = "border-green-400 shadow-green-200";
const BORDER_DEFAULT = "border-gray-300 hover:border-pink-400 hover:shadow-pink-200 active:cursor-grabbing";
const BORDER_DRAG_OVER = "border-dashed border-pink-400 bg-pink-50";
const BORDER_EMPTY_SLOT = "border-dashed border-gray-300 bg-gray-50";
const CURSOR_GRAB = "grab";
const CURSOR_DEFAULT = "default";
const TOUCH_ACTION_NONE = "none";

// Default container dimensions for fallback
const DEFAULT_CONTAINER_WIDTH = 800;
const DEFAULT_CONTAINER_HEIGHT = 600;

// Background gradient classes
const BACKGROUND_GRADIENT = "bg-gradient-to-br from-pink-200 via-pink-100 to-rose-200";

// Z-index values
const PIECE_BASE_Z_INDEX = 10;
const POPUP_Z_INDEX = 50;

const calcPieceSize = (containerWidth: number, containerHeight: number) => {
  const minSide = Math.min(containerWidth, containerHeight);
  const isHorizontalLayout = containerWidth > LARGE_SCREEN_THRESHOLD;
  const maxPieceSize = isHorizontalLayout ? MAX_PIECE_SIZE : MAX_PIECE_SIZE_SMALL;

  let pieceSize = Math.min(maxPieceSize, (minSide - DEFAULT_PADDING) / GRID_SIZE);

  if (isHorizontalLayout) {
    const maxTotalHeight = containerHeight * 0.8;
    const maxTotalWidth = containerWidth * 0.48;
    const maxPieceSizeByHeight = (maxTotalHeight - DEFAULT_PADDING) / GRID_SIZE;
    const maxPieceSizeByWidth = (maxTotalWidth - DEFAULT_PADDING) / GRID_SIZE;
    const maxPieceSizeWithMinSide = (containerWidth * 0.48 - DEFAULT_PADDING) / GRID_SIZE;
    pieceSize = Math.min(pieceSize, maxPieceSizeByHeight, maxPieceSizeByWidth, maxPieceSizeWithMinSide);
  } else {
    const maxTotalWidth = containerWidth * 0.9;
    const maxTotalHeight = containerHeight * 0.5;
    const maxPieceSizeByWidth = (maxTotalWidth - DEFAULT_PADDING) / GRID_SIZE;
    const maxPieceSizeByHeight = (maxTotalHeight - DEFAULT_PADDING) / GRID_SIZE;
    const maxPieceSizeWithMinSide = (containerHeight * 0.5 - DEFAULT_PADDING) / GRID_SIZE;
    pieceSize = Math.min(pieceSize, maxPieceSizeByWidth, maxPieceSizeByHeight, maxPieceSizeWithMinSide);
  }

  return pieceSize;
};

const generateRandomPosition = (containerWidth: number, containerHeight: number, pieceSize: number, margin: number = PIECE_MARGIN) => {
  const safeAreaLeft = CONTAINER_PADDING;
  const safeAreaRight = containerWidth - CONTAINER_PADDING;
  const safeAreaTop = CONTAINER_PADDING;
  const safeAreaBottom = containerHeight - CONTAINER_PADDING;

  const gridAreaSize = pieceSize * GRID_SIZE;
  const gridLeft = (containerWidth - gridAreaSize) / 2;
  const gridRight = gridLeft + gridAreaSize;
  const gridTop = (containerHeight - gridAreaSize) / 2;
  const gridBottom = gridTop + gridAreaSize;

  let randomX, randomY;
  let attempts = 0;

  do {
    attempts++;
    randomX = Math.random() * (safeAreaRight - safeAreaLeft - pieceSize) + safeAreaLeft;
    randomY = Math.random() * (safeAreaBottom - safeAreaTop - pieceSize) + safeAreaTop;

    if (attempts > MAX_DISPLACED_ATTEMPTS) break;
  } while (
    randomX + pieceSize > gridLeft - margin &&
    randomX < gridRight + margin &&
    randomY + pieceSize > gridTop - margin &&
    randomY < gridBottom + margin
  );

  // Clamp to container bounds
  randomX = Math.max(safeAreaLeft, Math.min(randomX, safeAreaRight - pieceSize));
  randomY = Math.max(safeAreaTop, Math.min(randomY, safeAreaBottom - pieceSize));

  return {
    x: randomX,
    y: randomY,
    rotation: (Math.random() - 0.5) * PIECE_ROTATION_RANGE,
  };
};

const DraggablePiece = ({ piece, isInCorrectPosition, fixedSize }: DraggablePieceProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `piece-${piece.id}`,
    disabled: isInCorrectPosition,
  });

  const row = Math.floor(piece.correctPosition / GRID_SIZE);
  const col = piece.correctPosition % GRID_SIZE;
  const pieceSize = fixedSize || MAX_PIECE_SIZE;
  const totalSize = pieceSize * GRID_SIZE;

  const style = {
    width: pieceSize,
    height: pieceSize,
    backgroundImage: `url('${piece.imageUrl}')`,
    backgroundSize: `${totalSize}px ${totalSize}px`,
    backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
    backgroundRepeat: "no-repeat",
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? PIECE_OPACITY_DRAGGING : PIECE_OPACITY_NORMAL,
    cursor: isInCorrectPosition ? CURSOR_DEFAULT : CURSOR_GRAB,
    touchAction: TOUCH_ACTION_NONE,
  };

  const borderClass = isInCorrectPosition ? BORDER_CORRECT : BORDER_DEFAULT;
  const zIndexClass = isDragging ? "z-50" : "";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`select-none overflow-hidden rounded-lg border-2 shadow-lg transition-all duration-200 ${borderClass} ${zIndexClass}`}
      style={style}
    />
  );
};

interface DropZoneProps {
  position: number;
  piece: PuzzlePiece | null;
  fixedSize?: number;
}

const DropZone = ({ position, piece, fixedSize }: DropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${position}`,
  });

  const pieceSize = fixedSize || MAX_PIECE_SIZE;

  const getBorderClass = () => {
    if (isOver && !piece) return BORDER_DRAG_OVER;
    if (piece) return "border-transparent bg-transparent p-0";
    return BORDER_EMPTY_SLOT;
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center rounded-lg border-2 transition-all duration-200 ${getBorderClass()}`}
      style={{ width: pieceSize, height: pieceSize }}
    >
      {piece ? (
        <DraggablePiece piece={piece} isInCorrectPosition={piece.currentPosition === piece.correctPosition} fixedSize={fixedSize} />
      ) : (
        <div className="text-sm text-gray-400">{DROP_HERE_TEXT}</div>
      )}
    </div>
  );
};

const JigsawPuzzle = () => {
  // Internal configuration - no props needed
  const imageUrl = "https://i.pinimg.com/736x/2b/f8/a6/2bf8a6edb93a5cb2f7b26ecf6db7495e.jpg";
  const totalPieces = GRID_SIZE * GRID_SIZE;

  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [puzzleGrid, setPuzzleGrid] = useState<(PuzzlePiece | null)[]>([]);
  const [shuffledPieces, setShuffledPieces] = useState<PuzzlePiece[]>([]);
  const [piecePositions, setPiecePositions] = useState<{ [key: number]: PiecePosition }>({});
  const [isComplete, setIsComplete] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [isHorizontalLayout, setIsHorizontalLayout] = useState(false);
  // Shared piece size state để tránh việc tính toán lại khi drag
  const [sharedPieceSize, setSharedPieceSize] = useState(MAX_PIECE_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  // Timer: only use startTimeRef (ref) and timerDisplay (state for UI)
  const startTimeRef = useRef<number | null>(null);
  const [timerDisplay, setTimerDisplay] = useState(0); // seconds (for display only)

  useEffect(() => {
    const checkScreenSize = () => {
      const screenWidth = window.innerWidth;
      // const screenHeight = window.innerHeight;
      const isLargeScreen = screenWidth >= LARGE_SCREEN_THRESHOLD; // 600px
      setIsHorizontalLayout(isLargeScreen); // Use horizontal layout for screens >= 600px
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Update shared piece size
  useEffect(() => {
    const updateSharedPieceSize = () => {
      if (!isDragging) {
        // Chỉ update khi không drag
        const calculatedSize = calcPieceSize(window.innerWidth, window.innerHeight);
        setSharedPieceSize(calculatedSize);
      }
    };
    updateSharedPieceSize();
    if (!isDragging) {
      window.addEventListener("resize", updateSharedPieceSize);
    }
    return () => window.removeEventListener("resize", updateSharedPieceSize);
  }, [isDragging]);

  // Generate random positions for pieces
  const generateRandomPositions = (pieces: PuzzlePiece[], containerEl?: HTMLElement) => {
    const pieceSize = sharedPieceSize;

    // Get container dimensions, fallback to calculated size if not available
    let containerWidth, containerHeight;
    if (containerEl) {
      const rect = containerEl.getBoundingClientRect();
      containerWidth = rect.width;
      containerHeight = rect.height;
    } else {
      // Estimate container size based on grid size and padding
      const gridSize = pieceSize * GRID_SIZE;
      containerWidth = gridSize + GRID_EXTRA_PADDING * 4; // Extra space for scattered pieces
      containerHeight = gridSize + GRID_EXTRA_PADDING * 4;
    }

    const gridAreaSize = pieceSize * GRID_SIZE;

    // Calculate safe area for pieces (inside container but outside grid)
    const safeAreaLeft = CONTAINER_PADDING;
    const safeAreaRight = containerWidth - CONTAINER_PADDING;
    const safeAreaTop = CONTAINER_PADDING;
    const safeAreaBottom = containerHeight - CONTAINER_PADDING;

    // Grid position in container (centered)
    const gridLeft = (containerWidth - gridAreaSize) / 2;
    const gridRight = gridLeft + gridAreaSize;
    const gridTop = (containerHeight - gridAreaSize) / 2;
    const gridBottom = gridTop + gridAreaSize;

    const positions: { [key: number]: PiecePosition } = {};

    pieces.forEach((piece) => {
      let randomX, randomY;
      let attempts = 0;

      do {
        attempts++;
        // Generate random position within safe area
        randomX = Math.random() * (safeAreaRight - safeAreaLeft - pieceSize) + safeAreaLeft;
        randomY = Math.random() * (safeAreaBottom - safeAreaTop - pieceSize) + safeAreaTop;

        // If too many attempts, place anywhere in safe area
        if (attempts > MAX_POSITION_ATTEMPTS) {
          break;
        }
      } while (
        // Avoid placing pieces over the grid area
        randomX + pieceSize > gridLeft - PIECE_MARGIN &&
        randomX < gridRight + PIECE_MARGIN &&
        randomY + pieceSize > gridTop - PIECE_MARGIN &&
        randomY < gridBottom + PIECE_MARGIN
      );

      // Ensure piece stays within container bounds
      randomX = Math.max(safeAreaLeft, Math.min(randomX, safeAreaRight - pieceSize));
      randomY = Math.max(safeAreaTop, Math.min(randomY, safeAreaBottom - pieceSize));

      const randomRotation = (Math.random() - 0.5) * PIECE_ROTATION_RANGE;
      positions[piece.id] = {
        x: randomX,
        y: randomY,
        rotation: randomRotation,
      };
    });

    return positions;
  };

  // Initialize puzzle
  useEffect(() => {
    const newPieces: PuzzlePiece[] = Array.from({ length: totalPieces }, (_, i) => ({
      id: i,
      correctPosition: i,
      currentPosition: null,
      imageUrl,
    }));
    // Shuffle pieces
    const shuffled = [...newPieces].sort(() => Math.random() - 0.5);
    // Generate random positions for shuffled pieces
    const positions = generateRandomPositions(shuffled, containerRef || undefined);
    setPieces(newPieces);
    setShuffledPieces(shuffled);
    setPiecePositions(positions);
    setPuzzleGrid(new Array(totalPieces).fill(null));
    setIsComplete(false);
  }, [imageUrl, containerRef]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_ACTIVATION_DELAY,
        tolerance: TOUCH_ACTIVATION_TOLERANCE,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    setIsDragging(true);
    // Start timer if not started
    if (startTimeRef.current === null && !isComplete) {
      startTimeRef.current = Date.now();
      setTimerDisplay(0);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setIsDragging(false);
    if (!over) {
      setActiveId(null);
      return;
    }
    const activeId = active.id;
    const overId = over.id;
    // Handle dropping piece onto puzzle grid
    if (overId.startsWith("slot-")) {
      const slotIndex = Number.parseInt(overId.replace("slot-", ""));
      const pieceId = Number.parseInt(activeId.replace("piece-", ""));
      const piece = pieces.find((p) => p.id === pieceId);
      if (piece) {
        const newGrid = [...puzzleGrid];
        const newShuffled = [...shuffledPieces];
        // Remove piece from its current position
        const currentGridIndex = newGrid.findIndex((p) => p && p.id === pieceId);
        if (currentGridIndex !== -1) {
          newGrid[currentGridIndex] = null;
        }
        // Remove from shuffled pieces
        const shuffledIndex = newShuffled.findIndex((p) => p.id === pieceId);
        if (shuffledIndex !== -1) {
          newShuffled.splice(shuffledIndex, 1);
        }
        // If slot is occupied, move that piece back to shuffled
        if (newGrid[slotIndex]) {
          const displacedPiece = newGrid[slotIndex]!;
          newShuffled.push(displacedPiece);
          // Generate new random position for displaced piece using container dimensions
          const containerWidth = containerRef?.getBoundingClientRect().width || DEFAULT_CONTAINER_WIDTH;
          const containerHeight = containerRef?.getBoundingClientRect().height || DEFAULT_CONTAINER_HEIGHT;
          const pieceSize = sharedPieceSize;
          const newPosition = generateRandomPosition(containerWidth, containerHeight, pieceSize);
          const newPositions = { ...piecePositions };
          newPositions[displacedPiece.id] = newPosition;
          setPiecePositions(newPositions);
        }
        // Place piece in new slot
        const updatedPiece = { ...piece, currentPosition: slotIndex };
        newGrid[slotIndex] = updatedPiece;
        setPuzzleGrid(newGrid);
        setShuffledPieces(newShuffled);
      }
    }

    const isCompleted = puzzleGrid.every((piece, index) => piece && piece.correctPosition === index);
    const completed = isCompleted && puzzleGrid.every((piece) => piece !== null);
    setIsComplete(completed);
    if (completed && startTimeRef.current !== null) {
      setTimerDisplay(Math.floor((Date.now() - startTimeRef.current) / 1000));
      startTimeRef.current = null;
    }

    setActiveId(null);
  };

  const restartPuzzle = () => {
    // Shuffle pieces again
    const shuffled = [...pieces].sort(() => Math.random() - 0.5);
    // Generate new random positions
    const newPositions = generateRandomPositions(shuffled, containerRef || undefined);
    setShuffledPieces(shuffled);
    setPiecePositions(newPositions);
    setPuzzleGrid(new Array(totalPieces).fill(null));
    setIsComplete(false);
    setTimerDisplay(0);
    startTimeRef.current = null;
  };

  // Get the active piece for drag overlay
  const activePiece = activeId ? pieces.find((p) => `piece-${p.id}` === activeId) : null;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const ReferenceImage = useCallback(() => {
    const contentImageStyles = {
      width: isHorizontalLayout ? REF_IMAGE_CONTENT_MAX_HEIGHT_HORIZONTAL : REF_IMAGE_CONTENT_MAX_WIDTH_VERTICAL,
      maxWidth: isHorizontalLayout ? "min(524px, 41vw)" : "min(40vh, 80vw)",
    };

    return (
      <div className="flex flex-col gap-1 sm:gap-2 bg-white/80 rounded-lg p-2 sm:p-4 shadow-lg backdrop-blur-sm w-max h-max">
        <img
          src={imageUrl || PLACEHOLDER_IMAGE}
          alt={IMAGE_ALT_TEXT}
          className="rounded-lg shadow-lg w-full h-full aspect-square object-cover aspect-square object-cover"
          style={contentImageStyles}
        />
        <span className="font-semibold text-gray-700 truncate px-1 text-sm sm:text-base">{REFERENCE_MESSAGE}</span>
      </div>
    );
  }, [imageUrl, isHorizontalLayout]);

  const PuzzleGrid = () => {
    return (
      <div className="relative flex flex-col gap-1 sm:gap-2 justify-center items-center w-max h-max">
        {Array.from({ length: GRID_SIZE }, (_, row) => (
          <div key={row} className="flex gap-1 sm:gap-2">
            {Array.from({ length: GRID_SIZE }, (_, col) => {
              const index = row * GRID_SIZE + col;
              const piece = puzzleGrid[index];
              return <DropZone key={index} position={index} piece={piece} fixedSize={sharedPieceSize} />;
            })}
          </div>
        ))}
      </div>
    );
  };

  const ShuffledPieces = () => {
    return shuffledPieces.map((piece) => {
      const position = piecePositions[piece.id];
      if (!position) return null;

      return (
        <div
          key={piece.id}
          className={`absolute transition-all duration-${TRANSITION_DURATION}`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: `rotate(${position.rotation}deg)`,
            zIndex: PIECE_BASE_Z_INDEX + piece.id,
          }}
        >
          <DraggablePiece piece={piece} isInCorrectPosition={false} fixedSize={sharedPieceSize} />
        </div>
      );
    });
  };

  const PopupMessage = () => (
    <div className={`fixed inset-0 z-${POPUP_Z_INDEX} flex items-center justify-center p-4`}>
      <div className="relative rounded-xl bg-white p-6 sm:p-8 text-center shadow-2xl max-w-md w-full">
        <h2 className="mb-4 text-2xl sm:text-3xl font-bold text-green-600">{PUZZLE_COMPLETE_TITLE}</h2>
        <p className="mb-2 text-base sm:text-lg text-gray-700">{PUZZLE_COMPLETE_MESSAGE}</p>
        <p className="mb-6 text-base sm:text-lg text-pink-600 font-semibold">
          {TOTAL_TIME_LABEL} <span className="font-mono">{formatTime(timerDisplay)}</span>
        </p>
        <button
          className="focus:ring-opacity-50 rounded-lg bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
          onClick={restartPuzzle}
        >
          {PLAY_AGAIN_BUTTON}
        </button>
      </div>
      <div className="absolute inset-0 bg-black opacity-50 z-[-1]"></div>
    </div>
  );

  const containerStyles = {
    maxWidth: isHorizontalLayout ? SHARED_CONTAINER_MAX_WIDTH_HORIZONTAL + "px" : SHARED_CONTAINER_MAX_WIDTH_VERTICAL + "px",
    maxHeight: SHARED_CONTAINER_MAX_HEIGHT,
    minWidth: SHARED_CONTAINER_MIN_WIDTH,
    minHeight: SHARED_CONTAINER_MIN_HEIGHT,
  };

  return (
    <div
      className={`flex justify-center gap-2 sm:gap-4 p-2 sm:p-4 min-h-screen min-w-screen ${BACKGROUND_GRADIENT} touch-none ${
        isHorizontalLayout ? "flex-row-reverse justify-evenly items-center" : "flex-col items-center"
      }`}
    >
      <ReferenceImage />
      <div className="flex flex-col items-center w-max">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Main Puzzle Area - Grid with scattered pieces around it */}
          <div
            ref={(el) => setContainerRef(el)}
            className="relative rounded-xl bg-white/80 p-2 sm:p-4 shadow-xl backdrop-blur-sm touch-none"
            style={containerStyles}
          >
            <PuzzleGrid />
            <ShuffledPieces />
          </div>
          <DragOverlay>
            {activePiece ? <DraggablePiece piece={activePiece} isInCorrectPosition={false} fixedSize={sharedPieceSize} /> : null}
          </DragOverlay>
        </DndContext>
        {isComplete && <PopupMessage />}
      </div>
    </div>
  );
};

export default JigsawPuzzle;
