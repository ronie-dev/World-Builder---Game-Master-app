import { createContext, useContext } from "react";

export const GalleryContext = createContext({ openGallery: () => {} });
export const useGallery = () => useContext(GalleryContext);
