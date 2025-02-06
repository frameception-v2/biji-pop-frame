"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, { AddFrame, type Context } from "@farcaster/frame-sdk";
import { PROJECT_TITLE, INITIAL_IMAGE_URL, DREAMING_IMAGE_URL, CONFETTI_GIF_URL, POPART_API_URL } from "~/lib/constants";

type FrameState = 'initial' | 'processing' | 'result';

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [frameState, setFrameState] = useState<FrameState>('initial');
  const [popArtResult, setPopArtResult] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const generatePopArt = useCallback(async (pfpUrl: string) => {
    try {
      const response = await fetch(POPART_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: pfpUrl })
      });
      
      const { generatedImage } = await response.json();
      return generatedImage;
    } catch (error) {
      console.error('PopArt generation failed:', error);
      return null;
    }
  }, []);

  const handleMakePop = useCallback(async () => {
    if (!context?.user) return;

    setFrameState('processing');
    
    // Show dreaming image for 2 seconds before processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const resultUrl = await generatePopArt(context.user.pfpUrl);
    
    if (resultUrl) {
      setPopArtResult(resultUrl);
      setFrameState('result');
      
      // Play confetti animation once
      setTimeout(() => {
        const confetti = new Image();
        confetti.src = CONFETTI_GIF_URL;
      }, 500);
    }
  }, [context, generatePopArt]);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) return;

      setContext(context);
      setAdded(context.client.added);

      sdk.on("frameAdded", () => setAdded(true));
      sdk.on("frameRemoved", () => setAdded(false));
      sdk.actions.ready({});
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => sdk.removeAllListeners();
    }
  }, [isSDKLoaded]);

  if (!isSDKLoaded) return <div>Loading...</div>;

  return (
    <div style={{
      paddingTop: context?.client.safeAreaInsets?.top ?? 0,
      paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
      paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
      paddingRight: context?.client.safeAreaInsets?.right ?? 0,
    }}>
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-700 dark:text-gray-300">
          {PROJECT_TITLE}
        </h1>

        {frameState === 'initial' && (
          <div className="relative">
            <img 
              src={INITIAL_IMAGE_URL}
              alt="POP ART FRAME"
              className="w-full h-auto border-4 border-black"
            />
            <button
              onClick={handleMakePop}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors"
              style={{
                fontFamily: 'Comic Sans MS',
                textShadow: '2px 2px 0px red',
                boxShadow: '4px 4px 0px black'
              }}
            >
              MAKE ME POP!
            </button>
          </div>
        )}

        {frameState === 'processing' && (
          <div className="animate-pulse">
            <img
              src={DREAMING_IMAGE_URL}
              alt="Dreaming of pop art"
              className="w-full h-auto"
            />
            <p className="text-center mt-4 text-lg font-comic">"when I grow up all I want is to make it pop"</p>
          </div>
        )}

        {frameState === 'result' && popArtResult && (
          <div className="relative">
            <img
              src={popArtResult}
              alt="Your pop art transformation"
              className="w-full h-auto border-4 border-black"
            />
            {typeof window !== 'undefined' && (
              <img
                src={CONFETTI_GIF_URL}
                alt="Confetti explosion"
                className="absolute inset-0 w-full h-full object-cover animate-confetti"
                style={{ animation: 'confetti 1s linear forwards' }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
