"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { isAdminUser } from "@/lib/admin";


export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const isAdmin = isAdminUser(session?.user?.email);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      // Use Next.js router for navigation
      router.push("/signin");
    } catch {
      router.push("/signin");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm px-5"
      >
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="transition-all duration-200"
            >
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <span className="font-roboto-slab text-2xl sm:text-3xl font-bold text-foreground tracking-tight group-hover:text-foreground/90 transition-colors">
                  Vayam
                </span>

              </Link>
            </motion.div>

            <div className="hidden md:flex items-center space-x-2">
              {!isClientMounted || status === "loading" ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                </div>
              ) : !session?.user ? (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="hover:bg-muted/80 transition-all duration-200"
                  >
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 shadow-sm"
                  >
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 rounded-full hover:bg-muted/80 transition-all duration-200 ring-2 ring-transparent hover:ring-border/50"
                      >
                        <Menu className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 animate-scale-in shadow-lg border-border/50 bg-card/95 backdrop-blur-sm p-2"
                    >
                      <div className="px-3 py-3 border-b border-border/50 mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {session?.user?.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session?.user?.email}
                        </p>
                        {isAdmin && (
                          <p className="text-xs text-primary font-medium mt-1">
                            Admin Access
                          </p>
                        )}
                      </div>

                      <DropdownMenuItem
                        asChild
                        className="hover:bg-muted/80 transition-colors rounded-md my-1"
                      >
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <Home className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        asChild
                        className="hover:bg-muted/80 transition-colors rounded-md my-1"
                      >
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>

                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator className="bg-border/50 my-2" />
                          <div className="px-3 py-1 mb-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Admin Actions
                            </p>
                          </div>
                          <DropdownMenuItem
                            asChild
                            className="hover:bg-muted/80 transition-colors rounded-md my-1"
                          >
                            <Link
                              href="/admin/questions"
                              className="flex items-center gap-3 px-3 py-2"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Manage Questions
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator className="bg-border/50 my-2" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors rounded-md my-1"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="h-10 w-10 rounded-full hover:bg-muted/80 transition-all duration-200 ring-2 ring-transparent hover:ring-border/50"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -180, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 180, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 180, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -180, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 z-40 bg-background/90 backdrop-blur-md md:hidden"
              onClick={closeMobileMenu}
            />

            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-72 bg-card/95 backdrop-blur-md border-l border-border/50 shadow-2xl md:hidden"
            >
              <div className="flex flex-col h-full">
                {session?.user && (
                  <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
                    <p className="text-sm font-medium text-foreground">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session?.user?.email}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-primary font-medium mt-1">
                        Admin Access
                      </p>
                    )}
                  </div>
                )}

                <div className="flex-1 py-6 px-4 space-y-1">
                  {!isClientMounted || status === "loading" ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                    </div>
                  ) : !session?.user ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="w-full justify-start h-12 hover:bg-muted/80 transition-all duration-200"
                      >
                        <Link
                          href="/signin"
                          onClick={closeMobileMenu}
                          className="text-base"
                        >
                          Sign In
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        asChild
                        className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 transition-all duration-200"
                      >
                        <Link
                          href="/signup"
                          onClick={closeMobileMenu}
                          className="text-base"
                        >
                          Get Started
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="w-full justify-start h-12 hover:bg-muted/80 transition-all duration-200"
                      >
                        <Link
                          href="/dashboard"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-4 text-base"
                        >
                          <Home className="h-5 w-5" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="w-full justify-start h-12 hover:bg-muted/80 transition-all duration-200"
                      >
                        <Link
                          href="/profile"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-4 text-base"
                        >
                          <User className="h-5 w-5" />
                          Profile
                        </Link>
                      </Button>

                      {isAdmin && (
                        <>
                          <div className="border-t border-border/50 my-4" />
                          <div className="px-3 py-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Admin Actions
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="w-full justify-start h-12 hover:bg-muted/80 transition-all duration-200"
                          >
                            <Link
                              href="/admin/questions"
                              onClick={closeMobileMenu}
                              className="flex items-center gap-4 text-base"
                            >
                              <MessageSquare className="h-5 w-5" />
                              Manage Questions
                            </Link>
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {session?.user && (
                  <div className="border-t border-border/50 p-4 bg-muted/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                    >
                      <LogOut className="h-5 w-5 mr-4" />
                      <span className="text-base">Logout</span>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}