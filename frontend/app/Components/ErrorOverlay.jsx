export const ErrorOverlay = ({ message }) => {
    return (
      <div className="absolute top-0 left-0 z-10 flex items-center justify-center w-full h-full bg-red-500 bg-opacity-50">
        <div className="text-white">Error: {message}</div>
      </div>
    );
  };