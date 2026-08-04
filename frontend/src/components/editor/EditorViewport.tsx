import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "../../model-viewer";

interface EditorViewportProps {
  modelUrl: string;
  isTimelinePlaying: boolean;
  onAnimationAvailability: (available: boolean) => void;
  onNotice: (message: string) => void;
}

export function EditorViewport({
  modelUrl,
  isTimelinePlaying,
  onAnimationAvailability,
  onNotice,
}: EditorViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement>(null);
  const [hasError, setHasError] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showShadow, setShowShadow] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    setHasError(false);
  }, [modelUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const onError = () => setHasError(true);
    const onLoad = () => {
      setHasError(false);
      if (viewer.availableAnimations) {
        onAnimationAvailability(viewer.availableAnimations.length > 0);
      } else {
        onAnimationAvailability(false);
      }
    };

    viewer.addEventListener("error", onError);
    viewer.addEventListener("load", onLoad);

    return () => {
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("load", onLoad);
    };
  }, [modelUrl, onAnimationAvailability]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (viewer.availableAnimations && viewer.availableAnimations.length > 0) {
      if (isTimelinePlaying) {
        viewer.play();
      } else {
        viewer.pause();
      }
    }
  }, [isTimelinePlaying]);

  const handleResetCamera = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraOrbit = "35deg 70deg auto";
    if (typeof viewer.resetTurntableRotation === "function") {
      viewer.resetTurntableRotation();
    }
    if (typeof viewer.jumpCameraToGoal === "function") {
      viewer.jumpCameraToGoal();
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current?.requestFullscreen) {
      void containerRef.current.requestFullscreen();
    } else {
      onNotice("当前浏览器不支持视口全屏");
    }
  };

  const handleTakeScreenshot = async () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      if (typeof viewer.toBlob !== "function") {
        throw new Error("toBlob not supported");
      }
      const blob = await viewer.toBlob({ idealAspect: true });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "particle-space-editor.png";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      onNotice("当前浏览器无法导出视口截图");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`editor-viewport-area ${showGrid ? "has-grid" : ""}`}
    >
      <div className="viewport-toolbar">
        <div className="toolbar-group left">
          <button
            type="button"
            className="viewport-btn"
            onClick={handleResetCamera}
          >
            重置视角
          </button>
          <button
            type="button"
            className="viewport-btn"
            onClick={handleFullscreen}
          >
            全屏视口
          </button>
          <button
            type="button"
            className="viewport-btn"
            onClick={handleTakeScreenshot}
          >
            导出视口截图
          </button>
        </div>

        <div className="toolbar-group right">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
            />
            自动旋转
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showShadow}
              onChange={(e) => setShowShadow(e.target.checked)}
            />
            阴影
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            背景网格
          </label>
        </div>
      </div>

      <div className="viewport-stage">
        {hasError ? (
          <div className="viewport-error-overlay">
            <p>模型加载失败</p>
            <small>请检查模型文件路径及格式</small>
          </div>
        ) : (
          <model-viewer
            ref={viewerRef}
            src={modelUrl}
            alt="真实模型视口"
            camera-controls
            auto-rotate={autoRotate ? true : undefined}
            shadow-intensity={showShadow ? "1" : "0"}
          />
        )}

        <div className="viewport-gizmo" aria-hidden="true">
          <span className="axis-cube">3D</span>
        </div>
      </div>
    </div>
  );
}
