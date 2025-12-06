import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

type CustomSwiperProps = {
  photos: string[];
  title: string;
};

const CustomSwiper = ({ photos, title }: CustomSwiperProps) => {
  const swiperRef = useRef<any>(null);

  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const updatePosition = () => {
    if (!swiperRef.current) return;
    setIsBeginning(swiperRef.current.isBeginning);
    setIsEnd(swiperRef.current.isEnd);
  };

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation]}
        onSwiper={(s) => {
          swiperRef.current = s;
          updatePosition();
        }}
        onSlideChange={updatePosition}
        slidesPerView={1}
        spaceBetween={10}
      >
        {photos.map((photo, index) => (
          <SwiperSlide key={index}>
            <img
              src={photo}
              alt={title}
              draggable={false}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Prev Button */}
      {!isBeginning && (
        <button
          type="button"
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10
                     cursor-pointer flex items-center justify-center
                     w-10 h-10 bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            swiperRef.current?.slidePrev();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <ChevronLeft size={30} className="pointer-events-none" />
        </button>
      )}

      {/* Next Button */}
      {!isEnd && (
        <button
          type="button"
          aria-label="Next slide"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                     cursor-pointer flex items-center justify-center
                     w-10 h-10 bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            swiperRef.current?.slideNext();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <ChevronRight size={30} className="pointer-events-none" />
        </button>
      )}
    </div>
  );
};

export default CustomSwiper;
