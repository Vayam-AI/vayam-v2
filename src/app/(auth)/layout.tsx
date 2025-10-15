export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen max-h-screen flex flex-col overflow-hidden">
      {/* Fixed navbar at the top */}
      {/* <Navbar /> */}
      
      {/* Main content area with calculated height */}
      <main className="flex-1 flex items-center justify-center overflow-auto">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}