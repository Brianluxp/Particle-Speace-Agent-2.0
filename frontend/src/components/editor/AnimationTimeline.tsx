import { useEffect, useRef, useState } from "react";
import type { EditorTrack } from "../../types/editor";

interface AnimationTimelineProps {
  tracks: EditorTrack[];
  seconds: number;
  hasEmbeddedAnimation: boolean;
  onSecondsChange: (seconds: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

const DURATION_SECONDS = 10;
const TICK_MS = 100;

export function AnimationTimeline({
  tracks,
  seconds,
  hasEmbeddedAnimation,
  onSecondsChange,
  onPlayingChange,
}: AnimationTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const stopTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  const handlePlay = () => {
    stopTimer();
    let current = seconds >= DURATION_SECONDS ? 0 : seconds;
    onSecondsChange(current);
    setIsPlaying(true);
    onPlayingChange(true);

    intervalRef.current = window.setInterval(() => {
      current = Math.min(DURATION_SECONDS, current + 0.1);
      onSecondsChange(current);

      if (current >= DURATION_SECONDS) {
        stopTimer();
        setIsPlaying(false);
        onPlayingChange(false);
      }
    }, TICK_MS);
  };

  const handlePause = () => {
    stopTimer();
    setIsPlaying(false);
    onPlayingChange(false);
  };

  const handleReset = () => {
    stopTimer();
    setIsPlaying(false);
    onPlayingChange(false);
    onSecondsChange(0);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value);
    onSecondsChange(val);
  };

  const formattedSeconds = String(Math.floor(seconds)).padStart(2, "0");
  const timeDisplay = `00:${formattedSeconds}`;

  return (
    <div className="editor-animation-timeline">
      <div className="timeline-header">
        <div className="timeline-controls">
          {isPlaying ? (
            <button
              type="button"
              className="timeline-btn pause-btn"
              aria-label="暂停时间轴"
              onClick={handlePause}
            >
              ⏸ 暂停
            </button>
          ) : (
            <button
              type="button"
              className="timeline-btn play-btn"
              aria-label="播放时间轴"
              onClick={handlePlay}
            >
              ▶ 播放
            </button>
          )}

          <button
            type="button"
            className="timeline-btn reset-btn"
            aria-label="复位时间轴"
            onClick={handleReset}
          >
            ⏹ 复位
          </button>

          <span className="timeline-time-display" data-testid="timeline-time">
            {timeDisplay}
          </span>
        </div>

        <div className="timeline-notice">
          {hasEmbeddedAnimation
            ? "正在播放模型内嵌动画"
            : "动画轨道演示，不会修改模型文件"}
        </div>
      </div>

      <div className="timeline-scrubber-area">
        <label htmlFor="timeline-range-input" className="sr-only">
          时间轴位置
        </label>
        <input
          id="timeline-range-input"
          type="range"
          min={0}
          max={DURATION_SECONDS}
          step={0.1}
          value={seconds}
          onChange={handleSliderChange}
          className="timeline-range-slider"
        />
      </div>

      <div className="timeline-tracks">
        {tracks.map((track) => (
          <div className="timeline-track-row" key={track.id}>
            <span className={`track-label color-${track.color}`}>
              {track.label}
            </span>
            <div className="track-bar">
              {track.keyframes.map((kf) => (
                <span
                  key={kf}
                  className="keyframe-marker"
                  style={{ left: `${(kf / DURATION_SECONDS) * 100}%` }}
                />
              ))}
              <div
                className="track-progress-fill"
                style={{ width: `${(seconds / DURATION_SECONDS) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
