const ErrorDisplay = ({ error }) => {
    if (!error?.message) return null;
    
    return (
      <div className="p-2 mb-2 text-sm text-red-600 bg-red-100 rounded-lg">
        {error.message}
      </div>
    );
  };

  export default ErrorDisplay;
  