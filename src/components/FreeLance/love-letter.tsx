"use client";

import type React from "react";

import "@css/LoveLetter.css";
import { useEffect, useState } from "react";

interface ILetterData {
  name?: string;
  message?: string;
  greeting?: string;
  ownName?: string;
  title?: string;
  backToMenu?: () => void;
}

const CardFlipDemo = ({
  contentOut,
  contentFull,
  contentBottom,
  onClose,
  onEndOpen,
}: {
  contentOut: React.ReactNode;
  contentFull: React.ReactNode;
  contentBottom: React.ReactNode;
  onClose?: (e: React.MouseEvent) => void;
  onEndOpen?: (e: React.MouseEvent) => void;
}) => {
  const [opened, setOpened] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [outZIndex, setOutZIndex] = useState(3);
  const [inTopZIndex, setInTopZIndex] = useState(2);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioning) return;
    setIsClosing(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setOutZIndex(3);
      setInTopZIndex(2);
      onClose && onClose(e);
    }, 205);

    setTimeout(() => {
      setOpened(false);
      setIsClosing(false);
      setIsTransitioning(false);
    }, 750);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioning) return;
    setIsTransitioning(true);
    setOpened(true);

    setTimeout(() => {
      setIsClosing(false);
      setOutZIndex(2);
      setInTopZIndex(3);
      onEndOpen && onEndOpen(e);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="perspective relative h-full w-full" onClick={handleOpen}>
      <div
        className={`tile out ${opened && !isClosing ? "openingTop topOpen" : isClosing ? "closingTop" : ""}`}
        style={{ left: 0, zIndex: outZIndex }}
      >
        {contentOut}
      </div>
      <div
        className={`tile in-top left-0 ${opened && !isClosing ? "openingBottom bottomOpen" : isClosing ? "closingBottom" : "overflow-hidden"} `}
        style={{
          zIndex: inTopZIndex,
        }}
        onClick={handleClose}
      >
        {contentFull}
      </div>
      <div className="tile in-bottom" onClick={handleClose}>
        {contentBottom}
      </div>
    </div>
  );
};

