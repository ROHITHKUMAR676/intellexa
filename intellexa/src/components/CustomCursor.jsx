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
    let currentX = mouseX;
    let currentY = mouseY;
    let raf;

    const handleMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.display = "block";
      }
    };

    const handleDown = () => {
      cursorRef.current?.classList.add("cursor--active");
      lottieInstanceRef.current?.setSpeed(2.2);
    };

    const handleUp = () => {
      cursorRef.current?.classList.remove("cursor--active");
      lottieInstanceRef.current?.setSpeed(1);
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
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("mouseup", handleUp);

    const interactive =
      "a, button, input, textarea, select, label, [role='button'], .clickable";

    document.querySelectorAll(interactive).forEach((el) => {
      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
    });

    const animate = () => {
      currentX += (mouseX - currentX) * 0.22;
      currentY += (mouseY - currentY) * 0.22;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("mouseup", handleUp);
      document.querySelectorAll(interactive).forEach((el) => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
      });
    };
  }, []);

  useEffect(() => {
    const createSpark = (e) => {
      const container = cursorRef.current;
      for (let i = 0; i < 12; i++) {
        const spark = document.createElement("span");
        spark.className = "space-spark";
        spark.style.left = `${e.clientX}px`;
        spark.style.top = `${e.clientY}px`;
        spark.style.setProperty("--dx", `${(Math.random() - 0.5) * 80}px`);
        spark.style.setProperty("--dy", `${(Math.random() - 0.5) * 80}px`);
        container.appendChild(spark);
        setTimeout(() => spark.remove(), 1000);
      }
    };

    document.addEventListener("click", createSpark);
    return () => document.removeEventListener("click", createSpark);
  }, []);

  return (
    <div ref={cursorRef} className="orbit-cursor" aria-hidden="true">
      <div ref={lottieContainerRef} className="orbit-cursor__lottie" />
    </div>
  );
}