export const tokens = {
  container: "flex-1 bg-white px-7 justify-between items-center py-6",
  title: "text-[26px] text-center text-primary-400 font-roboto-bold mt-10",
  desc: "text-[20px] text-neutral-800 text-center mt-10 px-5 font-roboto",
  button: "bg-black w-full py-3.5 rounded-xl mt-2 items-center",
  buttonText: "text-white text-[17px] font-roboto-bold",

  sizes: {
    logo: (w: number, h: number) => `w-[${w}px] h-[${h}px]`,
    image: (w: number, h: number) => `w-[${w}px] h-[${h}px]`,
  },

  colors: {
    primary: "#000000",
  },
};
