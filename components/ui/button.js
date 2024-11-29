export function Button({ children, ...props }) {
  return (
    <button 
      className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800" 
      {...props}
    >
      {children}
    </button>
  );
} 