const LoveLetter = ({ name, message, greeting, ownName, backToMenu, title }: ILetterData) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contentZ, setContentZ] = useState("z-[38]");
  const [flapBgZ, setFlapBgZ] = useState("z-40");
  const [noteTransform, setNoteTransform] = useState("translate-y-[-25%]");
  const [isMobile, setIsMobile] = useState(false);
  const [letterVisible, setLetterVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [messageContent, setMessageContent] = useState<string[]>([message ?? ""]);

  const splitMessage = (msg: string, isMobileDevice?: boolean): string[] => {
    const maxMessageString = 830;
    const messageCuted = msg.substring(0, maxMessageString);
    const maxStringMessage1 = isMobileDevice ? 417 : 500;
    const linearMaxString = maxStringMessage1 - 10;
    if (!messageCuted || messageCuted.length <= maxStringMessage1) {
      return [messageCuted];
    }
    const spaceEnd = messageCuted.substring(linearMaxString, maxStringMessage1).lastIndexOf(" ");
    const splitIndex = linearMaxString + spaceEnd;
    const firstPart = messageCuted.substring(0, splitIndex).trim();
    const secondPart = messageCuted.substring(splitIndex).trim();
    return [firstPart, secondPart];
  };

  const isShowSignInTop = (message: string, isMobile: boolean) => {
    if (!message) return false;
    const messageLengthToShowTop = isMobile ? 220 : 290;
    return message.length <= messageLengthToShowTop;
  };

  const heartAnimationDurations = [1.5, 1.7, 1.6, 1.8, 1.9, 1.6];

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 1000;
      setIsMobile(isMobileDevice);
      if (message) {
        if (isMobileDevice && message.length > 200) {
          setMessageContent(splitMessage(message, true));
        } else {
          setMessageContent(splitMessage(message));
        }
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [message]);

  useEffect(() => {
    if (contentZ === "z-[38]") {
      setContentZ("z-[39]");
    } else {
      if (isOpen) {
        setIsTransitioning(true);
        setLetterVisible(true);

        setTimeout(() => {
          setNoteTransform(isMobile ? "-translate-y-[300px]" : "-translate-y-[30rem]");
          setContentZ("z-[41]");
          setFlapBgZ("z-40");
        }, 300);

        setTimeout(() => {
          setNoteTransform(isMobile ? "translate-y-0 rotate-[-3deg]" : "translate-y-0 rotate-[-5deg]");
          setContentZ("z-[56]");
        }, 900);

        setTimeout(() => {
          setNoteTransform(isMobile ? "translate-y-0 rotate-[-3deg]" : "translate-y-0 rotate-[-5deg]");
        }, 1200);
      } else {
        setIsTransitioning(true);
        setNoteTransform(isMobile ? "translate-y-0 rotate-[-3deg]" : "translate-y-0 rotate-[-5deg]");
        setFlapBgZ("z-[39]");
        setTimeout(() => {
          setNoteTransform(isMobile ? "-translate-y-[300px]" : "-translate-y-[30rem]");
        }, 300);
        setTimeout(() => {
          setContentZ("z-50");
          setNoteTransform("translate-y-[-25%]");
        }, 900);
        setTimeout(() => {
          setContentZ("z-10");
          setLetterVisible(false);
          setIsTransitioning(false);
        }, 1500);
      }
    }
  }, [isOpen]);

  const handleLetterClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isTransitioning) return;
    if (isOpen) {
      setTimeout(() => {
        setIsOpen(false);
      }, 650);
    } else {
      setIsOpen(true);
    }
  };

  const floatingHearts = (
    <div className="pointer-events-none absolute inset-0">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`heart-float absolute heart-float-${i + 1} top-1/2 left-1/2`}
          style={{
            animation: `heartFloat${i + 1} forwards`,
            animationDuration: `${heartAnimationDurations[i]}s`,
            animationTimingFunction: "ease-out",
            animationDelay: `800ms`,
          }}
        >
          <svg viewBox="0 0 32 32" width="80" height="80">
            <path
              d="M16 29 C14 27, 2 18, 2 10 A7 7 0 0 1 16 7 A7 7 0 0 1 30 10 C30 18, 18 27, 16 29Z"
              fill={i % 3 === 0 ? "#F58E95" : i % 3 === 1 ? "#b91c1c" : "#feb1b0"}
            />
          </svg>
        </div>
      ))}
    </div>
  );

  const backButton = (
    <div className="absolute top-4 left-4">
      <button
        style={{ fontFamily: "SVN-ComicSansMS" }}
        onClick={backToMenu}
        className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 font-[OpenSans] font-medium text-gray-700 shadow-sm transition-colors hover:bg-white/90"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>
    </div>
  );

  const letterBox = (
    <>
      {/* Front Flap Shape */}
      <div className="clip-path-front absolute top-0 left-0 z-50 h-[150px] w-[250px] bg-[#b1484a] lg:h-[300px] lg:w-[500px]">
        <div className="clip-path-front-left absolute top-0 left-0 z-40 h-[150px] w-[250px] origin-top bg-[#b1484a] transition-transform duration-500 lg:h-[300px] lg:w-[500px]"></div>
        <div className="clip-path-front-right absolute top-0 right-0 z-40 h-[150px] w-[250px] origin-top bg-[#b1484a] transition-transform duration-500 lg:h-[300px] lg:w-[500px]"></div>
        <div className="clip-path-front-bottom absolute top-0 left-0 z-40 h-[150px] w-[250px] origin-top bg-[#b1484a] transition-transform duration-500 lg:h-[300px] lg:w-[500px]"></div>
      </div>
      {/* Flap Background */}
      <div
        className={`clip-path-flap-bg absolute top-0 left-0 ${flapBgZ} h-[150px] w-[250px] origin-top bg-[#b1484a] transition-transform duration-500 lg:h-[300px] lg:w-[500px] ${
          letterVisible ? `-rotate-x-180` : `rotate-x-0`
        }`}
      ></div>
      {/* Heart Letter Icon */}
      <div
        className={`absolute top-[65px] left-[104px] z-[55] -translate-x-1/2 -translate-y-1/2 scale-[0.6] transition-transform duration-300 lg:top-[140px] lg:left-[190px] ${
          isOpen ? "-translate-x-[7px] -rotate-[45deg]" : "translate-x-0 rotate-0 delay-1700"
        }`}
      >
        <svg viewBox="0 0 32 29.6" className="h-12 w-12 drop-shadow-lg lg:h-[120px] lg:w-[120px]" style={{ display: "block" }}>
          <path
            d="M23.6,0c-2.7,0-5.1,1.3-6.6,3.3C15.5,1.3,13.1,0,10.4,0C4.7,0,0,4.7,0,10.4c0,11.1,16,19.2,16,19.2s16-8.1,16-19.2
                                        C32,4.7,27.3,0,23.6,0z"
            fill="#E66F71"
          />
        </svg>
      </div>
    </>
  );

  const letterOut = (
    <p className="text-left text-3xl text-black xl:text-5xl">
      <em className="font-semibold text-black">{title}</em>,
    </p>
  );

  const letterSign = (
    <p className="mt-4 text-right lg:mt-8">
      {greeting}
      <br />
      <span className="font-semibold">{ownName}</span>
    </p>
  );

  const letterFull = (
    <div className="flex h-full w-full flex-col px-10 pt-8 leading-relaxed lg:p-20 lg:pt-10 lg:pb-0">
      <h2 className="pb-4 text-center text-2xl font-bold text-black lg:p-6 lg:text-4xl">Lá thư tình yêu</h2>
      <div className="text-md overflow-hidden text-left lg:text-3xl">
        <p className="lg:mb-4">
          <em className="font-semibold">{name}</em>
        </p>
        <div className="flex h-full flex-col space-y-3 overflow-y-auto">
          <p className="m-0 leading-[1.5]">{messageContent[0]}</p>
          {isShowSignInTop(messageContent[0], isMobile) && letterSign}
        </div>
      </div>
    </div>
  );

  const letterBotton = (
    <div className="text-md flex h-full w-full flex-col px-10 py-8 pt-1 lg:px-20 lg:py-10 lg:pt-0 lg:text-3xl">
      {messageContent[1] && (
        <div className="space-y-1">
          <p className="leading-[1.5]">{messageContent[1]}</p>
        </div>
      )}
      {!isShowSignInTop(messageContent[0], isMobile) && letterSign}
      {/* <div className="mb-1 flex justify-center space-x-2 lg:pb-6">
                <span className="text-pink-500">♥</span>
                <span className="text-pink-400">♥</span>
                <span className="text-pink-500">♥</span>
            </div> */}
    </div>
  );

  const letterContent = (
    <div className="col-span-12 row-span-3 row-start-4 mx-auto flex items-center justify-center sm:col-span-4 sm:col-start-5">
      <div
        className={`fly-in relative h-[150px] w-[250px] origin-top-left scale-100 bg-pink-100 sm:scale-100 lg:h-[300px] lg:w-[500px]`}
        onClick={(e) => {
          // if (flipping) return;
          handleLetterClick(e as any);
        }}
      >
        <label htmlFor="check" className="absolute cursor-pointer">
          {/* Letter Content */}
          <div
            className={`absolute ${contentZ} top-[10px] ml-[1px] flex h-[280px] w-[490px] scale-50 items-center justify-center rounded-xs bg-white transition-transform duration-700 ease-in-out md:ml-1 lg:h-[540px] lg:w-[980px] ${noteTransform} translate-x-[-24%] lg:translate-x-[-25%] ${
              isOpen ? "cursor-pointer hover:shadow-lg" : ""
            }`}
            style={{ left: "50%" }}
          >
            <CardFlipDemo
              contentOut={<>{letterOut}</>}
              contentFull={<>{letterFull}</>}
              contentBottom={<>{letterBotton}</>}
              onEndOpen={(e): void => {
                setTimeout(() => {
                  setNoteTransform(isMobile ? "translate-y-[60px] rotate-[-4deg] scale-75" : "translate-y-15 rotate-[-5deg] scale-75");
                  setIsTransitioning(false);
                }, 400);
              }}
              onClose={(e): void => {
                if (!isOpen || isTransitioning) return;
                handleLetterClick(e);
              }}
            />
          </div>
          {letterBox}
        </label>
      </div>
    </div>
  );

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-pink-200 via-pink-100 to-rose-200 px-2 font-[Courgette] text-gray-900 sm:px-4 lg:flex"
      style={{ background: "#ffebeb", fontFamily: "SVN-ComicSansMS" }}
    >
      {floatingHearts}
      {backButton}
      {letterContent}
    </div>
  );
};

export default LoveLetter;
