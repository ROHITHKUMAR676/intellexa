import React, { useEffect, useRef } from "react";
import "./CustomCursor.css";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const lottieContainerRef = useRef(null);
  const lottieInstanceRef = useRef(null);

  useEffect(() => {
    let destroyed = false;

    import("lottie-web").then((lottieWeb) => {
      const lottie = lottieWeb.default ?? lottieWeb;

      if (destroyed || !lottieContainerRef.current) return;

      import("../assets/astro.json").then((animData) => {
        if (destroyed || !lottieContainerRef.current) return;

        lottieInstanceRef.current = lottie.loadAnimation({
          container: lottieContainerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: animData.default ?? animData,
        });
      });
    });

    return () => {
      destroyed = true;
      lottieInstanceRef.current?.destroy();
      lottieInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const handleMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.display = "block";
        cursorRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
    };

    const handleEnter = () => {
      cursorRef.current?.classList.add("cursor--hover");
      lottieInstanceRef.current?.setSpeed(1.6);
    };

    const handleLeave = () => {
      cursorRef.current?.classList.remove("cursor--hover");
      lottieInstanceRef.current?.setSpeed(1);
    };

    document.addEventListener("mousemove", handleMove);

    const interactive =
      "a, button, input, textarea, select, label, [role='button'], .clickable";

    document.querySelectorAll(interactive).forEach((el) => {
      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
    });

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.querySelectorAll(interactive).forEach((el) => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
      });
    };
  }, []);

  return (
    <div ref={cursorRef} className="orbit-cursor" aria-hidden="true">
      <div ref={lottieContainerRef} className="orbit-cursor__lottie" />
      <div className="orbit-cursor__dot" />
    </div>
  );
}