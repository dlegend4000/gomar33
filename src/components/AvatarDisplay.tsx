export default function AvatarDisplay() {
  return (
    <div className="relative w-64 h-64 mb-16 flex items-center justify-center">
      <div className="absolute inset-0 bg-blue-400 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-pulse-slow" />
      <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl relative z-10 bg-gradient-to-br from-blue-100 to-blue-500 dark:from-blue-900 dark:to-blue-700 flex items-center justify-center group cursor-pointer transition-transform hover:scale-105 duration-500">
        <div
          className="absolute inset-0 bg-cover opacity-80 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[1px]" />
      </div>
    </div>
  );
}
