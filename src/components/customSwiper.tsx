import { ChevronLeft, ChevronRight } from "lucide-react";
import {  useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

type CustomSwiperProps = {
  photos: string[];
  title: string;
};

const CustomSwiper = ({ photos, title }: CustomSwiperProps) => {
  const prevRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation]}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onSwiper={(swiper) => {
          // Re-assign now that refs exist
          // @ts-ignore
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-ignore
          swiper.params.navigation.nextEl = nextRef.current;

          swiper.navigation.destroy();
          swiper.navigation.init();
          swiper.navigation.update();

          setIsBeginning(swiper.isBeginning);
          setIsEnd(swiper.isEnd);
        }}
        onSlideChange={(swiper) => {
          setIsBeginning(swiper.isBeginning);
          setIsEnd(swiper.isEnd);
        }}
        slidesPerView={1}
        spaceBetween={10}
        className="overflow-hidden"
      >

        {photos.map((photo, index) => (
          <SwiperSlide key={index}>
            <img
              src={photo}
              alt={title}
              className="w-full h-[800px] object-cover transition-transform duration-500 hover:scale-105"
            />
          </SwiperSlide>
        ))}
      </Swiper>
      <div
        ref={prevRef}
        className={`
          absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition
          bg-background border hover:bg-primary/10 cursor-pointer
          ${isBeginning ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
      >
        <ChevronLeft size={28} />
      </div>

      <div
        ref={nextRef}
        className={`
          absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition
          bg-background border hover:bg-primary/10 cursor-pointer
          ${isEnd ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
      >
        <ChevronRight size={28} />
      </div>

    </div>
  );
};

export default CustomSwiper;