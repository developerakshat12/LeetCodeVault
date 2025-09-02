import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, Plus, Heart, Settings, Menu, X } from "lucide-react";
import { Link } from "wouter";

interface ResponsiveNavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSettingsClick?: () => void;
  onAddTopicClick?: () => void;
  currentUser?: any;
  showSearch?: boolean;
  title?: string;
  subtitle?: string;
}

export default function ResponsiveNavbar({
  searchQuery = "",
  onSearchChange,
  onSettingsClick,
  onAddTopicClick,
  currentUser,
  showSearch = true,
  title = "LeetCode Tracker",
  subtitle = "Organize your practice by topic"
}: ResponsiveNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const NavItems = () => (
    <>
      <Button 
        onClick={() => {
          onSettingsClick?.();
          setIsOpen(false);
        }}
        variant="outline" 
        className="flex items-center space-x-2 w-full sm:w-auto justify-start sm:justify-center"
        disabled={!currentUser}
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Button>
      <Link href="/favorites">
        <Button 
          variant="outline" 
          className="flex items-center space-x-2 w-full sm:w-auto justify-start sm:justify-center"
          onClick={() => setIsOpen(false)}
        >
          <Heart className="h-4 w-4" />
          <span>Favorites</span>
        </Button>
      </Link>
      {onAddTopicClick && (
        <Button 
          onClick={() => {
            onAddTopicClick();
            setIsOpen(false);
          }}
          className="flex items-center space-x-2 hover:bg-blue-600 w-full sm:w-auto justify-start sm:justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add Topic</span>
        </Button>
      )}
    </>
  );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title - Always visible */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <Link href="/">
              <div className="flex items-center space-x-2 sm:space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
                <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
                {subtitle && (
                  <span className="hidden md:block text-muted-foreground text-sm">
                    {subtitle}
                  </span>
                )}
              </div>
            </Link>
          </div>
          
          {/* Search Bar - Hidden on mobile */}
          {showSearch && onSearchChange && (
            <div className="hidden md:flex relative flex-1 max-w-md mx-4 lg:mx-8">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search topics or problems..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-3">
            <NavItems />
          </div>
          
          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  {/* Mobile Search */}
                  {showSearch && onSearchChange && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search topics or problems..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  )}
                  
                  {/* Mobile Navigation Items */}
                  <div className="flex flex-col space-y-3">
                    <NavItems />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
