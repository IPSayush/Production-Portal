import { FiImage } from 'react-icons/fi';

function ImageFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
      <FiImage className="w-7 h-7 text-gray-300" />
      <span className="text-xs text-gray-400">Image not available</span>
    </div>
  );
}

export default function SheetCardImage({ imageUrl, title }) {
  return (
    <div className="w-full h-36 md:h-40 bg-gray-100 overflow-hidden rounded-t-xl">
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex';
              }
            }}
          />
          <div className="hidden w-full h-full">
            <ImageFallback />
          </div>
        </>
      ) : (
        <ImageFallback />
      )}
    </div>
  );
}
