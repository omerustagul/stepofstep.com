import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Sayfa yolu değiştiğinde ekranı en yukarı kaydır
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // "smooth" yerine "instant" kullanarak sayfanın sıfırdan yüklendiği hissini veriyoruz
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
