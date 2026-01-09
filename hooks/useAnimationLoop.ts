// src/hooks/useAnimationLoop.ts
import { useState, useEffect, useRef } from "react";

// duration: アニメーションが1周するのにかかる時間（ミリ秒）
export const useAnimationLoop = (
  duration: number = 3000,
  isPlaying: boolean = true
) => {
  // 0.0 から 1.0 の間を推移するアニメーション進行度
  const [animationProgress, setAnimationProgress] = useState(0);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const animate = (time: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = time;
    }
    // 経過時間を計算
    const elapsed = time - startTimeRef.current;
    // 進行度を 0.0 ~ 1.0 に正規化（剰余演算でループさせる）
    const progress = (elapsed % duration) / duration;

    setAnimationProgress(progress);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = undefined; // 開始時間をリセット
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    // クリーンアップ関数
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, duration]); // isPlayingが切り替わるたびに実行

  return animationProgress;
};
