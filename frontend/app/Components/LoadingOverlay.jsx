export const LoadingOverlay = ({ message = "Loading..." }) => {
    return (
      <div className="absolute top-0 left-0 z-10 flex items-center justify-center w-full h-full bg-white bg-opacity-50">
        <div className="text-gray-800">{message}</div>
      </div>
    );
  };